const Database = require('../../../modules/classes/Database'),
    { newReminder } = require('../plugins/modalPlugins')

async function selectMenuFunctions(interaction, client) {

    const { values, message, user, guild } = interaction

    let value = values[0]

    switch (value) {
        case 'newGiveaway': newGiveaway(); break;
        case 'newReminder': newReminder(interaction); break;
        case '914925531529609247':
        case '980293085298839572':
        case '920012840356683776':
        case '899393472283410493':
        case '894615786138787941':
            reactionRole(); break;
        default: break;
    }

    return

    async function reactionRole() {

        let msgConfirmation = 'ℹ | Feedback'

        for (let roleId of values)
            await addRole(roleId)

        function addRole(roleId) {

            let role = guild.roles.cache.get(roleId),
                member = guild.members.cache.get(user.id)

            if (!role)
                return msgConfirmation += `\n⚠️ | ${role?.name || 'NOT FOUND'} - **ERRO**`

            if (member.roles.cache.has(roleId)) {
                member.roles.remove(role)
                    .catch(() => msgConfirmation += `\n⚠️ | ${role || 'NOT FOUND'} - **ERRO**`)

                msgConfirmation += `\n❌ | ${role} - **REMOVIDO**`

            } else {
                member.roles.add(role)
                    .catch(() => msgConfirmation += `\n⚠️ | ${role} - **ERRO**`)

                msgConfirmation += `\n✅ | ${role} - **ADICIONADO**`
            }

        }

        return await interaction.reply({
            content: msgConfirmation,
            ephemeral: true
        })
    }

    async function newGiveaway() {

        let reference = message.reference,
            Message = await message.channel.messages.fetch(reference.messageId)

        if (user.id !== Message.author.id)
            return await interaction.reply({
                content: `❌ | Opa opa! Não foi você que iniciou o comando. Então, este não é o seu lugar.`,
                ephemeral: true
            })

        let data = await Database.Guild.findOne({ id: message.guild.id }, 'GiveawayChannel Prefix'),
            prefix = data?.Prefix || '-',
            ChannelId = data?.GiveawayChannel,
            Channel = message.guild.channels.cache.has(ChannelId)

        if (!ChannelId)
            return await interaction.reply({
                content: `❌ | Esse servidor não tem nenhum canal de sorteios configurado. Configure um canal usando \`${prefix}giveaway config #canalDeSorteios\`.`,
                ephemeral: true
            })

        if (ChannelId && !Channel) {

            await Database.Guild.updateOne(
                { id: guild.id },
                { $unset: { GiveawayChannel: 1 } }
            )

            return await interaction.reply({
                content: `❌ | O canal presente no meu banco de dados não condiz com nenhum canal do servidor. Por favor, configure um novo usando: \`${prefix}giveaway config #canalDeSorteios\`.`,
                ephemeral: true
            })
        }

        if (!Channel)
            return await interaction.reply({
                content: `❌ | O canal presente no meu banco de dados não condiz com nenhum canal do servidor. Por favor, configure um novo usando: \`${prefix}giveaway config #canalDeSorteios\`.`,
                ephemeral: true
            })

        const modal = {
            title: "Giveaway Central Create",
            custom_id: "createNewGiveaway",
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "winners",
                            label: "Quantos vencedores?",
                            style: 1,
                            min_length: 1,
                            max_length: 2,
                            placeholder: "1, 2, 3... Max: 20",
                            required: true
                        }
                    ]
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "timing",
                            label: "Quando devo efetuar o sorteio?",
                            style: 1,
                            min_length: 1,
                            max_length: 25,
                            placeholder: "Amanhã 14:35 | 24/06/2022 14:30 | 1d 20m 30s",
                            required: true
                        }
                    ]
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "prize",
                            label: "Qual é o prêmio?",
                            style: 2,
                            min_length: 5,
                            max_length: 1024,
                            placeholder: "Uma paçoca",
                            required: true
                        }
                    ]
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "requires",
                            label: "Requisitos? Se sim, quais?",
                            style: 2,
                            min_length: 5,
                            max_length: 1024,
                            placeholder: "Dar likes para @maria e estar no servidor a 5 dias"
                        }
                    ]
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "imageURL",
                            label: "Quer alguma imagem no sorteio?",
                            style: 1,
                            placeholder: "https://i.imgur.com/aGaDNeL.jpeg"
                        }
                    ]
                }
            ]
        }

        return await interaction.showModal(modal)

    }

}

module.exports = selectMenuFunctions