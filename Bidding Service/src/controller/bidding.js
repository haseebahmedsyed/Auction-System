const Database = require("./../database/connection")
const Redis = require("../services/redis")
const Constants = require("./../utils/constants")
const { queryAuction } = require('./../utils/helper')


exports.placeBid = async (req, res) => {
    try {
        const { price } = req.body;
        const { auctionid } = req.params;
        const userId = req.loggedInUser.userid;

        // Retrieve and parse cached auction data
        const cachedAuction = JSON.parse(await Redis.getValue(`auction-${auctionid}`));
        if (!cachedAuction) {
            // query auction in db
            let { isError, auction, message } = await queryAuction(auctionid);
            if (isError)
                return res.status(500).json({ isError: true, message: message });

            if (auction && Object.keys(auction).length > 0) {
                cachedAuction = auction;
                await Redis.setValue(`auction-${auctionid}`, cachedAuction);
            }
            else {
                return res.status(404).json({ isError: true, message: "Auction not found." });
            }
        }
        console.log("cachedAuction ",cachedAuction)
        if (cachedAuction.status == "closed") {
            return res.status(400).json({ isError: true, message: "Auction is not open anymore." });
        }

        await Redis.addBid(auctionid, userId, price);

        return res.json({ isError: false, message: "Bid placed successfully!" });
    } catch (error) {
        console.error("Error placing bid:", error);
        return res.status(500).json({ isError: true, message: "Internal server error." });
    }
};
