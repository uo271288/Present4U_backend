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

module.exports = routerLists