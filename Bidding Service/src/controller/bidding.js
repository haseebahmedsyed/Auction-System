const Database = require("./../database/connection")
const Redis = require("../services/redis")
const Constants = require("./../utils/constants")
const { queryAuction } = require('./../utils/helper')

var count = 0;

exports.placeBid = async (req, res) => {
    console.log("place bid ", count++)
    try {
        const { price } = req.body;
        const { auctionid } = req.params;
        const userId = req.headers.userid;

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

        const result = await Database.query(
            `WITH all_bids AS (
               SELECT * FROM bids WHERE auctionid = $1
             ),
             highest_bid AS (
               SELECT * FROM all_bids WHERE price::numeric =(SELECT MAX(price::numeric) FROM all_bids) ORDER BY  createdat ASC LIMIT 1
             )
             SELECT 
               (SELECT json_agg(all_bids) FROM all_bids) AS bids,
               (SELECT row_to_json(highest_bid) FROM highest_bid) AS highest_bid`,
            [auctionid]
        );

        const bids = result.rows[0].bids ?? [];
        const highestBid = result.rows[0].highest_bid ?? {};

        return res.status(200).json({ isError: false, bids, highestBid })

    } catch (error) {
        return res.status(500).json({ isError: true, message: "Internal server error", bids: [], highestBid: {} })
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

exports.getNextEligibleBidder = async (req, res) => {
    try {
        const { auctionid, currentbidid } = req.body;

        // Input validation
        if (!auctionid || !currentbidid) {
            return res.status(400).json({ 
                isError: true, 
                message: "Auction ID and current bid ID are required" 
            });
        }

        // Start a transaction
        await Database.query('BEGIN');

        try {
            // Update current bid to disqualified
            const updateQuery = `
                UPDATE bids 
                SET paymentstatus = 'disqualified', 
                    disqualificationreason = 'payment-expired' 
                WHERE bidid = $1 
                RETURNING *`;
            
            const updateResult = await Database.query(updateQuery, [currentbidid]);
            
            if (updateResult.rows.length === 0) {
                await Database.query('ROLLBACK');
                return res.status(404).json({ 
                    isError: true, 
                    message: "Current bid not found" 
                });
            }

            // Get next eligible bidder
            const selectQuery = `
                SELECT * FROM bids 
                WHERE auctionid = $1 
                AND price::numeric = (
                    SELECT MAX(price::numeric) 
                    FROM bids 
                    WHERE auctionid = $1 
                    AND paymentstatus != 'disqualified'
                ) 
                ORDER BY createdat ASC 
                LIMIT 1`;
            
            const result = await Database.query(selectQuery, [auctionid]);
            await Database.query('COMMIT');

            const bidDetails = result.rows[0] || null;

            await Redis.setValue(`bid:${bidDetails?.auctionid ?? ''}`, JSON.stringify(bidDetails ?? {}), 30 * 60 * 1000);

            return res.status(200).json({ 
                isError: false, 
                bid: bidDetails,
                message: bidDetails ? "Next eligible bidder found" : "No eligible bidders found"
            });
        } catch (error) {
            await Database.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error("Error in getNextEligibleBidder:", error);
        return res.status(500).json({ 
            isError: true, 
            message: "Internal server error",
            details: error.message
        });
    }
}