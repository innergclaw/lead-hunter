#!/usr/bin/env node
/**
 * Formspree Webhook Receiver
 * Place this on a server (or use ngrok for local testing)
 * Formspree will POST here when forms are submitted
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;
const PENDING_DIR = path.join(__dirname, 'pending');

// Ensure pending directory exists
if (!fs.existsSync(PENDING_DIR)) {
  fs.mkdirSync(PENDING_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `submission-${timestamp}.json`;
        const filepath = path.join(PENDING_DIR, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        
        console.log(`✅ New submission saved: ${filename}`);
        console.log(`   From: ${data.name} (${data.email})`);
        console.log(`   Tier: ${data.tier || 'free'}`);
        
        // Auto-trigger hunt (optional)
        // exec('node auto-hunt.js --mode=manual');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'received' }));
        
      } catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.writeHead(400);
        res.end('Bad Request');
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🎣 Webhook receiver listening on port ${PORT}`);
  console.log(`   URL: http://localhost:${PORT}/webhook`);
  console.log(`\n📋 To use with Formspree:`);
  console.log(`   1. Expose this server (ngrok http ${PORT})`);
  console.log(`   2. Add webhook URL to your Formspree forms`);
  console.log(`   3. Form submissions will be saved to ./pending/`);
});
