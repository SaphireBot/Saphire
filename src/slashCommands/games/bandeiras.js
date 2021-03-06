const { init, plugins: { formatString } } = require('../../../modules/games/flagGame')

module.exports = {
    name: 'bandeiras',
    description: '[games] Você é bom em adivinhar bandeiras?',
    dm_permission: false,
    type: 1,
    options: [
        {
            name: 'start',
            description: '[games] Inicie um quiz de bandeiras',
            type: 1,
            options: [
                {
                    name: 'mode',
                    description: 'Escolha o modo de jogo',
                    type: 3,
                    required: true,
                    choices: [
                        {
                            name: 'Com Opções',
                            value: 'withOptions'
                        },
                        {
                            name: 'Sem Opções',
                            value: 'withoutOptions'
                        }
                    ]
                }
            ]
        },
        {
            name: 'options',
            description: '[games] Outras opções do jogo',
            type: 1,
            options: [
                {
                    name: 'select_country',
                    description: 'Pesquise por uma bandeira',
                    type: 3,
                    autocomplete: true
                },
                {
                    name: 'flag-adminstration',
                    description: 'Comandos administrativos do comando bandeiras',
                    type: 3,
                    autocomplete: true
                },
                {
                    name: 'adicional',
                    description: 'Informações adicionais administrativas',
                    type: 3
                }
            ]
        },
        {
            name: 'points',
            description: '[games] Confira os pontos do jogo',
            type: 1,
            options: [
                {
                    name: 'user',
                    description: 'Escolha um usuário para ver os pontos dele',
                    type: 6
                },
                {
                    name: 'search_user',
                    description: 'Pesquise por um usuário para ver os pontos',
                    type: 3,
                    autocomplete: true
                }
            ]
        }
    ],
    async execute({ interaction: interaction, client: client, database: Database, modals: modals, emojis: e }) {

        const { options, user: author } = interaction
        const subCommand = options.getSubcommand()
        const adminCommand = options.getString('flag-adminstration') || null
        const flagSelected = options.getString('select_country')
        const mode = options.getString('mode')
        const flags = Database.Flags.get('Flags') || []
        const flag = flags.find(f => f.country.find(d => d === flagSelected))

        if (subCommand === 'start') return init(mode, interaction)
        if (subCommand === 'options') return optionsCommand()
        if (subCommand === 'points') return userPoints()

        async function optionsCommand() {

            if (flagSelected && !adminCommand)
                return showCoutry()

            switch (adminCommand) {
                case 'newFlag': await interaction.showModal(modals.newFlag); break;
                case 'editFlag': editFlag(); break;
                case 'remove': removeFlag(); break;
                case 'list': listFlags(); break;
                case 'noflaglist': flagWithoutImage(); break;
                case 'addNewSynonym': addNewSynonym(); break;
                case 'removeSynonym': removeSynonym(); break;
                default:
                    await interaction.reply({
                        content: `${e.Deny} | Nenhuma função foi dada.`,
                        ephemeral: true
                    });
                    break;
            }

            return
        }

        async function editFlag() {

            if (!flagSelected || !flag)
                return await interaction.reply({
                    content: `${e.Deny} | Para editar uma bandeira, você precisa selecionar uma bandeira na lista de bandeiras.`,
                    ephemeral: true
                })

            return interaction.showModal(modals.editFlag(flag.flag, flag.country[0], flag.image))
        }

        async function userPoints() {

            const user = client.users.cache.get(options.getString('search_user')) || options.getUser('user') || author
            const userData = await Database.User.findOne({ id: user.id }, 'GamingCount.FlagCount')

            if (!user || !userData)
                return await interaction.reply({
                    content: `${e.Database} | Nenhum dado foi encontrado referente a \`${user.tag} - ${user.id}\``,
                    ephemeral: true
                })

            const points = userData.GamingCount?.FlagCount || 0
            const format = user.id === author.id ? 'Você' : user.username

            return await interaction.reply({
                content: `${e.Info} | ${format} acertou ${points} bandeiras no Flag Gaming.`
            })

        }

        async function addNewSynonym() {

            const newName = options.getString('adicional')
            const flagData = [...flags]

            if (!flag)
                return await interaction.reply({
                    content: `${e.Deny} | Eu não achei nenhuma bandeira com os dados informados. Selecione uma na lista de bandeiras`,
                    ephemeral: true
                })

            if (!newName)
                return await interaction.reply({
                    content: `${e.Deny} | Informe um sinônimo para a bandeira \`${flag.country[0]}\` no campo \`adicional\`.`,
                    ephemeral: true
                })

            for (let f of flagData)
                if (f.country.find(x => x.toLowerCase() === newName.toLowerCase()))
                    return await interaction.reply({
                        content: `${e.Deny} | O nome \`${newName}\` já existe no banco de dados.`
                    })

            const index = flagData.findIndex(f => f.flag === flag.flag)
            const countryData = flagData.splice(index, 1)[0]
            countryData.country.push(newName)
            Database.Flags.set('Flags', [{ flag: countryData.flag, country: [...countryData.country], image: countryData.image }, ...flagData])

            return await interaction.reply({
                content: `${e.Check} | O sinônimo \`${newName}\` foi adicionado com sucesso a bandeira ${formatString(countryData.country[0])}. Ficando com os sequintes sinônimos:\n> ${countryData.country.map(x => `\`${x}\``).join(', ')}`
            })
        }

        async function removeSynonym() {

            const flagData = [...flags]

            if (!flag)
                return await interaction.reply({
                    content: `${e.Deny} | Eu não achei nenhuma bandeira com os dados informados. Selecione uma bandeira na lista.`,
                    ephemeral: true
                })

            if (flag.country.length < 2)
                return await interaction.reply({
                    content: `${e.Deny} | Esta bandeira contem apenas 1 nome. Não é possível a remoção dele sem um nome adicional.`
                })

            let selectMenuObject = {
                type: 1,
                components: [{
                    type: 3,
                    custom_id: 'menu',
                    placeholder: `Sinônimos da bandeira ${formatString(flag.country[0])}`,
                    options: []
                }]
            }

            if (flag.country.length > 24) flag.country.length = 24
            for (let country of flag.country)
                selectMenuObject.components[0].options.push({
                    label: formatString(country),
                    emoji: e.Trash,
                    value: country,
                })

            selectMenuObject.components[0].options.push({
                label: 'Cancelar',
                emoji: e.Deny,
                value: 'cancel',
            })

            const msg = await interaction.reply({
                content: `${e.Loading} | Selecione o sinônimo que deseja remover.`,
                components: [selectMenuObject],
                fetchReply: true
            })

            const collector = msg.createMessageComponentCollector({
                filter: int => int.user.id === author.id,
                time: 60000,
                errors: ['time', 'max']
            })
                .on('collect', async int => {

                    const { values } = int
                    const value = values[0]

                    collector.stop()

                    if (value === 'cancel')
                        return await interaction.editReply({
                            content: `${e.Deny} | Exclução de sinônimos cancelada.`,
                            components: []
                        }).catch(() => { })

                    const index = flagData.findIndex(f => f.flag === flag.flag)
                    const countryData = flagData.splice(index, 1)[0]
                    const countryToRemoveIndex = countryData.country.findIndex(f => f === value)
                    countryData.country.splice(countryToRemoveIndex, 1)
                    Database.Flags.set('Flags', [{ flag: countryData.flag, country: [...countryData.country], image: countryData.image }, ...flagData])

                    return await interaction.editReply({
                        content: `${e.Check} | O sinônimo \`${formatString(value)}\` foi removido com sucesso da bandeira ${formatString(countryData.country[0])}. Ficando com os sequintes sinônimos:\n> ${countryData.country.map(x => `\`${x}\``).join(', ')}`,
                        components: []
                    }).catch(() => { })

                })
                .on('end', async (i, r) => {
                    if (r === 'user') return
                    return await interaction.editReply({
                        content: `${e.Deny} | Exclução de sinônimos cancelada.`,
                        components: []
                    }).catch(() => { })
                })
        }

        async function removeFlag() {

            if (!flagSelected || !flag)
                return await interaction.reply({
                    content: `${e.Deny} | Para editar uma bandeira, você precisa selecionar uma bandeira na lista de bandeiras.`,
                    ephemeral: true
                })

            const buttons = [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: 'REMOVER BANDEIRA',
                            custom_id: 'remove',
                            style: 'SUCCESS'
                        },
                        {
                            type: 2,
                            label: 'CANCELAR REMOÇÃO',
                            custom_id: 'cancel',
                            style: 'DANGER'
                        }
                    ]
                }
            ]

            const msg = await interaction.reply({
                embeds: [{
                    color: client.blue,
                    title: `${e.Database} Remoção de bandeira`,
                    description: `Você confirma remoção da bandeira ${flag.flag} \`${flag.country[0]}\` do banco de dados?`,
                    image: { url: flag.image || null }
                }],
                fetchReply: true,
                components: buttons
            })

            const collector = msg.createMessageComponentCollector({
                filter: int => int.user.id === author.id,
                time: 60000,
                errors: ['time']
            })
                .on('collect', async int => {

                    const { customId } = int
                    int.deferUpdate().catch(() => { })
                    collector.stop()

                    if (customId === 'remove') {
                        let newSet = flags.filter(data => data.country[0] !== flag.country[0])
                        Database.Flags.set('Flags', [...newSet])

                        return await interaction.editReply({
                            content: `${e.Check} | A bandeira \`${flag.country[0]}\` foi removida com sucesso.`,
                            embeds: [],
                            components: []
                        })
                    }

                    if (customId === 'cancel')
                        return await interaction.editReply({
                            content: `${e.Check} | Remoção cancelada.`,
                            embeds: [],
                            components: []
                        })

                })
                .on('end', async (i, r) => {
                    if (r !== 'user')
                        return await interaction.editReply({
                            content: `${e.Deny} | Comando cancelado por falta de resposta`,
                            embeds: [],
                            components: []
                        })
                    return
                })
        }

        async function showCoutry() {

            if (!flag)
                return await interaction.reply({
                    content: `${e.Deny} | Eu não achei nenhuma bandeira com os dados informados.`,
                    ephemeral: true
                })

            return await interaction.reply({
                embeds: [{
                    color: client.blue,
                    title: `${e.Database} ${client.user.username} Flag Info Database`,
                    description: `**${flag.flag || '\`EMOJI NOT FOUND\`'} - ${flag.country?.map(name => formatString(name))?.join(', ') || '\`NAME NOT FOUND\`'}**`,
                    image: { url: flag.image || null },
                    footer: { text: 'Se não aparecer a imagem, esta bandeira possui um link que é inválido.' }
                }]
            })
        }

        async function listFlags() {

            if (!flags || flags.length === 0)
                return await interaction.reply({
                    content: `${e.Deny} | Não há nenhuma bandeira no meu banco de dados.`,
                    ephemeral: true
                })

            let embeds = EmbedGenerator()
            let control = 0

            let emojis = ['⏪', '⬅️', '➡️', '⏩', '✖️']

            let buttons = [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            emoji: emojis[0],
                            custom_id: emojis[0],
                            style: 'PRIMARY'
                        },
                        {
                            type: 2,
                            emoji: emojis[1],
                            custom_id: emojis[1],
                            style: 'PRIMARY'
                        },
                        {
                            type: 2,
                            emoji: emojis[2],
                            custom_id: emojis[2],
                            style: 'PRIMARY'
                        },
                        {
                            type: 2,
                            emoji: emojis[3],
                            custom_id: emojis[3],
                            style: 'PRIMARY'
                        },
                        {
                            type: 2,
                            emoji: emojis[4],
                            custom_id: emojis[4],
                            style: 'DANGER'
                        }
                    ]
                }
            ]

            let msg = await interaction.reply({ embeds: [embeds[0]], fetchReply: true, components: buttons })
            if (embeds.length === 1) return

            let collector = msg.createMessageComponentCollector({
                filter: int => int.user.id === author.id,
                idle: 30000,
                errors: ['idle']
            })

                .on('collect', async int => {

                    const { customId } = int
                    int.deferUpdate().catch(() => { })

                    if (customId === emojis[4])
                        return collector.stop()

                    if (customId === emojis[0])
                        control = 0

                    if (customId === emojis[3])
                        control = embeds.length - 1

                    if (customId === emojis[1]) {
                        control--
                        if (control < 0) control = embeds.length - 1
                    }

                    if (customId === emojis[2]) {
                        control++
                        if (control >= embeds.length) control = 0
                    }

                    return await interaction.editReply({ embeds: [embeds[control]] }).catch(() => { })
                })
                .on('end', () => {
                    let embed = msg.embeds[0]
                    if (!embed) return
                    embed.color = client.red
                    embed.footer.text = `${embed.footer.text} | Comando cancelado`
                    return msg.edit({ embeds: [embed], components: [] }).catch(() => { })

                })

            function EmbedGenerator() {

                let array = [...new Set(flags.map(x => x.country[0]?.toLowerCase()))].sort()

                let amount = 15
                let Page = 1
                let embeds = []
                let length = array.length / 15 <= 1 ? 1 : parseInt((array.length / 15) + 1)

                for (let i = 0; i < array.length; i += 15) {

                    let current = array.slice(i, amount),
                        description = current.map(data => {

                            let f = flags.find(d => d.country[0]?.toLowerCase() === data)

                            return `> ${f.flag} **${formatString(f.country[0])}**`
                        }).join("\n")

                    if (current.length > 0) {

                        embeds.push({
                            color: client.blue,
                            title: `${e.Database} Database Flag Game List - ${Page}/${length}`,
                            description: `${description}`,
                            footer: { text: `${array.length} Flags contabilizadas` }
                        })

                        Page++
                        amount += 15

                    }

                }

                return embeds;
            }
        }

        async function flagWithoutImage() {

            let arr = []

            for (let f of flags)
                if (!f.image) arr.push(f)

            if (arr.length === 0)
                return await interaction.reply({
                    content: `${e.Check} | Todas as bandeiras estão com imagem no meu banco de dados.`,
                    ephemeral: true
                })

            let format = arr.map(flag => `${flag.flag} \`${formatString(flag.country[0])}\``).join(', ')

            return await interaction.reply({
                content: `${e.Warn} | Estas são as bandeiras que estão sem imagem.\n> ${format}`
            }).catch(async () => {

                let newFormat = format.slice(0, 1500)
                return await interaction.reply(`${e.Warn} | Estas são as bandeiras que estão sem imagem.\n> ${newFormat}...`)
            })
        }
    }
}