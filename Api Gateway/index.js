const express = require("express");
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();

app.use('/user-service', createProxyMiddleware({
    target: 'http://127.0.0.1:9090',
    changeOrigin: true,
    pathRewrite: {
        '^/user-service': ''
    }
}))


app.use('/auction-service', createProxyMiddleware({
    target: 'http://127.0.0.1:9091',
    changeOrigin: true,
    pathRewrite: {
        '^/auction-service': ''
    }
}))


app.use('/bidding-service', createProxyMiddleware({
    target: 'http://127.0.0.1:9093',
    changeOrigin: true,
    pathRewrite: {
        '^/bidding-service': ''
    },
    on: {
        proxyReq: (proxyReq, req, res) => {
            console.log("proxy req")
        },
        proxyRes: (proxyRes, req, res) => {
            console.log("proxy res")
            /* handle proxyRes */
        },
        error: (err, req, res) => {
            /* handle error */
            console.log("proxy error")
        },
    }
}))




app.listen((process.env.GATEWAY_PORT), () => {
    console.log(`litening on port ${process.env.GATEWAY_PORT}`)
})