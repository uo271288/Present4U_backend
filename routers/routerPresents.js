const express = require('express')
const database = require("../database")

const routerPresents = express.Router()

routerPresents.post("/", async (req, res) => {

    let { name, listId, description, url, price } = req.body
    let userId = req.infoApiKey.id
    let errors = []

    if (listId === undefined || (listId + '').trim().length === 0) {
        errors.push("List id is required")
    }
    if (name === undefined || name.trim().length === 0) {
        errors.push("Name is required")
    }
    if (description === undefined || description.trim().length === 0) {
        errors.push("Description is required")
    }
    if (url === undefined || url.trim().length === 0) {
        errors.push("URL is required")
    }
    if (price === undefined || (price + '').trim().length === 0) {
        errors.push("Price is required")
    }
    if (parseFloat(price) < 0) {
        errors.push("Price cannot be negative")
    }
    if (errors.length > 0) {
        return res.status(400).json({ error: errors })
    }

    database.connect()

    let insertedUser = null
    try {
        insertedUser = await database.query('INSERT INTO presents (userId,listId,name,description,url,price) VALUES (?,?,?,?,?,?)', [userId, listId, name, description, url, price])
        database.disconnect()
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ error: "Internal server error" })
    }

    res.status(200).json({ inserted: insertedUser })
})

routerPresents.get("/", async (req, res) => {
    let friendEmail = req.query.userEmail
    let listName = req.query.listName
    let userId = req.infoApiKey.id
    let userEmail = req.infoApiKey.email

    database.connect()

    let presents = null
    try {
        if (friendEmail !== undefined && listName !== undefined) {
            let friend = await database.query('SELECT emailFriend, lists.name as listName FROM friends JOIN lists ON lists.id = friends.listId WHERE emailMainUser = ? AND emailFriend = ? AND lists.name = ?', [friendEmail, userEmail, listName])
            if (friend.length > 0) {
                presents = await database.query('SELECT presents.*, lists.name as listName FROM presents JOIN users ON presents.userId = users.id JOIN lists ON lists.id = presents.listId WHERE users.email = ? AND lists.name = ?', [friendEmail, listName])
            } else {
                database.disconnect()
                return res.status(400).json({ error: "You're not on " + friendEmail + "'s friends list" })
            }
        } else {
            presents = await database.query('SELECT presents.*, lists.name AS listName FROM presents JOIN lists ON lists.id = presents.listId WHERE presents.userId = ?', [userId])
        }
        database.disconnect()
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ error: "Internal server error" })
    }

    res.status(200).json(presents)
})

routerPresents.get("/chosenByMe", async (req, res) => {

    let email = req.infoApiKey.email

    database.connect()

    let presents = null
    try {
        presents = await database.query('SELECT presents.*, lists.name as listName FROM presents JOIN lists ON lists.id = presents.listId WHERE presents.chosenBy = ?', [email])
        database.disconnect()
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ error: "Internal server error" })
    }

    if (presents.length <= 0) {
        return res.status(400).json({ error: "You haven't chosen any presents" })
    }

    res.status(200).json(presents)
})

routerPresents.get("/:id", async (req, res) => {

    let presentId = req.params.id
    let userId = req.infoApiKey.id

    database.connect()

    let present = null
    try {
        present = await database.query('SELECT presents.*, lists.name AS listName FROM presents JOIN lists ON lists.id = presents.listId WHERE presents.id = ?', [presentId])
        database.disconnect()
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ error: "Internal server error" })
    }

    if (present.length <= 0) {
        return res.status(400).json({ error: "No present found" })
    }

    if (present[0].userId != userId) {
        return res.status(400).json({ error: "This present is not yours" })
    }
    res.status(200).json(present[0])
})

routerPresents.put("/:id", async (req, res) => {

    let { name, description, url, price } = req.body
    let id = req.params.id
    let userId = req.infoApiKey.id
    let userEmail = req.infoApiKey.email

    let updateParams = []
    let updateValues = []

    if (name !== undefined && name.trim().length !== 0) {
        updateParams.push("name = ?")
        updateValues.push(name)
    }
    if (description !== undefined && description.trim().length !== 0) {
        updateParams.push("description = ?")
        updateValues.push(description)
    }
    if (url !== undefined && url.trim().length !== 0) {
        updateParams.push("url = ?")
        updateValues.push(url)
    }
    if (price !== undefined && (price + '').trim().length !== 0 && parseFloat(price) >= 0) {
        updateParams.push("price = ?")
        updateValues.push(price)
    }
    updateValues.push(id)

    if (id === undefined) {
        return res.status(400).json({ error: "No id param" })
    }

    database.connect()
    try {
        let myPresent = await database.query("SELECT * FROM presents WHERE id = ? AND userId = ?", [id, userId])

        if (myPresent.length === 0) {
            let friend = await database.query('SELECT friends.emailMainUser FROM friends JOIN users ON users.email = friends.emailMainUser JOIN presents ON presents.userId = users.id AND presents.listId = friends.listId WHERE friends.emailFriend = ? AND presents.id = ?', [userEmail, id])
            if (friend.length === 0) {
                database.disconnect()
                return res.status(400).json({ error: "There is not a present with this id or you are not on the present owner's friends list" })
            }
            let chosen = await database.query("SELECT chosenBy FROM presents WHERE id = ?", [id, userId])

            if (chosen[0].chosenBy != null) {
                database.disconnect()
                return res.status(400).json({ error: "This present is already chosen" })
            }

            await database.query("UPDATE presents SET chosenBy = ? WHERE id = ?", [userEmail, id])
        } else {
            await database.query("UPDATE presents SET " + updateParams.join(", ") + " WHERE id = ?", updateValues)
        }
    } catch (e) {
        database.disconnect()
        return res.status(400).json({ errors: "Problems while updating present" })
    }
    database.disconnect()

    res.status(200).json({ updated: true })
})

routerPresents.delete("/:id", async (req, res) => {

    let id = req.params.id
    let userId = req.infoApiKey.id

    if (id === undefined) {
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

    if (result.affectedRows === 0) {
        return res.status(400).json({ errors: "There is no present with this id or is not yours" })
    }

    res.status(200).json({ deleted: true })
})

module.exports = routerPresents