const { MessageAttachment } = require('discord.js')
const { e } = require('../../../JSON/emojis.json')
const { Canvas } = require('canvacord')
const Error = require('../../../modules/functions/config/errors')

module.exports = {
    name: 'brilho',
    aliases: ['brightness '],
    category: 'images',
    ClientPermissions: ['ATTACH_FILES'],
    emoji: '📸',
    usage: '<brilho> <@user> [number]',
    description: 'Efeito de clariamento',

    execute: async (client, message, args, prefix, MessageEmbed, Database) => {

        let user = message.mentions.users.first() || message.mentions.repliedUser || await client.users.cache.get(args[0]) || message.author
        let avatar = user.displayAvatarURL({ format: 'png' })

        let number = parseInt(args[1]) || parseInt(args[0]) || 1
        if (isNaN(number)) number = 1

        if (number > 100 || number < 1)
            return message.reply(`${e.Deny} | O número não pode ser maior que **100**`)

        try {
            return message.reply(`${e.Loading} | Carregando...`).then(async msg => {
                msg.delete().catch(() => { })
                message.reply({ files: [new MessageAttachment(await Canvas.brightness(avatar, number), 'brightness.png')] })
            })
        } catch (err) {
            Error(message, err)
        }
    }
}