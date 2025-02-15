const express = require('express');
const Database = require('./src/database/connection');
const Redis = require('./src/services/redis')
var bodyParser = require('body-parser')
require('dotenv').config();
var cookieParser = require('cookie-parser')
const biddingRouter = require("./src/routes/bidding")

const app = express();
app.use(cookieParser())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(biddingRouter)


app.listen(process.env.BACKEND_PORT, () => {
    Database.connect()
    console.log(`connected to port ${process.env.BACKEND_PORT}`)
})