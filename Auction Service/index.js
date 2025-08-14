const express = require('express');
const path = require('path');
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

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

Redis.subscribeChannels()

app.listen(process.env.BACKEND_PORT, () => {
    Database.connect()
    console.log(`connected to port ${process.env.BACKEND_PORT}`)
})