const mongoose = require("mongoose")

// Mongoose models
const SecretMessage = mongoose.model("SecretMessage")

// Middleware(s)
const authenticateToken = require("../middlewares/authenticateToken")

module.exports = (app) => {

    // Create a new message
    app.post("/secret_message", authenticateToken, (req, res) => {
        const userID = req.user.userID
        const message = req.body.message

        if (!message)
            res.status(404).send("message was not provided")

        else {
            let newMessage = new SecretMessage({
                userID,
                message
            })

            newMessage.save((err) => {
                if (err)
                    res.status(500).send(err)
                else
                    res.status(200).send("message saved")
            })
        }
    })

    // fetch all the messages corresponding to the requesting user
    app.get("/secret_message", authenticateToken, (req, res) => {
        const userID = req.user.userID

        SecretMessage.find({ userID }, (err, secrets) => {
            if (err)
                res.status(500).send(err)

            else
                res.status(200).send(secrets)
        })
    })

}