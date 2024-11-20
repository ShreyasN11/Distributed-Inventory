const express = require('express');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const port = 5002;

// Path to the data.json file in the 'server' folder
const dataFilePath = path.join(__dirname, '..', 'primary-server', 'data.json');

// Middleware to handle CORS for cross-origin requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// WebSocket server setup to listen for notifications from primary server
const wss = new WebSocket.Server({ port: 5003 }); // Mumbai WebSocket server port
const clients = new Set();

// Function to broadcast messages to all connected WebSocket clients
function broadcast(message) {
  clients.forEach(client => {
    client.send(JSON.stringify(message));
  });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket connection to Mumbai server.');
  clients.add(ws);

  ws.on('close', () => {
    console.log('WebSocket connection closed.');
    clients.delete(ws);
  });
});

// Endpoint to get only orders for Mumbai
app.get('/inventory/mumbai', (req, res) => {
  fs.readFile(dataFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Error reading data' });
    }
    try {
      const orders = JSON.parse(data);
      // Filter orders where location is 'Mumbai'
      const mumbaiOrders = orders.filter(order => order.location.toLowerCase() === 'mumbai');
      res.json(mumbaiOrders);
    } catch (error) {
      res.status(500).json({ message: 'Error processing data' });
    }
  });
});

// Sync endpoint to receive inventory from primary server
app.post('/sync', (req, res) => {
  // Save inventory to Mumbai server if necessary (or update as required)
  fs.writeFileSync(dataFilePath, JSON.stringify(req.body.inventory, null, 2));
  res.send('Synced with primary server.');
});

app.listen(port, () => {
  console.log(`Mumbai server running on port ${port}`);
});