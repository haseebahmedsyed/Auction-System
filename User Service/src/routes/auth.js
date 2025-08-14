const express = require('express');
const { validateRegistrationToken,validateToken } = require('./../middleware/middleware')
const { handleLogin, handleRegistration, getUserDetails,validateUserForPayment } = require('../controller/auth');
const router = express.Router();

router.post('/login', handleLogin)
router.post('/register', validateRegistrationToken, handleRegistration)
router.get('/user-details', validateToken(), getUserDetails)
router.post('/validate', validateUserForPayment)

module.exports = router;