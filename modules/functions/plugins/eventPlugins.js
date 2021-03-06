function eightyYears(formatBr = false) {

    const date = new Date(Date.now() - 3155760000000)
    date.setHours(date.getHours() - 3)

    let Dia = FormatNumber(date.getDate()),
        Ano = date.getFullYear()

    if (formatBr)
        return `${Dia}/${FormatNumber(date.getMonth() + 1)}/${Ano}`

    return `${Ano}-${FormatNumber(date.getMonth() + 1)}-${Dia}`
}

function Now(formatBr = false) {

    const date = new Date(Date.now() - 410248800000)
    date.setHours(date.getHours() - 3)

    let Dia = FormatNumber(date.getDate()),
        Ano = date.getFullYear()

    if (formatBr)
        return `${Dia}/${FormatNumber(date.getMonth() + 1)}/${Ano}`

    return `${Ano}-${FormatNumber(date.getMonth() + 1)}-${Dia}`

}

function FormatNumber(data) {
    return data < 10 ? `0${data}` : data
}

function getUser(nameOrId, client) {

    return client.users.cache.find(data => {
        return data.username?.toLowerCase() === nameOrId?.toLowerCase()
            || data.tag?.toLowerCase() === nameOrId?.toLowerCase()
            || data.id === nameOrId?.toLowerCase()
    })
}

function day(tomorrow = false) {

    const date = new Date()
    date.setHours(date.getHours() - 3)

    if (tomorrow)
        date.setDate(date.getDate() + 1)

    let Mes = FormatNumber(date.getMonth() + 1),
        Dia = FormatNumber(date.getDate()),
        Ano = date.getFullYear()

    return `${Dia}/${Mes}/${Ano}`
}

async function newReminder(interaction) {

    const modal = {
        title: "New Reminder Creation",
        custom_id: "newReminder",
        components: [
            {
                type: 1,
                components: [{
                    type: 4,
                    custom_id: "time",
                    label: "Para quando é o lembrete?",
                    style: 1,
                    max_length: 80,
                    placeholder: "Amanhã 21:00 | 1d 4h 5s | 19:00",
                    required: true
                }]
            },
            {
                type: 1,
                components: [{
                    type: 4,
                    custom_id: "dataInfo",
                    label: "Devo te lembrar de...",
                    style: 2,
                    min_length: 1,
                    max_length: 3500,
                    placeholder: "Comprar pão",
                    required: true
                }]
            }
        ]
    }

    return await interaction.showModal(modal)
}

function getEmoji(emojiData, guild) {
    if (!emojiData || !guild) return ''
    let emoji = guild.emojis.cache.get(emojiData)

    return emoji
        ? `${emoji} `
        : emojiData
            ? `${emojiData} `
            : ''
}

async function registerCollectionID(Database, collection, guild) {

    let passCode = require('./PassCode')
    let newID = passCode(5)

    await Database.Guild.updateOne(
        { id: guild.id, 'ReactionRole.name': collection.name },
        { $set: { 'ReactionRole.$.collectionID': newID } }
    )

    return newID
}

module.exports = {
    eightyYears,
    Now,
    FormatNumber,
    getUser,
    day,
    newReminder,
    getEmoji,
    registerCollectionID
}