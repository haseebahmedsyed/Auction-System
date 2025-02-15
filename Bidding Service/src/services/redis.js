const { createClient } = require('redis');
const BidProcessor = require('./bidProcessor')
const Database = require("../database/connection")
const Constants = require("../utils/constants")

class Redis {
    constructor() {
        if (Redis.instance) {
            return Redis.instance; // Singleton pattern: return existing instance
        }

        this.client = null;
        Redis.instance = this;

        this.connectionPromise = this.connect(); // Initialize connection
        this.BidProcessor = new BidProcessor(this);

        this.STREAM_NAME = 'bids_stream';
        this.GROUP_NAME = 'bid_consumers';
        this.CONSUMER_NAME = `worker-${Math.random().toString(36).substring(7)}`;
    }

    async connect() {
        try {
            if (!this.client) {
                this.client = createClient()
                    .on('error', (err) => console.log('Redis Client Error', err));
                await this.client.connect();
                console.log('Redis client connected');

                // Initialize Redis Stream Group
                await this.createConsumerGroup();
            }
        } catch (err) {
            console.error('Connection error', err.stack);
        }
    }

    async disconnect() {
        try {
            if (this.client) {
                await this.client.disconnect();
                console.log('Redis client disconnected');
            }
        } catch (err) {
            console.error('Error disconnecting', err.stack);
        }
    }

    async setValue(key, value) {
        try {
            await this.connectionPromise; // Ensure connection is established
            await this.client.set(key, value);
        } catch (error) {
            console.error('Error in setting value:', error);
        }
    }

    async getValue(key) {
        try {
            await this.connectionPromise; // Ensure connection is established
            const value = await this.client.get(key);
            return value;
        } catch (error) {
            console.error('Error in getting value:', error);
        }
    }

    async publishMessage(channelName, message) {
        try {
            await this.connectionPromise; // Ensure connection is established
            await this.client.publish(channelName, JSON.stringify(message));
            console.log(`Published message to channel "${channelName}":`, message);
        } catch (error) {
            console.error('Error in publishing message:', error);
        }
    }

    async createConsumerGroup() {
        try {
            await this.client.xGroupCreate(this.STREAM_NAME, this.GROUP_NAME, '0', { MKSTREAM: true });
            console.log(`Consumer Group '${this.GROUP_NAME}' created on stream '${this.STREAM_NAME}'`);
        } catch (error) {
            if (error.message.includes('BUSYGROUP')) {
                console.log('Consumer Group already exists');
            } else {
                console.error('Error creating consumer group:', error);
            }
        }
    }

    async addBid(auctionid, userid, amount) {
        try {
            await this.connectionPromise;
            const bidData = { auctionid, userid, amount, timestamp: Date.now() };
            await this.client.xAdd(this.STREAM_NAME, '*', { data: JSON.stringify(bidData) });
            console.log(`Bid added:`, bidData);
        } catch (error) {
            console.error('Error adding bid:', error);
        }
    }


    async acquireLock(lockKey) {
        const result = await this.client.set(lockKey, 'locked', { NX: true, EX: 10 });
        console.log("Result of acquired lock ", result)
        return result === 'OK';
    }

    async releaseLock(lockKey) {
        await this.client.del(lockKey);
    }

    async processBids() {
        await this.connectionPromise;

        while (true) {
            try {
                const response = await this.client.xReadGroup(
                    this.GROUP_NAME,
                    this.CONSUMER_NAME,
                    [{ key: this.STREAM_NAME, id: '>' }],
                    { COUNT: 10, BLOCK: 5000 }
                );

                if (!response) continue; // No new messages


                for (const { messages } of response) {
                    for (const message of messages) {
                        const bid = JSON.parse(message.message.data);
                        const auctionLockKey = `lock:auction:${bid.auctionId}`;

                        if (!(await this.acquireLock(auctionLockKey))) continue; // Skip if lock is held

                        try {
                            await this.BidProcessor.processBidLogic(bid);
                            await this.client.xAck(this.STREAM_NAME, this.GROUP_NAME, message.id);
                        } catch (error) {
                            console.error('Error processing bid:', error);
                        } finally {
                            await this.releaseLock(auctionLockKey);
                        }
                    }
                }
            } catch (error) {
                console.error('Error reading stream:', error);
            }
        }
    }
}

const redisInstance = new Redis();
redisInstance.processBids(); // Start processing bids

module.exports = redisInstance;
