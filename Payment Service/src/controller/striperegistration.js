const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Constants = require('../utils/constants.js');
const Database = require('../database/connection.js')
const Redis = require('./../database/redis.js')
const PaymentRetryService = require('../services/paymentRetryService');
const { isRetryableError } = require('../utils/retryHelper.js')
exports.registerUserToStripe = async (req, res) => {

    const { email, userid } = req.body;

    try {
        const account = await stripe.accounts.create({
            type: 'express',
            country: 'US',
            email: email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true }
            },
        });

        const sellerAccountId = account.id;

        await Database.query(`INSERT INTO seller (userid, stripeid) VALUES ($1,$2)`, [userid, sellerAccountId])

        await Redis.publishMessage(Constants.PublishChannels.MARK_USER_AS_SELLER, { userid })

        res.json({ accountId: sellerAccountId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.createAccountLink = async (req, res) => {
    const { accountId } = req.body;

    try {
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: 'http://localhost:3000/',
            return_url: 'http://localhost:3000/success',
            type: 'account_onboarding'
        });

        res.json({ url: accountLink.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.registerBidder = async (req, res) => {
    const { email } = req.body;

    try {
        const customer = await stripe.customers.create({
            email: email,
        });
        console.log("customer ", customer)
        const customerId = customer.id;

        res.json({ customerId: customerId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.createSetupIntent = async (req, res) => {
    const { customerId } = req.body;

    try {
        const setupIntent = await stripe.setupIntents.create({
            customer: customerId,
            payment_method_types: ['card'],
        });

        res.json({ clientSecret: setupIntent.client_secret });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.savePaymentMethod = async (req, res) => {
    const { customerId, paymentMethodId } = req.body;

    try {
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });

        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.registerCustomer = async (data) => {
    try {
        const { userid, customerid, paymentmethodid } = data;
        await Database.query(
            `INSERT INTO customer (userid,stripeid,paymentmethod) VALUES ($1,$2,$3)`, [userid, customerid, paymentmethodid]
        )
    } catch (error) {
        console.log(error)
    }
}

const getDetails = async (table, id) => {
    try {
        const response = await Database.query(`SELECT * FROM ${table} WHERE userid = $1`, [id]);
        return response?.rows?.[0] || null;
    } catch (error) {
        console.error("Error fetching details:", error);
        return null;
    }
};

exports.processPayment = async (req, res) => {
    try {
        const { winningBidAmount, customerId, sellerID, auctionId } = req.body;

        const [customerDetails, sellerDetails] = await Promise.all([
            getDetails('customer', customerId),
            getDetails('seller', sellerID)
        ]);

        if (!customerDetails || !sellerDetails) {
            console.log("Customer or seller details not found");
            return res.status(400).json({ isError: true, message: 'Customer or seller details not found' });

        }

        const { paymentmethod: customerPaymentMethodId, stripeid: customerStripeId } = customerDetails;
        const { stripeid: sellerStripeId } = sellerDetails;

        const paymentData = {
            auctionId,
            customerId,
            sellerID,
            winningBidAmount,
            customerStripeId,
            sellerStripeId,
            customerPaymentMethodId
        };

        // Generate a unique idempotency key for this payment
        const idempotencyKey = `payment-${auctionId}-${customerId}-${Date.now()}`;

        try {
            const result = await PaymentRetryService.processPaymentWithRetry(paymentData, idempotencyKey);
            return res.status(200).json({ isError: !result.success, message: result.message || (result.success !== true ? "Payment failed" : "Payment successful") });
        } catch (error) {
            console.error("Payment processing error:", error);

            // If it's a retryable error and we haven't exceeded max retries
            if (isRetryableError(error)) {
                // Schedule a retry with initial delay
                await PaymentRetryService.scheduleRetry(paymentData, 60000); // 1 minute delay
                // return res.status(200).json({ isError: false, status: 'scheduled_retry', message: error.message });
            }

            return res.status(500).json({ isError: true, message: error.message });
        }
    } catch (error) {
        console.error("Payment setup error:", error);
        // return { success: false, error: error.message };
        return res.status(500).json({ isError: true, message: error.message });
    }
};
