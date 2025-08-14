const express = require('express');
const { placeBid, getAuctioBids, getBidDetails, getAuctionHighetBid, getNextEligibleBidder } = require('./../controller/bidding')
const { validateToken } = require('./../middleware/middleware')

const router = express.Router();


router.post('/place-bid/:auctionid', validateToken(), placeBid)

router.get('/get-bids/:auctionid', validateToken(), getAuctioBids)

router.get('/get-bid/:bidid', validateToken(), getBidDetails)

router.post('/next-eligible-bid', validateToken(), getNextEligibleBidder)

module.exports = router