const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

// Mongoose models
const User = mongoose.model("User")
const RefreshToken = mongoose.model("RefreshToken")

// Middleware(s)
const authenticateToken = require("../middlewares/authenticateToken")

module.exports = (app) => {
    // Returns an access token that expires a specified amount of time
    // For the access token and refresh token : require("crypto").randomBytes(64).toString("hex")
    function generateAccessToken(userToSerialize) {
        return jwt.sign(userToSerialize, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })
    }
    function generateRefreshToken(userToSerialize) {
        // The refresh token does not expire
        return jwt.sign(userToSerialize, process.env.REFRESH_TOKEN_SECRET)
    }

    app.post("/register", async (req, res) => {

        const { email, password } = req.body

        // check if the email provided belongs to a registered user
        User.findOne({ email }, async (err, existingUser) => {
            // console.log(existingUser)

            if (err)
                res.status(500).send(err)

            if (existingUser)
                res.status(409).send("User with the given email already exists")

            else
                try {
                    // Hash the password 10 times with a randomly generated salt
                    // This returns the hashed password concatenated with the salt : "salt.password"
                    let hashedPassword = await bcrypt.hash(password, 10)

                    let newUser = new User({
                        email: email,
                        password: hashedPassword
                    })

                    newUser.save((error, savedUser) => {
                        if (error)
                            res.status(500).send(error)

                        else {
                            const userToSerialize = {
                                userID: savedUser._id
                            }
                            // Create a json web token by serializing the user
                            const accessToken = generateAccessToken(userToSerialize)

                            // This is done b/c the refresh token needs to be saved to the DB
                            // Eg : refreshToken = {token : "<string>"}
                            const refreshToken = new RefreshToken({
                                token: generateRefreshToken(userToSerialize)
                            })

                            refreshToken.save((refreshError, savedRefreshToken) => {
                                if (refreshError)
                                    res.status(500).send(refreshError)
                                else
                                    res.status(200)
                                        .json({ accessToken, refreshToken: savedRefreshToken.token })
                            })
                        }
                    })
                }
                catch {
                    res.status(500).send("something went wrong")
                }
        })
    })

    app.post("/login", async (req, res) => {

        const { email, password } = req.body

        // Find a user with the provided email
        User.findOne({ email }, async (err, existingUser) => {
            // console.log(existingUser)

            if (err)
                res.status(500).send(err)

            if (!existingUser)
                res.status(404).send("the provided email does not correspond to any existing user")

            else
                try {
                    // Compare the given password with the one in the database
                    if (await bcrypt.compare(password, existingUser.password)) {
                        const userToSerialize = {
                            userID: existingUser._id
                        }
                        // Create a json web token by serializing the user
                        const accessToken = generateAccessToken(userToSerialize)
                        const refreshToken = new RefreshToken({
                            token: generateRefreshToken(userToSerialize)
                        })
                        // Save the refresh token in DB
                        refreshToken.save((refreshError, savedRefreshToken) => {
                            if (refreshError)
                                res.status(500).send(refreshError)
                            else
                                res.status(200)
                                    .json({ accessToken, refreshToken: savedRefreshToken.token })
                        })
                    }
                    else
                        res.status(401).send("wrong password")
                }
                catch {
                    res.status(500).send("something went wrong")
                }

        })
    })

    // Route protected by the auth middleware
    app.get("/test_auth_middleware", authenticateToken, (req, res) => {
        // the user object contains the userID 
        res.status(200).send(req.user)
    })

    // Verify the access token (can be used to implement protected routes)
    app.get("/verify_access_token", authenticateToken, (req, res) => {
        res.status(200).send(true)
    })

    app.post("/refresh_access_token", async (req, res) => {
        let refreshToken = req.body.refreshToken

        if (!refreshToken)
            res.status(401).send("refresh token not provided")

        else
            RefreshToken.findOne({ token: refreshToken }, (err, storedRefreshToken) => {
                if (err)
                    res.status(500).send(err)

                if (!storedRefreshToken)
                    res.status(403).send("the refresh token provided does not exist")

                // verify the refresh token
                else
                    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (verificationError, serializedUser) => {
                        if (verificationError)
                            res.status(500).send(verificationError)

                        else {
                            const accessToken = generateAccessToken({ userID: serializedUser.userID })
                            res.status(200).send({ accessToken })
                        }
                    })
            })
    })

    app.delete("/logout", (req, res) => {
        let refreshToken = req.body.refreshToken
        // console.log(refreshToken)

        if (!refreshToken)
            res.status(401).send("refresh token not provided")

        // When the user logs out delete their refresh token
        else
            RefreshToken.deleteOne({ token: refreshToken }, (err) => {
                if (err)
                    res.status(500).send(err)

                res.status(204).send("logout successful")
            })
    })

    app.post("/test_cookies", (req, res) => {
        const authHeader = req.headers["authorization"]

        // ____ <split> because our auth header is like : <BEARER TOKEN> ___________________________________
        // We want the token so after splitting we take the element in the first index
        const accessToken = authHeader && authHeader.split(' ')[1]

        console.log(accessToken)
    })
}