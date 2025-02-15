const Database = require("./../database/connection");
const Constants = require("./../utils/constants");

class BidProcessor {
    constructor(redisClient) {
        this.redisClient = redisClient;
    }

    async processBidLogic(bid) {
        if (!bid) return;

        const auctionKey = `auction-${bid.auctionid}`;

        // Try to get auction details from cache
        let cachedAuction = await this.redisClient.getValue(auctionKey);
        cachedAuction = cachedAuction ? JSON.parse(cachedAuction) : null;

        // If not found in cache, fetch from database
        if (!cachedAuction) {
            const { isError, auction } = await queryAuction(bid.auctionid);
            if (isError || !auction) return;

            cachedAuction = auction;
            await this.redisClient.setValue(auctionKey, JSON.stringify(auction));
        }

        //if start price is less than bid amount then return
        if (Number(bid.amount) < Number(cachedAuction.startprice))
            return;

        // Check if there's an existing winning bid and compare prices
        if (cachedAuction.winningbidid) {
            const { rows } = await Database.query(
                "SELECT price FROM bids WHERE bidid = $1",
                [cachedAuction.winningbidid]
            );
            const winningPrice = rows[0]?.price;
            if (winningPrice && Number(bid.amount) <= Number(winningPrice)) return;
        }

        // Insert the new bid and get its ID
        const { rows } = await Database.query(
            "INSERT INTO bids (auctionid, userid, price) VALUES ($1, $2, $3) RETURNING bidid",
            [bid.auctionid, bid.userid, bid.amount]
        );

        const newBidId = rows[0]?.bidid;
        if (!newBidId) return;

        // Update cache with the new winning bid
        cachedAuction.winningbidid = newBidId;
        await this.redisClient.setValue(auctionKey, JSON.stringify(cachedAuction));

        // Notify auction update
        await this.redisClient.publishMessage(Constants.Channel.UPDATE_AUCTION, {
            winningbidid: newBidId,
            auctionid: bid.auctionid,
        });
    }
}

module.exports = BidProcessor