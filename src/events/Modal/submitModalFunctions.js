const Database = require('../../../modules/classes/Database'),
    { Emojis: e } = Database

async function submitModalFunctions(interaction, client) {

    const { customId, fields, user, channel, guild } = interaction

    switch (customId) {
        case 'setStatusModal': setStatusCommad(); break;
        case 'forcaChooseWord': forcaGame(); break;
        case 'BugModalReport': BugModalReport(); break;
        default:
            break;
    }

    return

    async function setStatusCommad() {

        const newStatus = fields.getTextInputValue('newStatus')

        if (!newStatus)
            return await interaction.reply({
                content: '❌ | Não foi possível verificar o seu novo status.',
                ephemeral: true
            })

        Database.updateUserData(user.id, 'Perfil.Status', newStatus)
        return await interaction.reply({
            content: `✅ | Novo status definido com sucesso!\n📝 | ${newStatus}`,
            ephemeral: true
        })
    }

    async function forcaGame() {
        const Forca = require('../../commands/games/classes/forca')
        const word = fields.getTextInputValue('componentOne')
        const { MessageEmbed } = require('discord.js')

        let data = await Database.Guild.findOne({ id: interaction.guildId }, 'Prefix'),
            prefix = data?.Prefix || Database.Config.Prefix

        let validate = /^[a-z ]+$/i

        if (!validate.test(word))
            return await interaction.reply({
                content: '❌ | O texto informado contém acentos ou números.',
                ephemeral: true
            })

        let message = await interaction.reply({
            content: '✅ | Ok! Palavra coletada com sucesso!',
            fetchReply: true
        })

        return new Forca().game(client, false, [], prefix, MessageEmbed, Database, word?.toLowerCase(), user, message.channel)
    }

    async function BugModalReport() {

        const textExplain = fields.getTextInputValue('bugTextInfo')
        const commandWithError = fields.getTextInputValue('commandBuggued') || 'Nenhum'
        let ChannelInvite = await channel.createInvite({ maxAge: 0 }).catch(() => { }) || null
        let guildName = ChannelInvite?.url ? `[${guild.name}](${ChannelInvite.url})` : guild.name
       
        const embed = {
            color: client.red,
            title: '📢 Report de Bug/Erro Recebido',
            url: ChannelInvite?.url || null,
            description: `> Reporte enviado de: ${guildName}\n> ${user.username} - \`${user.id}\`\n\`\`\`txt\n${textExplain || 'Nenhum dado coletado.'}\n\`\`\``,
            fields: [
                {
                    name: 'ℹ️ | Comando reportado',
                    value: `\`${commandWithError || 'Nenhum'}\``,
                }
            ],
            timestamp: new Date()
        }

        const { Config } = Database

        const guildChannel = client.channels.cache.get(Config.BugsChannelId)

        if (!guildChannel)
            return await interaction.reply({
                content: `❌ | Houve um erro ao encontrar o canal designado para recebimento de reports. Por favor, fale diretamente com meu criador: ${client.users.cache.get(Config.ownerId)?.tag || 'Não encontrado'}`,
                embeds: [embed],
                ephemeral: true
            })

        await guildChannel.send({ embeds: [embed] }).catch(async err => {
            return await interaction.reply({
                content: `❌ | Houve um erro ao enviar o reporte para o canal designado. Por favor, fale diretamente com meu criador: ${client.users.cache.get(Config.OwnerId)?.tag || 'Não encontrado'}\n${err}`,
                embeds: [embed],
                ephemeral: true
            })
        })

        return await interaction.reply({
            content: `✅ | Reporte enviado com sucesso! Muito obrigada pelo seu apoio.`,
            embeds: [embed],
            ephemeral: true
        })

    }

}

module.exports = submitModalFunctions