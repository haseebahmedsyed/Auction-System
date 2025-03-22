const express = require('express');
const http = require("http");
const Database = require('./src/database/connection');
const Redis = require('./src/services/redis')
var bodyParser = require('body-parser')
require('dotenv').config();
var cookieParser = require('cookie-parser')
const biddingRouter = require("./src/routes/bidding")
const io = require('./src/services/socketio.js')
const app = express();

const server = http.createServer(app);

io.initSocket(server)

app.use(cookieParser())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(biddingRouter)

server.listen(process.env.BACKEND_PORT, () => {
    Database.connect()
    console.log(`connected to port ${process.env.BACKEND_PORT}`)
})
