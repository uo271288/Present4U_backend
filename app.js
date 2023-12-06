const express = require('express')
const routerUsers = require("./routers/routerUsers")
const jwt = require("jsonwebtoken")
const activeApiKeys = require("./activeApiKeys")

const port = 8081
const app = express()

app.use(express.json())

app.use("/users", routerUsers)

app.use(["/users/checklogin"], (req, res, next) => {

    console.log("Executing middleware")

    let apiKey = req.query.apiKey
    if (apiKey == undefined) {
        return res.status(401).json({ error: "No apiKey" });
    }
    let infoInApiKey = jwt.verify(apiKey, "CursoSantander");
    if (infoInApiKey == undefined || activeApiKeys.indexOf(apiKey) == -1) {
        return res.status(401).json({ error: "Invalid apiKey" });
    }
    req.infoInApiKey = infoInApiKey;
    next()
})

app.listen(port, () => {
    console.log("Active server listening on port " + port)
})