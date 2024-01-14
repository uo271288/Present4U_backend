const express = require('express')
const database = require("../database")

const routerFriends = express.Router()

routerFriends.post("/", async (req, res) => {

    let emailFriend = req.body.email
    let emailUser = req.infoApiKey.email
    let errors = []

    if (emailFriend === undefined || emailFriend.trim().length === 0) {
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
        return res.status(400).json({ error: "Internal server error" })
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
        return res.status(400).json({ error: "Internal server error" })
    }

    res.status(200).json(friends)
})

routerFriends.delete("/:email", async (req, res) => {

    let emailFriend = req.params.email
    let emailUser = req.infoApiKey.email

    if (emailFriend === undefined || emailFriend.trim().length === 0) {
        return res.status(400).json({ error: "No email param" })
    }

    let result = null

    database.connect()
    try {
        result = await database.query("DELETE FROM friends WHERE emailMainUser = ? AND emailFriend = ?", [emailUser, emailFriend])
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ errors: "Problems while deleting friend" })
    }
    database.disconnect()

    if (result.affectedRows === 0) {
        return res.status(400).json({ errors: "There is no friend with this id or is not yours" })
    }

    res.status(200).json({ deleted: true })
})

module.exports = routerFriends