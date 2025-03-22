const Database = require('./../database/connection')
const Redis = require('./../database/redis')
const jwt = require('jsonwebtoken')
const Constants = require('./../utils/constants.js')

getJsonWebToken = (data) => {
    let token = jwt.sign({
        data: data
    }, process.env.SERVICE_TOKEN, { expiresIn: 15 * 60 * 1000 });

    return token;
}

const getBidDetailsByBidId = async (bidid) => {
    let { data } = await axios.get(`http://localhost:8989/bidding-service/get-bid/${bidid}`,
        {
            headers: {
                'servicetoken': getJsonWebToken({ bidid })  // Forward HTTP-only cookies from client request
            },
            withCredentials: true
        }
    );
    return data?.bid ?? null;
}

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

        if (auctionDetails.winningbidid) {
            const auctionCurrentHighestBidKey = `bid:${data.auctionid}`;
            let winningBidDetails = await Redis.getValue(auctionCurrentHighestBidKey);
            console.log("WINNING BID DETAILS : ",winningBidDetails)
            if (winningBidDetails) {
                winningBidDetails = JSON.parse(winningBidDetails);
            } else {
                winningBidDetails = await getBidDetailsByBidId(auctionDetails.winningbidid)
            }
            if (winningBidDetails) {
                let sellerID = auctionDetails.createdby;
                let customerId = winningBidDetails.userid;
                let winningBidAmount = winningBidDetails.price;
                await Redis.publishMessage(Constants.PublishCannels.PROCESS_AUCTION_PAYMENT, { sellerID, customerId, winningBidAmount })
            }
        }
        console.log("Auction status saved to Redis.");
        // No need to manually retry, as BullMQ will handle it based on the configuration.
    } catch (error) {
        // In case of error, BullMQ will automatically retry based on the configuration
        console.error(`Error processing auction expiry for auction ${data.auctionid}:`, error);
        throw error;  // Rethrow the error to trigger BullMQ's retry mechanism
    }
};
