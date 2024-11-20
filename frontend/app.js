const apiBase = 'http://localhost:8000'; // Load balancer URL
const wsServer = 'ws://localhost:5000'; // WebSocket for real-time communication
const updatesList = document.getElementById('updates');

// Fetch and display inventory
const fetchInventory = async () => {
  const res = await fetch(`${apiBase}/inventory`);
  const data = await res.json();
  const table = document.getElementById('inventoryTable');
  table.innerHTML = data
    .map((item, index) => `<tr><td>${index + 1}</td><td>${item.name}</td></tr>`)
    .join('');
};

// Add inventory item
document.getElementById('addItemForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const itemName = document.getElementById('itemName').value;
  const res = await fetch(`${apiBase}/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: itemName }),
  });

  if (res.ok) {
    document.getElementById('itemName').value = '';
    fetchInventory();
  }
});

// Establish WebSocket connection
const ws = new WebSocket(wsServer);

ws.onopen = () => console.log('WebSocket connected.');

ws.onmessage = (message) => {
  const data = JSON.parse(message.data);
  const li = document.createElement('li');
  li.textContent = data.message;
  li.className = 'list-group-item';
  updatesList.appendChild(li);
  fetchInventory();
};

ws.onclose = () => console.log('WebSocket disconnected.');
