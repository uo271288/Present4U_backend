const express = require('express')
const database = require("../database")

const routerLists = express.Router()

routerLists.post("/", async (req, res) => {

    let name = req.body.name
    let idUser = req.infoApiKey.id
    let errors = []

    if (name === undefined || name.trim().length === 0) {
        errors.push("List name is required")
    }
    if (errors.length > 0) {
        return res.status(400).json({ error: errors })
    }

    database.connect()

    let newList = null
    try {
        newList = await database.query('INSERT INTO lists (name, userId) VALUES (?,?)', [name, idUser])
        database.disconnect()
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ error: "Internal server error" })
    }

    res.status(200).json({ inserted: newList })
})

routerLists.get("/name/:name", async (req, res) => {

    let userId = req.infoApiKey.id
    let listName = req.params.name

    database.connect()
    let listId = null
    try {
        listId = await database.query('SELECT id FROM lists WHERE name = ? AND userId = ?', [listName, userId])
        database.disconnect()
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ error: "Internal server error" })
    }

    if (listId.length == 0) {
        return res.status(400).json({ error: "No list found or is not yours" })
    }

    res.status(200).json(listId[0])
})

routerLists.get("/id/:id", async (req, res) => {

    let userId = req.infoApiKey.id
    let listId = req.params.id

    database.connect()
    let listName = null
    try {
        listName = await database.query('SELECT name FROM lists WHERE id = ? AND userId = ?', [listId, userId])
        database.disconnect()
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ error: "Internal server error" })
    }

    if (listName.length == 0) {
        return res.status(400).json({ error: "No list found or is not yours" })
    }

    res.status(200).json(listName[0])
})

module.exports = routerLists