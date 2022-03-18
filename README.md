# JWT Auth

This application can store and retrieve secret messages.
The User authentication is handled using JWT tokens. 

[Please find the client application(submodule) here](https://github.com/sameerad2001/JWT_Auth_Client)

<br>

### Demo

<img src = "https://github.com/sameerad2001/JWT_Auth_Server/blob/master/img/jwt.gif" alt = "Website Demo"/>
<img src = "https://github.com/sameerad2001/JWT_Auth_Server/blob/master/img/jwt1.jpg" alt = "Website Demo"/>
<img src = "https://github.com/sameerad2001/JWT_Auth_Server/blob/master/img/jwt2.jpg" alt = "Website Demo"/>
<img src = "https://github.com/sameerad2001/JWT_Auth_Server/blob/master/img/jwt3.jpg" alt = "Website Demo"/>

### How are the HTTP only cookies being set (Cross Domain)?
1. The express server (hosted on a different domain) generates an access token and a refresh token and sends this as **json data** inside the **body** of the response (This is done because we can't send cookies between 2 different domains)
```js
res.status(200)
   .json({ accessToken, refreshToken: savedRefreshToken.token })
```
2. The client extracts this data i.e the tokens and sends it to another API(NextJS's built in API) that is hosted in the **same domain** as the client
```js
axios.post(`${API_SERVICE}/login`, { email, password }, { withCredentials: true })
                .then(async (res) => {
                    try {
                        const response = await fetch(`/api/authentication/set_tokens`, {
                            method: "POST",
                            body: JSON.stringify({ ...res.data }),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                        router.push("/dashboard")
                    }
                    catch (err) {
                        console.log(err)
                    }
                })
                .catch(err => { console.log(err) })
```
3. The NextJS API sets this data inside HTTP only cookies
```js
res.statusCode = 200
            res.setHeader("Set-Cookie", [
                cookie.serialize("accessToken", accessToken, {
                    httpOnly: true,
                    // Only send cookie over https when not in dev mode
                    secure: process.env.NODE_ENV !== "development",
                    // 1 hour
                    maxAge: 60 * 60,
                    // Only attached to same site requests
                    sameSite: "strict",
                    // Available everywhere within the site
                    path: "/"
                }),
                cookie.serialize("refreshToken", refreshToken, {
                    httpOnly: true,
                    // Only send cookie over https when not in dev mode
                    secure: process.env.NODE_ENV !== "development",
                    // Only attached to same site requests
                    sameSite: "strict",
                    // Available everywhere within the site
                    path: "/"
                })])
            res.send("access and refresh tokens set")
``` 

### How are the private routes implemented?
Using NextJS's middleware. We simply share a secret between our express server and our client and every time a user tries to access a protected route we will verify their access token present inside `request.cookies`
If it is valid they can move on else they are redirected 
```js
// Protected :
if (url.includes("/dashboard")) {
        // If user is not logged in return him to the index page
        if (!accessToken)
            return NextResponse.redirect(`${CLIENT_DOMAIN}/login`)

        // Verify the access token
        try {
            verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
            return NextResponse.next()
        }
        catch (err) {
            console.log(err)
            return NextResponse.redirect(`${CLIENT_DOMAIN}/login`)
        }
    }

else
    return NextResponse.next()
```

### How are user specific resource requests handled?
The express server has a middleware that checks if any request has a valid access token. If the request does have a verified token then `req.user` property is set to the serialized user
(i.e the userID is accessible and will be used to identify user specific resources in the various API endpoints)

```js
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
```

### To-do
- [ ] Edit Secrets
- [ ] Refresh access token when it expires

<hr>

Sameer Ahmed <br/>
Email : <sameerad2001@gmail.com> <br/>
Linkdin : <https://www.linkedin.com/in/sameer-ahmed-0b7902176/>