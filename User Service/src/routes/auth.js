const express = require('express');
const { validateRegistrationToken } = require('./../middleware/middleware')
const { handleLogin, handleRegistration } = require('../controller/auth');
const router = express.Router();

router.post('/login', handleLogin)
router.post('/register', validateRegistrationToken, handleRegistration)

module.exports = router;