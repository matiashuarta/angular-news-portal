const { createProxyMiddleware } = require('http-proxy-middleware');

// Store client connection logs in an array
const clientLogs = [];

module.exports = function (app) {
  app.use(
    '/',
    createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
      onProxyReq: (_proxyReq, req, _res) => {
        const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const logEntry = {
          timestamp: new Date().toISOString(),
          clientIP,
          requestURL: req.url
        };

        // Push the log entry to the array
        clientLogs.push(logEntry);
        console.log(JSON.stringify(logEntry, null, 2)); // Log the entry to console
      },
    })
  );
};
