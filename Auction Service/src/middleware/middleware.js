const jwt = require('jsonwebtoken');
const authSecretPublicKey = process.env.AUTH_SECRET.replace(/\\n/g, '\n');

exports.validateToken = (sellerOnly) => (req, res, next) => {
    console.log("validate token ", req.cookies, authSecretPublicKey)
    if (req.cookies && req.cookies.authtoken) {
        let registrationToken = req.cookies.authtoken;
        jwt.verify(registrationToken, authSecretPublicKey, function (err, decoded) {
            if (err) {
                return res.status(400).json({ isError: true, message: 'Authentication failed' });
            }

            if (sellerOnly === true && !decoded.data.isseller)
                return res.status(400).json({ isError: true, message: 'You are unauthorized to create an auction.' });
            req['headers']['userid'] = decoded.data.userid;
            req.loggedInUser = decoded.data;
            return next();
        });
    }
    else if (req.headers.servicetoken) {
        let serviceToken = req.headers.servicetoken;
        jwt.verify(serviceToken, process.env.SERVICE_TOKEN, function (err, decoded) {
            if (err) {
                return res.status(400).json({ isError: true, message: 'Authentication failed' });
            }
            req.body = decoded.data;
            return next();
        });
    }
    else {
        return res.status(400).json({ isError: true, message: 'Authentication failed' });
    }
}