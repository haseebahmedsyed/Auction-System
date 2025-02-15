const jwt = require('jsonwebtoken');

exports.validateToken = (roles) => (req, res, next) => {
    if (req.cookies && req.cookies.authtoken) {
        let registrationToken = req.cookies.authtoken;
        jwt.verify(registrationToken, process.env.AUTH_SECRET, function (err, decoded) {
            if (err) {
                return res.status(400).json({ isError: true, message: 'Authentication failed' });
            }
            if (!roles.includes(decoded.data.role))
                return res.status(400).json({ isError: true, message: 'Authentication failed' });

            req.loggedInUser = decoded.data;
            return next();
        });
    } else {
        return res.status(400).json({ isError: true, message: 'Authentication failed' });
    }
}