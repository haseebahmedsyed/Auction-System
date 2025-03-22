const SubscribeChannels = {
    UPDATE_AUCTION: 'UPDATE_AUCTION'
}

const PublishCannels = {
    PROCESS_AUCTION_PAYMENT: 'PROCESS_AUCTION_PAYMENT'
}

const QueueNames = {
    AUCTION_EXPIRE: 'auction-expire'
}

module.exports = { SubscribeChannels, QueueNames, PublishCannels }