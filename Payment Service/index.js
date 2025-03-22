const express = require('express');
const Database = require('./src/database/connection');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
require('dotenv').config();
const registrationRouter = require('./src/routes/registrationrouter.js')
const Redis = require('./src/database/redis.js')

const app = express();
app.use(cookieParser())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(registrationRouter);
Redis.subscribeChannels()
app.listen(process.env.BACKEND_PORT, () => {
    Database.connect()
    console.log(`connected to port ${process.env.BACKEND_PORT}`)
})