const express = require('express')
const database = require("../database")
const activeApiKeys = require("../activeApiKeys")
const jwt = require("jsonwebtoken")

const routerUsers = express.Router()

routerUsers.post("/", async (req, res) => {

    let { name, email, password } = req.body
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
        database.disconnect()
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ error: e })
    }

    res.status(200).json({ inserted: insertedUser })
})

routerUsers.post("/login", async (req, res) => {

    let email = req.body.email
    let password = req.body.password
    let errors = []

    if (email == undefined) {
        errors.push("Email is required")
    }
    if (password == undefined) {
        errors.push("Password is required")
    }
    if (errors.length > 0) {
        return res.status(400).json({ error: errors })
    }

    database.connect()

    let selectedUsers = null
    try {
        selectedUsers = await database.query('SELECT id, email FROM users WHERE email = ? AND password = ?', [email, password])
        database.disconnect()
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ error: e })
    }

    if (selectedUsers.length == 0) {
        return res.status(401).json({ error: "Invalid email or password" })
    }

    let apiKey = jwt.sign(
        {
            email: selectedUsers[0].email,
            id: selectedUsers[0].id
        },
        "CursoSantander")
    activeApiKeys.push(apiKey)


    res.json({
        apiKey: apiKey,
        id: selectedUsers[0].id,
        email: selectedUsers[0].email
    })
})

routerUsers.get("/disconnect", async (req, res) => {

    let apiKeyIndex = activeApiKeys.indexOf(req.query.apiKey)
    if (apiKeyIndex > -1) {
        activeApiKeys.splice(apiKeyIndex, 1)
        res.status(200).json({ removed: true })
    } else {
        return res.status(400).json({ error: "User not found" })
    }
})

routerUsers.get("/checkLogin", async (req, res) => {
    return res.status(200).json({ message: "OK" })
})

module.exports = routerUsers