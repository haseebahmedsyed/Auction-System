const jwt = require('jsonwebtoken');

exports.validateRegistrationToken = (req, res, next) => {
    console.log("Incoming Headers:", req.headers);
    console.log("Incoming Cookies:", req.cookies);
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
