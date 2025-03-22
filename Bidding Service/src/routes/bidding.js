const express = require('express');
const { placeBid, getAuctioBids, getBidDetails } = require('./../controller/bidding')
const { validateToken } = require('./../middleware/middleware')

const router = express.Router();


router.post('/place-bid/:auctionid', validateToken(['bidder']), placeBid)

router.get('/get-bids/:auctionid', validateToken(['seller', 'bidder']), getAuctioBids)

router.get('/get-bid/:bidid',validateToken(), getBidDetails)

module.exports = router