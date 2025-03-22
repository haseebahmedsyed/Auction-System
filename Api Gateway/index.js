const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
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
      // const proxyCookies = proxyRes.headers["set-cookie"];
      // if (proxyCookies) {
      //   // Ensure cookies are properly formatted and forwarded
      //   res.setHeader("set-cookie", proxyCookies.map(cookie => {
      //     return cookie.split(';')[0] + '; SameSite=None; Secure';
      //   }));
      // }
    },
    error: (err, req, res) => {
      console.error("Proxy error:", err.message);
      res.status(502).send("Service unavailable");
    },
  },
};

// Proxy configurations
app.use(
  "/user-service",
  createProxyMiddleware({
    target: "http://127.0.0.1:9090",
    pathRewrite: { "^/user-service": "" },
    ...commonProxyOptions,
  })
);

app.use(
  "/auction-service",
  createProxyMiddleware({
    target: "http://127.0.0.1:9091",
    pathRewrite: { "^/auction-service": "" },
    ...commonProxyOptions,
  })
);

app.use(
  "/payment-service",
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
server.on("upgrade", biddingProxy.upgrade);

const PORT = process.env.GATEWAY_PORT || 8080;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});