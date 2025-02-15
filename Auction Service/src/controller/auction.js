const Database = require('./../database/connection')
const Redis = require('./../database/redis')
const Constants = require('./../utils/constants.js')
const bullMQ = require('./../bullmq/BullMQManager.js');

exports.createAuction = async (req, res) => {
    const { title, description, endtime, startprice } = req.body;

    try {
        //check if end time is valid
        let endTimeInMilliSeconds = new Date(endtime).getTime()
        if (endTimeInMilliSeconds <= Date.now()) {
            return res.status(400).json({ isError: true, message: "Invalid auction expiry." })
        }

        // Create auction record and return auction data
        const auctionResult = await Database.query(
            "INSERT INTO auctions (title, description, endtime, startprice, createdby) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [title, description, endtime, startprice, req.loggedInUser.userid]
        );

        console.log("auction result ", auctionResult)

        const auctionRecord = auctionResult.rows[0];
        if (!auctionRecord) {
            return res.status(400).json({ isError: true, message: "Failed to create auction." });
        }

        const auctionid = auctionRecord.auctionid;
        const imagesArr = [];

        // Insert image records if files exist
        if (auctionid && req.files?.length) {
            const imageValues = req.files.map((file, idx) => `($1, $${idx + 2})`).join(',');
            const imagePaths = req.files.map(file => file.path);

            const query = `
                INSERT INTO itemimages (auctionid, imageurl)
                VALUES ${imageValues}
                RETURNING imageurl
            `;

            const imagesResult = await Database.query(query, [auctionid, ...imagePaths]);
            imagesArr.push(...imagesResult.rows.map(row => row.imageurl));
        }

        // Add images to auction record
        auctionRecord.images = imagesArr;

        //store record in redis
        await Redis.setValue(`auction-${auctionRecord.auctionid}`, JSON.stringify(auctionRecord), 30 * 60 * 1000)

        //calculate the delay after which the auction will be closed
        let delay = Math.max(0, endTimeInMilliSeconds - Date.now());
        console.log("delay : ", delay)
        bullMQ.addJob(
            Constants.QueueNames.AUCTION_EXPIRE,
            'auction-expire-worker',
            auctionRecord,
            {
                delay: delay,  // Delay until job starts processing
                attempts: 1000,    // Number of retries
                backoff: { type: "exponential", delay: 3000 },  // Exponential backoff for retries 
                removeOnComplete: true,
            }
        )

        // Respond with success
        return res.status(200).json({
            isError: false,
            message: "Auction created successfully",
            auction: auctionRecord
        });
    } catch (error) {
        console.error("Error creating auction:", error);
        return res.status(500).json({
            isError: true,
            message: "Something went wrong."
        });
    }
};

exports.getAuction = async (req, res) => {
    try {
        const auctionid = req.params.id;
        const query =
            `
        WITH auction AS (
            SELECT * FROM auctions WHERE auctionid = $1
        )
        SELECT
            a.auctionid,
            a.status,
            a.title,
            a.description,
            a.endtime,
            a.startprice,
            a.createdby,
            COALESCE(JSON_AGG(i.imageurl) FILTER (WHERE i.imageurl IS NOT NULL), '[]'::json) AS images
        FROM auction a
        LEFT JOIN itemimages i ON a.auctionid = i.auctionid
        GROUP BY
            a.auctionid,
            a.status,
            a.title,
            a.description,
            a.endtime,
            a.startprice,
            a.createdby;
        `

        const result = await Database.query(query, [auctionid]);
        console.log(result)
        const auction = result?.rows?.[0];

        if (!auction) {
            return res.status(404).json({ isError: true, message: "Auction not found" });
        }

        return res.status(200).json({ isError: false, auction });
    } catch (error) {
        console.error("Error fetching auction:", error);
        return res.status(500).json({ isError: true, message: "Internal server error" });
    }
};

