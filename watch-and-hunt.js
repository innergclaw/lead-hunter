#!/usr/bin/env node
/**
 * Lead Hunter Watcher
 * Watches pending/ folder and auto-runs full-auto-hunt.js
 * 
 * Usage: node watch-and-hunt.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PENDING_DIR = path.join(__dirname, 'pending');
const WATCH_INTERVAL = 5000; // Check every 5 seconds

console.log('👁️  Lead Hunter Watcher');
console.log('========================');
console.log(`Watching: ${PENDING_DIR}`);
console.log('Interval: 5 seconds');
console.log('\nWaiting for new submissions...\n');

// Ensure pending directory exists
if (!fs.existsSync(PENDING_DIR)) {
  fs.mkdirSync(PENDING_DIR, { recursive: true });
  console.log('📁 Created pending/ folder');
}

// Track processed files
const processed = new Set();

// Check for new files
function checkForNewSubmissions() {
  try {
    const files = fs.readdirSync(PENDING_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(PENDING_DIR, f));
    
    for (const file of files) {
      if (!processed.has(file)) {
        processed.add(file);
        
        console.log('\n🔔 NEW SUBMISSION DETECTED!');
        console.log(`   File: ${path.basename(file)}`);
        
        // Read to show customer name
        try {
          const data = JSON.parse(fs.readFileSync(file, 'utf8'));
          console.log(`   Customer: ${data.name}`);
          console.log(`   Tier: ${data.tier}`);
          console.log('');
          
          // Auto-run hunt after 2 second delay
          console.log('🚀 Starting auto-hunt in 2 seconds...');
          setTimeout(() => {
            console.log('   Executing: full-auto-hunt.js\n');
            
            const huntProcess = exec(`node full-auto-hunt.js --file="${file}"`, {
              cwd: __dirname
            }, (error, stdout, stderr) => {
              if (error) {
                console.error('❌ Hunt failed:', error);
                return;
              }
              
              console.log(stdout);
              if (stderr) console.error(stderr);
              
              console.log('\n✅ Hunt process completed!');
              console.log('   Check output/ folder for results.');
              console.log('\n👁️  Watching for more submissions...\n');
            });
            
            // Stream output in real-time
            huntProcess.stdout.on('data', (data) => {
              process.stdout.write(data);
            });
            
            huntProcess.stderr.on('data', (data) => {
              process.stderr.write(data);
            });
            
          }, 2000);
          
        } catch (e) {
          console.error('❌ Error reading file:', e.message);
        }
      }
    }
  } catch (e) {
    console.error('❌ Error scanning folder:', e.message);
  }
}

// Initial check
checkForNewSubmissions();

// Watch loop
setInterval(checkForNewSubmissions, WATCH_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping watcher...');
  process.exit(0);
});
