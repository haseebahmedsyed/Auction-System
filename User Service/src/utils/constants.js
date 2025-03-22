const ROLE = {
    BIDDER: 'bidder',
    SELLER: 'seller',
    ADMIN: 'admin'
}

const PURPOSE = {
    REGISTRATION: 'registration',
    AUTHENTICATION: 'authentication'
}

const PubSubChannels = {
    UPDATE_CUSTOMER_PAYMENT_INFO: 'UPDATE_CUSTOMER_PAYMENT_INFO'
}
module.exports = { ROLE, PURPOSE, PubSubChannels }