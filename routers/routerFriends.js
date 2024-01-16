const express = require('express')
const database = require("../database")

const routerFriends = express.Router()

routerFriends.post("/", async (req, res) => {

    let emailFriend = req.body.email
    let idList = req.body.idList
    let emailUser = req.infoApiKey.email
    let errors = []

    if (emailFriend === undefined || emailFriend.trim().length === 0) {
        errors.push("Friend's email is required")
    }
    if (idList === undefined) {
        errors.push("List id is required")
    }
    if (errors.length > 0) {
        return res.status(400).json({ error: errors })
    }

    database.connect()

    let insertedFriend = null
    try {
        insertedFriend = await database.query('INSERT INTO friends (emailMainUser, emailFriend, listId) VALUES (?,?,?)', [emailUser, emailFriend, idList])
        database.disconnect()
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ error: "Internal server error" })
    }

    res.status(200).json({ inserted: insertedFriend })
})

routerFriends.get("/:idList", async (req, res) => {

    let idList = req.params.idList
    let emailUser = req.infoApiKey.email

    if (idList === undefined || idList.trim().length === 0) {
        return res.status(400).json({ error: "No idList param" })
    }

    database.connect()

    let friends = null
    try {
        friends = await database.query('SELECT emailFriend FROM friends WHERE emailMainUser = ? AND listId = ?', [emailUser, idList])
        database.disconnect()
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ error: "Internal server error" })
    }

    if (friends.length == 0) {
        return res.status(400).json({ error: "No friends found for this list" })
    }

    res.status(200).json(friends)
})

routerFriends.get("/", async (req, res) => {

    let emailUser = req.infoApiKey.email

    database.connect()

    let friends = null
    try {
        friends = await database.query('SELECT DISTINCT emailFriend FROM friends WHERE emailMainUser = ?', [emailUser])
        database.disconnect()
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ error: "Internal server error" })
    }

    if (friends.length == 0) {
        return res.status(400).json({ error: "No friends found" })
    }

    res.status(200).json(friends)
})

routerFriends.delete("/:email/:idList", async (req, res) => {

    let emailFriend = req.params.email
    let idList = req.params.idList
    let emailUser = req.infoApiKey.email

    if (emailFriend === undefined || emailFriend.trim().length === 0) {
        return res.status(400).json({ error: "No email param" })
    }
    if (idList === undefined || idList.trim().length === 0) {
        return res.status(400).json({ error: "No idList param" })
    }

    let result = null

    database.connect()
    try {
        result = await database.query("DELETE FROM friends WHERE emailMainUser = ? AND emailFriend = ? AND listId = ?", [emailUser, emailFriend, idList])
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ errors: "Problems while deleting friend from the list" })
    }
    database.disconnect()

    if (result.affectedRows === 0) {
        return res.status(400).json({ errors: "This friend isn't in the list" })
    }

    res.status(200).json({ deleted: true })
})

module.exports = routerFriends