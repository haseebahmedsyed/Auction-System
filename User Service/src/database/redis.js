const { createClient } = require('redis');

class Redis {
    constructor() {
        if (Redis.instance) return Redis.instance; // Singleton pattern
        Redis.instance = this;

        this.commandClient = null; // For general commands like SET, GET
        this.pubSubClient = null; // For Pub/Sub functionality
        this.connectionPromise = this.connect();

        // this.functionMapping = {
        //     [Constants.SubscribeChannels.UPDATE_AUCTION]: (msg) => updateAuction(msg),
        // };
    }

    async connect() {
        try {
            if (!this.commandClient) {
                this.commandClient = createClient()
                    .on('error', (err) => console.log('Redis Command Client Error', err));
                await this.commandClient.connect();
                console.log('Command Redis client connected');
            }

            if (!this.pubSubClient) {
                this.pubSubClient = createClient()
                    .on('error', (err) => console.log('Redis Pub/Sub Client Error', err));
                await this.pubSubClient.connect();
                console.log('Pub/Sub Redis client connected');
            }
        } catch (err) {
            console.error('Connection error', err.stack);
        }
    }

    async disconnect() {
        try {
            if (this.commandClient) await this.commandClient.disconnect();
            if (this.pubSubClient) await this.pubSubClient.disconnect();
        } catch (err) {
            console.error('Error disconnecting', err.stack);
        }
    }

    async publishMessage(channelName, message) {
        try {
            await this.connectionPromise; // Ensure connection is established
            await this.pubSubClient.publish(channelName, JSON.stringify(message));
            console.log(`Published message to channel "${channelName}":`, message);
        } catch (error) {
            console.error('Error in publishing message:', error);
        }
    }
    // async setValue(key, value, expireat) {
    //     try {
    //         await this.commandClient.set(key, value, {  EX: expireat });
    //     } catch (error) {
    //         console.log('Error in setting value:', error);
    //     }
    // }

    // async getValue(key) {
    //     try {
    //         const value = await this.commandClient.get(key);
    //         return value;
    //     } catch (error) {
    //         console.log('Error in getting value:', error);
    //     }
    // }

    // async subscribeChannels() {
    //     await this.connectionPromise; // Ensure connections are established
    //     if (this.pubSubClient && Constants.SubscribeChannels) {
    //         Object.values(Constants.SubscribeChannels).forEach((channel) => {
    //             this.pubSubClient.subscribe(channel, (message) => {
    //                 try {
    //                     const parsedMessage = JSON.parse(message);
    //                     const handler = this.functionMapping[channel];
    //                     if (handler) {
    //                         handler(parsedMessage);
    //                     } else {
    //                         console.warn(`No handler for channel: ${channel}`);
    //                     }
    //                 } catch (err) {
    //                     console.error(`Error processing message for channel ${channel}:`, err);
    //                 }
    //             });
    //         });
    //     }
    // }
}

module.exports = new Redis();
