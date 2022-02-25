const mongoose = require('mongoose');
const { Schema } = mongoose;

const refreshTokenSchema = new Schema({
    token: String
})

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema)