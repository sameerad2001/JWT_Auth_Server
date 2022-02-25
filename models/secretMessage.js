const mongoose = require('mongoose');
const { Schema } = mongoose;

const secretMessageSchema = new Schema({
    userID: String,
    message: String
})

const SecretMessage = mongoose.model("SecretMessage", secretMessageSchema)