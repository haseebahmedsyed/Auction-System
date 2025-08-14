const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const RETRY_DELAYS = [0, 1000, 3000, 5000, 10000]; // Delays in milliseconds
const MAX_RETRIES = 4; // Maximum number of retry attempts

const getRetryDelay = (attempt) => {
    return RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
};

const isRetryableError = (error) => {
    // List of Stripe errors that are safe to retry
    const retryableErrors = [
        'rate_limit_error',
        'card_declined',
        'processing_error',
        'authentication_error',
        'connection_error',
        'idempotency_error'
    ];

    return retryableErrors.includes(error?.code) ||
           error?.type === 'StripeConnectionError' ||
           error?.message?.includes('network') ||
           error?.message?.includes('timeout');
};

module.exports = {
    wait,
    getRetryDelay,
    isRetryableError,
    MAX_RETRIES
}; 