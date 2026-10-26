import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import axios from 'axios';

const PORT = process.env.PORT || 5001;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/api/stream' });

// Store connected WS clients
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WebSocket] Client connected. Total: ${clients.size}`);

  ws.send(JSON.stringify({
    type: 'connected',
    message: 'ScamShield Live Transaction Stream connected'
  }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WebSocket] Client disconnected. Total: ${clients.size}`);
  });
});

// Periodic background transaction stream broadcaster (PaySim replay worker)
setInterval(async () => {
  if (clients.size === 0) return;

  try {
    const res = await axios.get(`${AI_SERVICE_URL}/api/txn/stream-sample?count=1`);
    if (res.data && res.data.transactions && res.data.transactions.length > 0) {
      const txn = res.data.transactions[0];
      const payload = JSON.stringify({
        type: 'transaction',
        data: txn
      });

      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      }
    }
  } catch (err) {
    // AI service might be starting up
  }
}, 2200);

// Proxy helper
async function proxyToAI(req, res, method, endpoint, body = null) {
  try {
    const targetUrl = `${AI_SERVICE_URL}${endpoint}`;
    const response = await axios({
      method,
      url: targetUrl,
      data: body || req.body,
      params: req.query
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`Error forwarding to AI service (${endpoint}):`, error.message);
    const status = error.response ? error.response.status : 503;
    const msg = error.response ? error.response.data : { error: 'AI service unavailable' };
    return res.status(status).json(msg);
  }
}

// 1. Text & Image / Payload Analysis
app.post('/api/analyze', (req, res) => {
  proxyToAI(req, res, 'POST', '/api/analyze');
});

// 2. Autonomous LLM Agent Analysis
app.post('/api/analyze/agent', (req, res) => {
  proxyToAI(req, res, 'POST', '/api/analyze/agent');
});

// 3. User Feedback & Active Learning
app.post('/api/feedback', (req, res) => {
  proxyToAI(req, res, 'POST', '/api/feedback');
});

// 4. Evaluation Metrics
app.get('/api/metrics', (req, res) => {
  proxyToAI(req, res, 'GET', '/api/metrics');
});

// 5. SafePay Pre-confirmation Check & Real-time Live Evaluator
app.post('/api/payment/check', (req, res) => {
  proxyToAI(req, res, 'POST', '/api/payment/check');
});

app.post('/api/payment/evaluate-input', (req, res) => {
  proxyToAI(req, res, 'POST', '/api/payment/evaluate-input');
});

// 6. Simulator: Start Drill
app.post('/api/sim/start', (req, res) => {
  proxyToAI(req, res, 'POST', '/api/sim/start');
});

// 7. Simulator: Turn Submission
app.post('/api/sim/turn', (req, res) => {
  proxyToAI(req, res, 'POST', '/api/sim/turn');
});

// 8. Simulator: Profile & Resistance Score
app.get('/api/sim/profile', (req, res) => {
  proxyToAI(req, res, 'GET', '/api/sim/profile');
});

// 9. Account Graph & Topology
app.get('/api/txn/graph', (req, res) => {
  proxyToAI(req, res, 'GET', '/api/txn/graph');
});

// 9b. Live Transaction Stream Sample
app.get('/api/txn/stream-sample', (req, res) => {
  proxyToAI(req, res, 'GET', '/api/txn/stream-sample');
});

// 10. Inject Attack Burst
app.post('/api/txn/inject-attack', async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/txn/inject-attack`);
    
    // Broadcast attack event to all connected dashboard WebSocket clients!
    const broadcastMsg = JSON.stringify({
      type: 'attack_injected',
      data: response.data
    });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(broadcastMsg);
      }
    }

    return res.json(response.data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 11. Reset Account Graph
app.post('/api/txn/reset-graph', (req, res) => {
  proxyToAI(req, res, 'POST', '/api/txn/reset-graph');
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    gateway: 'healthy',
    clients: clients.size,
    ai_service_url: AI_SERVICE_URL
  });
});

server.listen(PORT, () => {
  console.log(`[Gateway] ScamShield Node.js Gateway listening on port ${PORT}`);
  console.log(`[Gateway] WebSocket streaming live on ws://localhost:${PORT}/api/stream`);
});

