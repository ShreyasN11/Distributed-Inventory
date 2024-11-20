const WebSocket = require('ws');
const fs = require('fs');
const { Mutex } = require('async-mutex');

module.exports = (dataFile) => {
  const lock = new Mutex();
  const ws = new WebSocket('ws://localhost:5000');

  ws.on('open', () => {
    console.log('Connected to primary server.');
  });

  ws.on('message', async (message) => {
    const { type, data } = JSON.parse(message);

    if (type === 'INIT') {
      await lock.runExclusive(() => {
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
      });
    }
  });

  return ws;
};
