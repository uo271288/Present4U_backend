const express = require('express')
const routerUsers = require("./routers/routerUsers")
const routerPresents = require("./routers/routerPresents")
const routerFriends = require('./routers/routerFriends')
const jwt = require("jsonwebtoken")
const activeApiKeys = require("./activeApiKeys")

const port = 8081
const app = express()

app.use(express.json())

app.use(["/presents", "/friends", "/users/checkLogin"], (req, res, next) => {

    console.log("Executing middleware")

    let apiKey = req.query.apiKey
    if (apiKey == undefined) {
        return res.status(401).json({ error: "No apiKey" })
    }
    let infoApiKey = jwt.verify(apiKey, "CursoSantander")
    if (infoApiKey == undefined || activeApiKeys.indexOf(apiKey) == -1) {
        return res.status(401).json({ error: "Invalid apiKey" })
    }
    req.infoApiKey = infoApiKey
    next()
})

app.use("/users", routerUsers)
app.use("/presents", routerPresents)
app.use("/friends", routerFriends)

app.listen(port, () => {
    console.log("Active server listening on port " + port)
})