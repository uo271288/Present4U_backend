const express = require('express')
const database = require("../database")

const routerFriends = express.Router()

routerFriends.post("/", async (req, res) => {

    let emailFriend = req.body.email
    let emailUser = req.infoApiKey.email
    let errors = []

    if (emailFriend == undefined) {
        errors.push("Friend's email is required")
    }
    if (errors.length > 0) {
        return res.status(400).json({ error: errors })
    }

    database.connect()

    let insertedFriend = null
    try {
        insertedFriend = await database.query('INSERT INTO friends (emailMainUser, emailFriend) VALUES (?,?)', [emailUser, emailFriend])
        database.disconnect()
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ error: e })
    }

    res.status(200).json({ inserted: insertedFriend })
})

routerFriends.get("/", async (req, res) => {

    let emailUser = req.infoApiKey.email

    database.connect()

    let friends = null
    try {
        friends = await database.query('SELECT emailFriend FROM friends WHERE emailMainUser = ?', [emailUser])
        database.disconnect()
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ error: e })
    }

    res.status(200).json({ friends: friends })
})

module.exports = routerFriends