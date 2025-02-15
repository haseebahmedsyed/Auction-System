const express = require('express');
const { placeBid } = require('./../controller/bidding')
const { validateToken } = require('./../middleware/middleware')

const router = express.Router();


router.post('/place-bid/:auctionid', validateToken(['bidder']), placeBid)

module.exports = router