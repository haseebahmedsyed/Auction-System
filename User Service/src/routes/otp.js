const express = require('express');
const { sendOTP, verifyOtp } = require('../controller/otp');
const router = express.Router();

router.get('/sendotp', sendOTP)
router.get('/verifyotp', verifyOtp)

module.exports = router;