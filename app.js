const express = require('express')
const routerUsers = require("./routers/routerUsers")
const port = 8081
const app = express()

app.use(express.json())

app.use("/users", routerUsers)

app.listen(port, () => {
    console.log("Active server listening on port " + port)
})