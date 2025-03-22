const express = require('express');
const { sendOTP, verifyOtp } = require('../controller/otp');
const router = express.Router();

router.post('/sendotp', sendOTP)
router.post('/verifyotp', verifyOtp)

module.exports = router;