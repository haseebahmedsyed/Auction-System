const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const validateToken = require("./middleware.js")
const axios = require("axios");
const bodyParser = require('body-parser')
require("dotenv").config();

const app = express();
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

const server = http.createServer(app);

// Common proxy options
const commonProxyOptions = {
  changeOrigin: true,
  on: {
    proxyRes: (proxyRes, req, res) => {
    },
    error: (err, req, res) => {
      console.error("Proxy error:", err.message);
      res?.status?.(502)?.send?.("Service unavailable");
    },
  },
};

// Proxy configurations
app.use(
  "/user-service",
  // validateToken,
  createProxyMiddleware({
    target: "http://127.0.0.1:9090",
    pathRewrite: { "^/user-service": "" },
    ...commonProxyOptions,
  })
);

app.use(
  "/auction-service",
  // validateToken,
  createProxyMiddleware({
    target: "http://127.0.0.1:9091",
    pathRewrite: { "^/auction-service": "" },
    ...commonProxyOptions,
  })
);

app.use(
  "/payment-service",
  // validateToken,
  createProxyMiddleware({
    target: "http://127.0.0.1:9094",
    pathRewrite: { "^/payment-service": "" },
    ...commonProxyOptions,
  })
);

// Bidding service with WebSocket support
const biddingProxy = createProxyMiddleware({
  target: "http://127.0.0.1:9093",
  pathRewrite: { "^/bidding-service": "" },
  ws: true,
  logLevel: "debug",
  ...commonProxyOptions,
});

app.use("/bidding-service", biddingProxy);
server.on("upgrade", (req, socket, head) => {
  if (req.url.startsWith("/bidding-service")) {
    biddingProxy.upgrade(req, socket, head);
  }
});

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post("/payments/initiate", async (req, res) => {
  const { username, password, ...paymentData } = req.body;

  try {
    // 1. Validate user via User Service
    const { data } = await axios.post("http://127.0.0.1:9090/validate", { username, password, userid: paymentData.customerId });
    console.log("data", data);
    if (data.isError)
      return res.status(400).json({ isError: true, message: data.message });

    if (!data.isValidUser) {
      return res.status(400).json({ isError: true, message: data.message });
    } else {
      // 2. Check if link still valid
      const { data: jobData } = await axios.post('http://127.0.0.1:9091/job-exists', { 'auctionId': paymentData.auctionId, 'bidId': paymentData.bidId })
      
      if (!jobData.jobExists)
        return res.status(200).json({ isError: true, message: 'Your payment time has been expired.' });

      // 3. Publish/forward to Payment Service
      const paymentResponse = await axios.post("http://127.0.0.1:9094/process-payment", paymentData);
      return res.status(200).json(paymentResponse.data);
    }
  } catch (err) {
    console.error("Payment initiation failed:", err.message);

    const status = err.response?.status || 500;
    const message = err.response?.data?.message || "Something went wrong";

    return res.status(status).json({ isError: true, message });
  }
});



const PORT = process.env.GATEWAY_PORT || 8989;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});