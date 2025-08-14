const Database = require('./../database/connection')
const Redis = require('./../database/redis')
const Constants = require('./../utils/constants.js')
const { getJsonWebToken } = require('./../utils/helper.js')
const nodemailer = require('./../utils/nodemailer.js')
const bullMQ = require('./../bullmq/BullMQManager.js');
const axios = require('axios');

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

const getNextEligibleBid = async (auctionid, currentbidid) => {
    let { data } = await axios.post(`http://localhost:8989/bidding-service/next-eligible-bid`,
        {},
        {
            headers: {
                'servicetoken': getJsonWebToken({ auctionid, currentbidid })  // Forward HTTP-only cookies from client request
            },
            withCredentials: true
        }
    );
    if (data?.isError) {
        return null;
    }
    return data?.bid ?? null;
}

const getCustomerDetails = async (userid) => {
    let { data } = await axios.get(`http://localhost:8989/user-service/user-details`,
        {
            headers: {
                'servicetoken': getJsonWebToken({ userid })  // Forward HTTP-only cookies from client request
            },
            withCredentials: true
        }
    );
    return data?.user ?? {};
}

const getEmailBody = (emailData) => {
    let data = Buffer.from(JSON.stringify(emailData)).toString('base64');
    return (
        `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto;">
        <h2>Congratulations!</h2>
        <p>You have successfully won the auction for <strong>${emailData.title}</strong>.</p>
        <p style="color: red; font-weight: bold;">
          Please complete your payment within the next <strong>20 minutes</strong>. 
          If payment is not made, the item will be offered to the next highest bidder.
        </p>
        <p>Click the button below to proceed with the payment:</p>
        <a href="http://localhost:3000/payment?data=${data}" 
           style="display:inline-block; padding:12px 24px; background-color:#28a745; color:#fff; 
                  text-decoration:none; border-radius:5px; font-weight:bold;">
          Pay Now
        </a>
        <p>Thank you for participating!</p>
        <p>– The Auction Hub</p>
      </div>
    `
    )
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
            console.log("WINNING BID DETAILS : ", winningBidDetails)
            if (winningBidDetails) {
                winningBidDetails = JSON.parse(winningBidDetails);
            } else {
                winningBidDetails = await getBidDetailsByBidId(auctionDetails.winningbidid)
            }
            if (winningBidDetails) {
                let sellerID = auctionDetails.createdby;
                let customerId = winningBidDetails.userid;
                let winningBidAmount = winningBidDetails.price;
                let bidId = winningBidDetails.bidid;
                let auctionId = auctionDetails.auctionid;
                // await Redis.publishMessage(Constants.PublishCannels.PROCESS_AUCTION_PAYMENT, { sellerID, customerId, winningBidAmount, auctionId })
                const { email } = await getCustomerDetails(customerId);
                if (email) {
                    const body = getEmailBody({ sellerID, customerId, winningBidAmount, auctionId, title: auctionDetails.title, bidId });
                    console.log("email : ", email)
                    nodemailer.send(email, body)
                    bullMQ.addJob(Constants.QueueNames.EMAIL_SENDER, 'send-email',
                        { sellerID, customerId, winningBidAmount, auctionId, title: auctionDetails.title, bidId },
                        { delay: 2 * 60 * 1000, removeOnComplete: true, attempts: 2, jobId: `${auctionId}:${bidId}` }
                    )
                }
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

exports.emailSenderProcessor = async (job) => {
    const { data } = job;
    try {
        const nextEligibleBid = await getNextEligibleBid(data.auctionId, data.bidId);
        const bullMqData = {
            ...data,
            winningBidAmount: nextEligibleBid?.price,
            customerId: nextEligibleBid?.userid,
            bidId: nextEligibleBid?.bidid
        }
        const { email } = await getCustomerDetails(bullMqData.customerId);
        console.log("nextEligibleBid : ", nextEligibleBid)
        console.log("email : ", email)
        if (email) {
            const body = getEmailBody(bullMqData);
            nodemailer.send(email, body)
            bullMQ.addJob(Constants.QueueNames.EMAIL_SENDER, 'send-email',
                bullMqData,
                { delay: 2 * 60 * 1000, removeOnComplete: true, attempts: 2, jobId: `${bullMqData.auctionId}:${bullMqData.bidId}` }
            )
        }
        console.log("Processing email sender for auction:", data.auctionId);
    } catch (error) {
        console.error(`Error processing email sender for auction ${data.auctionId}:`, error);
        throw error;
    }
}