const ROLE = {
    BIDDER: 'bidder',
    SELLER: 'seller',
    ADMIN: 'admin'
}

const PURPOSE = {
    REGISTRATION: 'registration',
    AUTHENTICATION: 'authentication'
}

const PublishChannels = {
    UPDATE_CUSTOMER_PAYMENT_INFO: 'UPDATE_CUSTOMER_PAYMENT_INFO',
}

const SubscribedChannels = {
    MARK_USER_AS_SELLER: 'MARK_USER_AS_SELLER'
}
module.exports = { ROLE, PURPOSE, PublishChannels, SubscribedChannels }