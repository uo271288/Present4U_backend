const express = require('express')
const database = require("../database")

const routerPresents = express.Router()

routerPresents.post("/", async (req, res) => {

    let name = req.body.name
    let description = req.body.description
    let url = req.body.url
    let price = req.body.price
    let userId = req.infoApiKey.id
    let errors = []

    if (name == undefined) {
        errors.push("Name is required")
    }
    if (description == undefined) {
        errors.push("Description is required")
    }
    if (url == undefined) {
        errors.push("URL is required")
    }
    if (price == undefined) {
        errors.push("Price is required")
    }
    if (errors.length > 0) {
        return res.status(400).json({ error: errors })
    }

    database.connect()

    let insertedUser = null
    try {
        insertedUser = await database.query('INSERT INTO presents (userId,name,description,url,price) VALUES (?,?,?,?,?)', [userId, name, description, url, price])
        database.disconnect()
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ error: e })
    }

    res.status(200).json({ inserted: insertedUser })
})

routerPresents.get("/", async (req, res) => {
    let friendEmail = req.query.userEmail
    let userId = req.infoApiKey.id
    let userEmail = req.infoApiKey.email

    database.connect()

    let presents = null
    try {
        if (friendEmail == undefined) {
            presents = await database.query('SELECT * FROM presents WHERE userId = ?', [userId])
        } else {
            let friend = await database.query('SELECT emailFriend FROM friends WHERE emailMainUser = ? AND emailFriend = ?', [friendEmail, userEmail])
            if (friend.length > 0) {
                presents = await database.query('SELECT presents.* FROM presents JOIN users ON presents.userId = users.id WHERE users.email = ?', [friendEmail])
            } else {
                database.disconnect()
                return res.status(400).json({ error: "You are not on " + friendEmail + "'s friends list" })
            }
        }
        database.disconnect()
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ error: e })
    }

    res.status(200).json({ presents: presents })
})

routerPresents.get("/:id", async (req, res) => {

    let presentId = req.params.id
    let userId = req.infoApiKey.id

    database.connect()

    let present = null
    try {
        present = await database.query('SELECT * FROM presents WHERE id = ?', [presentId])
        database.disconnect()
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ error: e })
    }

    if (present[0].userId != userId) {
        return res.status(400).json({ error: "This present is not yours" })
    }
    res.status(200).json({ present: present[0] })
})

routerPresents.put("/:id", async (req, res) => {

    let name = req.body.name
    let description = req.body.description
    let url = req.body.url
    let price = req.body.price
    let id = req.params.id
    let userId = req.infoApiKey.id

    if (id == undefined) {
        return res.status(400).json({ error: "No id param" })
    }

    let result = null

    database.connect()
    try {
        result = await database.query("UPDATE presents SET name = ?, description = ?, url = ?, price = ? WHERE id = ? AND userId = ?", [name, description, url, price, id, userId])
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ errors: "Problems while updating present" })
    }
    database.disconnect()

    if (result.affectedRows == 0) {
        return res.status(400).json({ errors: "There is no present with this id or is not yours" })
    }

    res.status(200).json({ updated: true })
})

routerPresents.delete("/:id", async (req, res) => {

    let id = req.params.id
    let userId = req.infoApiKey.id

    if (id == undefined) {
        return res.status(400).json({ error: "No id param" })
    }

    let result = null

    database.connect()
    try {
        result = await database.query("DELETE FROM presents WHERE id=? AND userId=?", [id, userId])
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ errors: "Problems while deleting present" })
    }
    database.disconnect()

    if (result.affectedRows == 0) {
        return res.status(400).json({ errors: "There is no present with this id or is not yours" })
    }

    res.status(200).json({ deleted: true })
})

module.exports = routerPresents