const jwt = require("jsonwebtoken");
const { match } = require('path-to-regexp');

const validateToken = (req, res, next) => {
    const userToken = req.cookies?.authtoken;
    const serviceToken = req.headers?.servicetoken;

    // List of paths to skip
    const skipPaths = [
        "/login",
        "/register",
        "/sendotp",
        "/verifyotp",
        "/register-bidder",
        "/create-setup-intent",
        "/save-payment-method",
        "/get-auctions",
        "/get-auction/:id"
    ];

    // Middleware logic
    const shouldSkip = skipPaths.some((path) => {
        const matcher = match(path, { decode: decodeURIComponent });
        return matcher(req.path);
    });

    if (shouldSkip) {
        return next();
    }
    if (userToken) {
        jwt.verify(userToken, process.env.AUTH_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ isError: true, message: "Authentication failed" });
            }
            console.log("DECODED DATA ", decoded.data)
            // req.loggedInUser = decoded.data;
            req.headers['userid'] = decoded.data.userid
            return next();
        });
    } else if (serviceToken) {
        jwt.verify(serviceToken, process.env.SERVICE_TOKEN, (err, decoded) => {
            if (err) {
                return res.status(401).json({ isError: true, message: "Invalid service token" });
            }
            req.body = decoded.data;
            return next();
        });
    } else {
        return res.status(401).json({ isError: true, message: "Authentication failed" });
    }
};

module.exports = validateToken;
