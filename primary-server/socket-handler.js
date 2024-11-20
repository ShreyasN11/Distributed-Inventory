const { WebSocketServer } = require('ws');

module.exports = (server, dataFile, lock) => {
  const wss = new WebSocketServer({ server });
  const clients = new Set();

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection.');
    clients.add(ws);

    ws.on('close', () => {
      console.log('WebSocket connection closed.');
      clients.delete(ws);
    });
  });

  // Function to broadcast messages
  const broadcast = (message) => {
    for (const client of clients) {
      client.send(JSON.stringify(message));
    }
  };

  const notifyUpdate = (item) => {
    broadcast({ type: 'UPDATE_INVENTORY', message: `New item added: ${item.name}`, alert: true, });
  };

  return { notifyUpdate };
};
