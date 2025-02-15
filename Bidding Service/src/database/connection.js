const { Client } = require('pg');
require('dotenv').config();

class Database {

    constructor() {
        if (Database.instance)
            return Database.instance; // Return the existing instance if it already exists

        // Create a new client instance
        this.client = new Client({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DBNAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
        });
    }

    async connect() {
        try {
            // Connect to the database
            await this.client.connect();
            console.log(`Connected to PostgreSQL on port ${process.env.DB_PORT}`);
        } catch (err) {
            console.error('Connection error', err.stack);
        }
    }

    // Optionally, add a disconnect method to close the connection
    async disconnect() {
        try {
            await this.client.end();
            console.log('Disconnected from PostgreSQL');
        } catch (err) {
            console.error('Error disconnecting', err.stack);
        }
    }

    query(queryText, queryParams) {
        return new Promise((resolve, reject) => {
            this.client.query(queryText, queryParams)
                .then(res => resolve(res))
                .catch((err) => reject(err))
        })
    }
}

module.exports = new Database();



