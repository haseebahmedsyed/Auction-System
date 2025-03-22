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
                await Redis.setValue(`auction-${auctionid}`, cachedAuction, 30 * 60 * 1000);
            }
            else {
                return res.status(404).json({ isError: true, message: "Auction not found." });
            }
        }
        console.log("cachedAuction ", cachedAuction)
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

exports.getAuctioBids = async (req, res) => {
    try {
        let auctionid = req.params.auctionid;
        let bids = [];

        let result = await Database.query(
            'SELECT * FROM bids WHERE auctionid = $1 ORDER BY (price) DESC',
            [auctionid]
        );

        if (result?.rows?.length > 0) {
            bids = result?.rows
        };

        return res.status(200).json({ isError: false, bids })

    } catch (error) {
        return res.status(500).json({ isError: true, message: "Internal server error" })
    }
}


exports.getBidDetails = async (req, res) => {
    try {
        let bidid = req.params.bidid
        let bidDetails = null;
        let response = await Database.query(`SELECT * FROM bids WHERE bidid = $1`, [bidid]);

        if (response?.rows?.length > 0)
            bidDetails = response.rows[0];

        return res.status(200).json({ isError: false, bid: bidDetails })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ isError: true, message: "Internal server error" })
    }
}