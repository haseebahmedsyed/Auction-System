const jwt = require('jsonwebtoken');
const authSecretPublicKey = process.env.AUTH_SECRET_PUBLIC.replace(/\\n/g, '\n');

exports.validateToken = () => (req, res, next) => {
    if (req.cookies && req.cookies.authtoken) {
        let registrationToken = req.cookies.authtoken;
        jwt.verify(registrationToken, authSecretPublicKey, function (err, decoded) {
            console.log(err)
            if (err) {
                return res.status(400).json({ isError: true, message: 'Authentication failed' });
            }
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
            req.headers.userid = decoded.data.userid;
            return next();
        });
    }
    else {
        return res.status(400).json({ isError: true, message: 'Authentication failed' });
    }
}

exports.validateRegistrationToken = (req, res, next) => {
    if (req.cookies && req.cookies.regtoken) {
        let registrationToken = req.cookies.regtoken;
        jwt.verify(registrationToken, process.env.OTP_SECRECT, function (err, decoded) {
            if (err) {
                return res.status(400).json({ isError: true, message: 'Authentication failed' });
            }
            req.body.contact = decoded.data.contact;
            return next();
        });
    } else {
        return res.status(400).json({ isError: true, message: 'Authentication failed' });
    }
};