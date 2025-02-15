const Database = require('./../database/connection')
const Redis = require('./../database/redis')

exports.auctionExpiryProcessor = async (job) => {
    const { data } = job;

    try {
        console.log("Processing auction expiry for auction:", data.auctionid);

        // Step 1: Update auction status to 'closed'
        const auctionResult = await Database.query(
            `UPDATE auctions SET status=$1 WHERE auctionid=$2 RETURNING *`,
            ['closed', data.auctionid]
        );

        const auctionDetails = auctionResult.rows[0];

        if (!auctionDetails) {
            throw new Error(`Auction with ID ${data.auctionid} not found or already closed.`);
        }

        console.log("Auction updated successfully:", auctionDetails);

        // Step 2: Store auction status in Redis
        await Redis.setValue(`auction-${auctionDetails.auctionid}`, JSON.stringify(auctionDetails), 30 * 60 * 1000);  // 30 minutes expiry

        console.log("Auction status saved to Redis.");

        // No need to manually retry, as BullMQ will handle it based on the configuration.

    } catch (error) {
        // In case of error, BullMQ will automatically retry based on the configuration
        console.error(`Error processing auction expiry for auction ${data.auctionid}:`, error);
        throw error;  // Rethrow the error to trigger BullMQ's retry mechanism
    }
};
