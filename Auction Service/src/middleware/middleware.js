const jwt = require('jsonwebtoken');

exports.validateToken = (roles) => (req, res, next) => {
    console.log("validate token ",req.headers)
    if (req.cookies && req.cookies.authtoken) {
        let registrationToken = req.cookies.authtoken;
        jwt.verify(registrationToken, process.env.AUTH_SECRET, function (err, decoded) {
            if (err) {
                return res.status(400).json({ isError: true, message: 'Authentication failed' });
            }
            // if (!roles.includes(decoded.data.role))
            //     return res.status(400).json({ isError: true, message: 'Authentication failed' });

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