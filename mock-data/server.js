const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3333;

// Enable CORS for all origins
app.use(cors());
// Enable JSON parsing for POST requests
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

// Routes for each data source
app.get('/tax-delinquent.csv', (req, res) => {
  res.sendFile(path.join(__dirname, 'tax-delinquent.csv'));
});

app.get('/code-violations.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'code-violations.json'));
});

app.get('/evictions.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'evictions.html'));
});

app.get('/probate.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'probate.json'));
});

app.get('/provider-api', (req, res) => {
  // Simulate API key check
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - Missing Bearer token' });
  }
  res.sendFile(path.join(__dirname, 'provider-api.json'));
});

// Mark property as seen (POST - must come before GET)
app.post('/api/events/seen/:id', (req, res) => {
  const id = req.params.id;

  // In production, this would store the ID in a database
  // For mock, just return success
  res.json({
    success: true,
    id: decodeURIComponent(id),
    markedAt: new Date().toISOString(),
    message: 'Property marked as seen'
  });
});

// Check if property has been seen before (GET - for deduplication check)
app.get('/api/events/seen/:id', (req, res) => {
  const id = req.params.id;

  // For testing, randomly return seen/not seen to simulate deduplication
  const seen = Math.random() > 0.8; // 20% chance of being "seen"

  res.json({
    seen: seen,
    id: decodeURIComponent(id),
    message: seen ? 'Property already processed' : 'New property'
  });
});

// Mock scoring webhook endpoint
app.post('/webhook/scoring', (req, res) => {
  const properties = Array.isArray(req.body) ? req.body : [req.body];

  // Calculate mock scores
  const results = properties.map(prop => {
    let score = 50; // Base score
    if (prop.flags?.foreclosure) score += 25;
    if (prop.flags?.taxDelinquent) score += 15;
    if (prop.flags?.vacant) score += 10;
    if (prop.flags?.preForeclosure) score += 20;
    if (prop.flags?.absenteeOwner) score += 5;

    return {
      ...prop,
      score: Math.min(score, 100),
      status: 'processed'
    };
  });

  res.json({
    success: true,
    processed: results.length,
    results: results
  });
});

// Log notifications endpoint
app.post('/api/notifications', (req, res) => {
  const notification = req.body;

  console.log('Notification received:', {
    type: notification.type,
    message: notification.message,
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'Notification logged',
    id: Date.now().toString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Mock data server is running',
    endpoints: [
      'http://localhost:3333/tax-delinquent.csv',
      'http://localhost:3333/code-violations.json',
      'http://localhost:3333/evictions.html',
      'http://localhost:3333/probate.json',
      'http://localhost:3333/provider-api',
      'http://localhost:3333/api/events/seen/:id'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║          Mock Data Server for FlipOps Discovery       ║
╚════════════════════════════════════════════════════════╝

Server running at: http://localhost:${PORT}

Available endpoints:
  • Tax CSV:         http://localhost:${PORT}/tax-delinquent.csv
  • Code Violations: http://localhost:${PORT}/code-violations.json
  • Evictions HTML:  http://localhost:${PORT}/evictions.html
  • Probate JSON:    http://localhost:${PORT}/probate.json
  • Provider API:    http://localhost:${PORT}/provider-api

Health Check:        http://localhost:${PORT}/health

To use in n8n, set these environment variables:
  TAX_CSV_URL=http://localhost:3333/tax-delinquent.csv
  CODE_VIOLATIONS_URL=http://localhost:3333/code-violations.json
  EVICTIONS_URL=http://localhost:3333/evictions.html
  PROBATE_URL=http://localhost:3333/probate.json
  PROVIDER_API_URL=http://localhost:3333/provider-api
  PROVIDER_API_KEY=mock-api-key-123

Press Ctrl+C to stop the server.
  `);
});