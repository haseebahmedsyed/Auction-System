const express = require('express');
const Database = require('./src/database/connection');
var bodyParser = require('body-parser')
const auctionRoute = require('./src/routes/auction')
const Redis = require("./src/database/redis")
var cookieParser = require('cookie-parser')
require('dotenv').config();
require("./src/bullmq/main.js")


const app = express();
app.use(cookieParser())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(auctionRoute);

Redis.subscribeChannels()

app.listen(process.env.BACKEND_PORT, () => {
    Database.connect()
    console.log(`connected to port ${process.env.BACKEND_PORT}`)
})