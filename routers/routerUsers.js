const express = require('express')
const database = require("../database")
const routerUsers = express.Router()

routerUsers.post("/", async (req, res) => {

    let email = req.body.email
    let password = req.body.password
    let name = req.body.name
    let errors = []
    if (email == undefined) {
        errors.push("Email is required")
    }
    if (password == undefined) {
        errors.push("Password is required")
    }
    if (name == undefined) {
        errors.push("Name is required")
    }
    if (password?.length < 5) {
        errors.push("Password must have at least 5 characters")
    }
    if (errors.length > 0) {
        return res.status(400).json({ error: errors })
    }

    database.connect()

    let insertedUser = null
    try {
        userWithSameEmail = await database.query('SELECT email FROM users WHERE email = ?', [email])

        if (userWithSameEmail.length > 0) {
            database.disconnect()
            return res.status(400).json({ error: "There is already a user with this email" })
        }
        insertedUser = await database.query('INSERT INTO users (email,password,name) VALUES (?,?,?)', [email, password, name])
    } catch (e) {
        return res.status(400).json({ error: e })
    }

    res.status(200).json({ inserted: insertedUser })
})

module.exports = routerUsers