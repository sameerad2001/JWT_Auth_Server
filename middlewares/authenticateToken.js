const jwt = require("jsonwebtoken")

// Middle ware to authenticate requests sent to the server 
module.exports = function authenticateToken(req, res, next) {

    // Get the authentication headers from the request
    const authHeader = req.headers["authorization"]

    // ____ <split> because our auth header is like : <BEARER TOKEN> ___________________________________
    // We want the token so after splitting we take the element in the first index
    const accessToken = authHeader && authHeader.split(' ')[1]

    if (!accessToken || accessToken === null || accessToken === undefined)
        res.status(401).send("access denied, token not provided")

    // verify the given token
    else
        jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, serializedUser) => {
            if (err)
                res.status(403).send("access denied, token is not valid")

            else {
                // Set the user ... this can be used inside the functions/routes that are protected by this middleware 
                req.user = serializedUser
                // Move to the route handler
                next()
            }
        })
}