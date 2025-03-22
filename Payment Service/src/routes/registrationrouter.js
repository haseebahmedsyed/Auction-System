const express = require('express');
const { registerUserToStripe, createAccountLink, registerBidder, createSetupIntent, savePaymentMethod, processPayment } = require('./../controller/striperegistration.js')
const router = express.Router();

router.post('/register-seller', registerUserToStripe)
router.post('/create-account-link', createAccountLink)
router.post('/register-bidder', registerBidder)
router.post('/create-setup-intent', createSetupIntent)
router.post('/save-payment-method', savePaymentMethod)
router.post('/process-auction-payment', processPayment)

module.exports = router