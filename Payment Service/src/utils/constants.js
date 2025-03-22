const ROLE = {
    BIDDER: 'bidder',
    SELLER: 'seller',
    ADMIN: 'admin'
}
const PubSubChannels = {
    UPDATE_CUSTOMER_PAYMENT_INFO: 'UPDATE_CUSTOMER_PAYMENT_INFO',
    PROCESS_AUCTION_PAYMENT: 'PROCESS_AUCTION_PAYMENT'
}
module.exports = { ROLE, PubSubChannels }