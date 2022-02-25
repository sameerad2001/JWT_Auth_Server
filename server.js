const express = require("express")
const bodyParser = require("body-parser")
require("dotenv").config()
const mongoose = require("mongoose");
const cors = require("cors")

const app = express()

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))
app.use(express.json())

// Middle-wares
app.use(bodyParser.urlencoded({
    extended: true
}));

// Connect to mongoDB
mongoose.connect('mongodb://localhost:27017/testDailyScheduleDB', { useNewUrlParser: true });

// Mongoose models
require("./models/userModel")
require("./models/refreshToken")
require("./models/secretMessage")

// Routes
require("./routes/authorizeAndAuthenticate")(app)
require("./routes/secretMessage")(app)

let port = 5000
app.listen(port, () => {
    console.log("Server started on port ", port);
})