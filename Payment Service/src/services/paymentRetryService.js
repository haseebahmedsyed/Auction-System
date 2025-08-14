const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Database = require('../database/connection.js');
const { wait, getRetryDelay, isRetryableError, MAX_RETRIES } = require('../utils/retryHelper');

class PaymentRetryService {
    constructor() {
        this.retryQueue = new Map(); // Store retry attempts
    }

    async processPaymentWithRetry(paymentData, idempotencyKey) {
        let attempt = 0;
        let lastError = null;

        while (attempt <= MAX_RETRIES) {
            try {
                const result = await this.attemptPayment(paymentData, idempotencyKey, attempt);
                await this.logPaymentAttempt(paymentData, attempt, 'success', null);
                return result;
            } catch (error) {
                lastError = error;
                await this.logPaymentAttempt(paymentData, attempt, 'failed', error.message);

                if (!isRetryableError(error) || attempt === MAX_RETRIES) {
                    throw error;
                }

                const delay = getRetryDelay(attempt);
                await wait(delay);
                attempt++;
            }
        }

        throw lastError;
    }

    async attemptPayment(paymentData, idempotencyKey, attempt) {
        const { winningBidAmount, customerStripeId, sellerStripeId, customerPaymentMethodId } = paymentData;

        const amountInCents = Math.round(winningBidAmount * 100);
        const platformFeeInCents = Math.round(amountInCents * 0.08);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            customer: customerStripeId,
            payment_method: customerPaymentMethodId,
            payment_method_types: ['card'],
            transfer_data: { destination: sellerStripeId },
            application_fee_amount: platformFeeInCents,
            confirm: true,
            off_session: true, // Important for retry logic
        }, {
            idempotencyKey: `${idempotencyKey}-attempt-${attempt}` // Unique for each attempt
        });

        return { success: true, paymentIntentId: paymentIntent.id };
    }

    async logPaymentAttempt(paymentData, attempt, status, errorMessage) {
        try {
            await Database.query(
                `INSERT INTO payment_attempts (
                    auction_id, 
                    customer_id, 
                    seller_id, 
                    amount, 
                    attempt_number, 
                    status, 
                    error_message,
                    created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                [
                    paymentData.auctionId,
                    paymentData.customerId,
                    paymentData.sellerID,
                    paymentData.winningBidAmount,
                    attempt,
                    status,
                    errorMessage
                ]
            );
        } catch (error) {
            console.error('Error logging payment attempt:', error);
        }
    }

    async scheduleRetry(paymentData, delay) {
        const retryKey = `${paymentData.auctionId}-${paymentData.customerId}`;
        
        if (this.retryQueue.has(retryKey)) {
            return; // Already scheduled for retry
        }

        this.retryQueue.set(retryKey, true);

        await new Promise((resolve) => {
            setTimeout(async () => {
                try {
                    let result = await this.processPaymentWithRetry(paymentData, retryKey);
                    this.retryQueue.delete(retryKey);
                    resolve(result);
                } catch (error) {
                    console.error('Final retry failed:', error);
                    this.retryQueue.delete(retryKey);
                    resolve({ success: false, message: error.message });
                    // Here you might want to notify admin or trigger manual intervention
                } 
            }, delay);
        })

    }
}

module.exports = new PaymentRetryService(); 