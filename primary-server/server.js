const express = require("express");
const fs = require("fs");
const axios = require("axios");
const { Mutex } = require("async-mutex");
const WebSocket = require("ws");

const app = express();
const PORT = 5000; // Primary server port
const REPLICA_URL = "http://localhost:5001"; // Replica server URL

app.use(express.json());
const mutex = new Mutex();

// Load data from file
let inventory = JSON.parse(fs.readFileSync("data.json", "utf8"));

// Save data to file
function saveData() {
  fs.writeFileSync("data.json", JSON.stringify(inventory, null, 2));
}

// Synchronize with replica server
async function syncWithReplica() {
  try {
    await axios.post(`${REPLICA_URL}/sync`, { inventory });
  } catch (error) {
    console.error("Error syncing with replica:", error);
  }
}

// WebSocket server setup (to notify Mumbai server)
const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", (ws) => {
  console.log("New WebSocket connection.");
  ws.on("close", () => {
    console.log("WebSocket connection closed.");
  });
});

// Notify Mumbai server about the new order
// Primary server code
function notifyMumbai(orderNo) {
  // Assuming Mumbai server is listening on ws://localhost:5003
  const mumbaiWsClient = new WebSocket("ws://localhost:5003");

  mumbaiWsClient.on("open", () => {
    // Send the message to Mumbai server
    mumbaiWsClient.send(JSON.stringify({
      type: "UPDATE_INVENTORY",
      message: `New order added: ${orderNo}`,
      alert: true
    }));
  });

  mumbaiWsClient.on("error", (err) => {
    console.error("Error notifying Mumbai server:", err);
  });
}

// Get inventory
app.get("/inventory", (req, res) => {
  res.json(inventory);
});

// Add order
app.post("/inventory", async (req, res) => {
  const { orderNo, location, address, orderPlacementDate, status } = req.body;

  await mutex.runExclusive(() => {
    inventory.push({ orderNo, location, address, orderPlacementDate, status });
    saveData();
  });

  await syncWithReplica(); // Ensure consistency with replica
  notifyMumbai(orderNo);  // Notify Mumbai server about the new order
  res.status(201).send("Order added.");
});

// Sync endpoint for replica
app.post("/sync", (req, res) => {
  inventory = req.body.inventory;
  saveData();
  res.send("Synced with primary.");
});

// Upgrade the server to support WebSocket connections
app.server = app.listen(PORT, () => {
  console.log(`Primary server running on port ${PORT}`);
});

app.server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});