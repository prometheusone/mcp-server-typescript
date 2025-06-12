const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Basic SSE endpoint for n8n
app.get('/sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connection message
  res.write('data: {"type": "connected"}\n\n');

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(':keepalive\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

// Messages endpoint
app.post('/messages', express.json(), (req, res) => {
  console.log('Received message:', req.body);
  res.json({ status: 'received' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`DataForSEO MCP Server listening on port ${port}`);
});
