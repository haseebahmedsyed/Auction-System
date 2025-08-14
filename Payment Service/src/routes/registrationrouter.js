const express = require('express');
const { registerUserToStripe, createAccountLink, registerBidder, createSetupIntent, savePaymentMethod, processPayment } = require('./../controller/striperegistration.js')
const { validateToken } = require('./../middleware/middleware.js')
const router = express.Router();

router.post('/register-seller',validateToken(), registerUserToStripe)
router.post('/create-account-link',validateToken(), createAccountLink)
router.post('/register-bidder', registerBidder) //1
router.post('/create-setup-intent', createSetupIntent) //2
router.post('/save-payment-method', savePaymentMethod) //3
router.post('/process-payment', processPayment) //3

module.exports = router