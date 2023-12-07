const express = require('express')
const database = require("../database")
const jwt = require("jsonwebtoken")

const routerPresents = express.Router()

routerPresents.post("/", async (req, res) => {

    let name = req.body.name
    let description = req.body.description
    let url = req.body.url
    let price = req.body.price
    let apiKey = req.query.apiKey
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
    let infoInApiKey = jwt.verify(apiKey, "CursoSantander")
    try {
        insertedUser = await database.query('INSERT INTO presents (userId,name,description,url,price) VALUES (?,?,?,?,?)', [infoInApiKey.id, name, description, url, price])
        database.disconnect()
    } catch (e) {
        return res.status(400).json({ error: e })
    }

    res.status(200).json({ inserted: insertedUser })
})

module.exports = routerPresents