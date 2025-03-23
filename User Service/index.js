const express = require('express');
const Database = require('./src/database/connection');
const authRoute = require('./src/routes/auth')
const otpRoute = require('./src/routes/otp')
var bodyParser = require('body-parser')
const Redis = require("./src/database/redis")
require('dotenv').config();
var cookieParser = require('cookie-parser')

const app = express();
app.use(cookieParser())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(otpRoute);
app.use(authRoute);

Redis.subscribeChannels()

app.listen(process.env.BACKEND_PORT, () => {
    Database.connect()
    console.log(`connected to port ${process.env.BACKEND_PORT}`)
})