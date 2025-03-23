const ROLE = {
    BIDDER: 'bidder',
    SELLER: 'seller',
    ADMIN: 'admin'
}
const SubscribedChannels = {
    UPDATE_CUSTOMER_PAYMENT_INFO: 'UPDATE_CUSTOMER_PAYMENT_INFO',
    PROCESS_AUCTION_PAYMENT: 'PROCESS_AUCTION_PAYMENT'
}

const PublishChannels = {
    MARK_USER_AS_SELLER: 'MARK_USER_AS_SELLER'
}
module.exports = { ROLE, SubscribedChannels, PublishChannels }