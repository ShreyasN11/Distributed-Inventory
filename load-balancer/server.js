const express = require('express');
const httpProxy = require('http-proxy');
const cors = require('cors');

const app = express();
app.use(cors()); // Add this line
const proxy = httpProxy.createProxyServer({});
const servers = ['http://127.0.0.1:5000', 'http://127.0.0.1:5001'];
let currentServer = 0;

app.use((req, res) => {
  proxy.web(req, res, { target: servers[currentServer] });
  currentServer = (currentServer + 1) % servers.length;
});

app.listen(8000, () => console.log('Load balancer running on port 8000'));
