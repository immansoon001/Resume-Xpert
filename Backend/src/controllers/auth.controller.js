const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

function getCookieOptions(req) {
    const isHttps = process.env.NODE_ENV === "production" || 
                    (req.headers.origin && req.headers.origin.startsWith("https://")) ||
                    req.secure;
    return {
        httpOnly: true,
        secure: isHttps,
        sameSite: isHttps ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000
    };
}

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {

    const { username, email, password } = req.body

    if (!username || !email || !password) {
        return res.status(400).json({
            message: "Please provide username, email and password"
        })
    }

    const isUserAlreadyExists = await userModel.findOne({
        $or: [ { username }, { email } ]
    })

    if (isUserAlreadyExists) {
        return res.status(400).json({
            message: "Account already exists with this email address or username"
        })
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await userModel.create({
        username,
        email,
        password: hash
    })

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token, getCookieOptions(req))


    res.status(201).json({
        message: "User registered successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        },
        token
    })

}


/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {

    const { email, password } = req.body

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token, getCookieOptions(req))
    res.status(200).json({
        message: "User loggedIn successfully.",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        },
        token
    })
}


/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUserController(req, res) {
    const token = req.cookies.token

    if (token) {
        await tokenBlacklistModel.create({ token })
    }

    res.clearCookie("token", getCookieOptions(req))

    res.status(200).json({
        message: "User logged out successfully"
    })
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {

    const user = await userModel.findById(req.user.id)



    res.status(200).json({
        message: "User details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}

/**
 * @name clerkSyncController
 * @description Sync Clerk user with backend database and issue JWT session
 * @access Public
 */
async function clerkSyncController(req, res) {
    const { email, username, clerkId } = req.body

    if (!email) {
        return res.status(400).json({
            message: "Email is required"
        })
    }

    try {
        let user = await userModel.findOne({
            $or: [
                ...(clerkId ? [{ clerkId }] : []),
                { email }
            ]
        })

        if (!user) {
            const baseUsername = username || email.split("@")[0]
            let finalUsername = baseUsername
            let count = 1
            while (await userModel.findOne({ username: finalUsername })) {
                finalUsername = `${baseUsername}${count++}`
            }

            user = await userModel.create({
                username: finalUsername,
                email,
                clerkId,
                password: await bcrypt.hash(Math.random().toString(36), 10)
            })
        } else if (clerkId && !user.clerkId) {
            user.clerkId = clerkId
            await user.save()
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )

        res.cookie("token", token, getCookieOptions(req))

        return res.status(200).json({
            message: "Clerk user authenticated successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            token
        })
    } catch (err) {
        console.error("Clerk sync error:", err)
        return res.status(500).json({
            message: "Failed to authenticate Clerk user"
        })
    }
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController,
    clerkSyncController
}