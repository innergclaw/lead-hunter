#!/usr/bin/env node
/**
 * Lead Hunter — Auto Hunt System
 * Monitors Formspree submissions and auto-hunts leads
 * 
 * Usage:
 *   node auto-hunt.js --mode=manual    # Hunts and saves to file for review
 *   node auto-hunt.js --mode=auto      # Hunts and auto-sends email
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const https = require('https');

// Config
const FORMS = {
  free: 'xkoqpnjo',
  starter: 'xreyogpk',
  pro: 'mbdzpjgk',
  company: 'xnjgoqpb'
};

const STATE_FILE = path.join(__dirname, 'hunt-state.json');

// Load processed submissions
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading state:', e.message);
  }
  return { processed: [] };
}

// Save processed submissions
function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Fetch new submissions from Formspree
// Note: Formspree requires API key for this - using webhook approach instead
async function checkNewSubmissions() {
  // For now, this is a placeholder - Formspree sends webhooks
  // We'll use a file-based approach where you drop form data
  const pendingDir = path.join(__dirname, 'pending');
  
  if (!fs.existsSync(pendingDir)) {
    fs.mkdirSync(pendingDir, { recursive: true });
    return [];
  }
  
  const files = fs.readdirSync(pendingDir)
    .filter(f => f.endsWith('.json'))
    .map(f => ({
      path: path.join(pendingDir, f),
      data: JSON.parse(fs.readFileSync(path.join(pendingDir, f), 'utf8'))
    }));
  
  return files;
}

// Generate hunt commands based on tier
function generateHuntCommands(submission) {
  const { tier, niche, location, niches } = submission;
  const commands = [];
  
  switch(tier) {
    case 'free':
      commands.push({
        url: `https://duckduckgo.com/?q=${encodeURIComponent(niche)}+${encodeURIComponent(location)}+business`,
        fields: ['name', 'address', 'phone', 'google_maps', 'website', 'score'],
        leads: 5,
        time: '15 min'
      });
      break;
      
    case 'starter':
      commands.push({
        url: `https://duckduckgo.com/?q=${encodeURIComponent(niche)}+${encodeURIComponent(location)}+business`,
        fields: ['name', 'address', 'phone', 'google_maps', 'website', 'instagram', 'score', 'review_count'],
        leads: 15,
        time: '1 hr'
      });
      break;
      
    case 'pro':
      const proNiches = niches ? niches.split(',') : [niche];
      proNiches.forEach(n => {
        commands.push({
          url: `https://duckduckgo.com/?q=${encodeURIComponent(n.trim())}+${encodeURIComponent(location)}+business`,
          fields: ['name', 'address', 'phone', 'google_maps', 'website', 'instagram', 'email', 'score', 'notes'],
          leads: Math.ceil(50 / proNiches.length),
          time: '3-4 hrs total'
        });
      });
      break;
      
    case 'company':
      const compNiches = niches ? niches.split(',') : [niche];
      compNiches.forEach(n => {
        commands.push({
          url: `https://duckduckgo.com/?q=${encodeURIComponent(n.trim())}+${encodeURIComponent(location)}+business`,
          fields: ['name', 'owner_name', 'address', 'phone', 'email', 'google_maps', 'website', 'instagram', 'competitor_check', 'score', 'outreach_angle'],
          leads: Math.ceil(150 / compNiches.length),
          time: '8-12 hrs total'
        });
      });
      break;
  }
  
  return commands;
}

// Open Tandem Browser with hunt URL
function openTandem(url) {
  return new Promise((resolve, reject) => {
    // Check if Tandem is running
    exec('lsof -i :8765 | grep LISTEN', (error, stdout) => {
      if (error || !stdout) {
        console.log('⚠️  Tandem Browser not running. Starting it...');
        // Start Tandem
        exec('cd ~/tandem-browser && npm start &', (err) => {
          if (err) {
            console.error('Failed to start Tandem:', err);
            reject(err);
            return;
          }
          console.log('⏳ Waiting for Tandem to start (5 sec)...');
          setTimeout(() => {
            openTab(url).then(resolve).catch(reject);
          }, 5000);
        });
      } else {
        openTab(url).then(resolve).catch(reject);
      }
    });
  });
}

// Open tab via Tandem API
async function openTab(url) {
  const TOKEN = fs.readFileSync(path.join(process.env.HOME, '.tandem/api-token'), 'utf8').trim();
  
  const options = {
    hostname: '127.0.0.1',
    port: 8765,
    path: '/tabs/open',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Tandem tab opened:', url);
        resolve(JSON.parse(data));
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify({ url, focus: true }));
    req.end();
  });
}

// Generate lead template for Xcode
function generateLeadFile(submission, commands) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `leads-${submission.tier}-${submission.name.replace(/\s+/g, '-')}-${timestamp}.json`;
  const outputPath = path.join(__dirname, 'output', filename);
  
  // Ensure output directory exists
  if (!fs.existsSync(path.join(__dirname, 'output'))) {
    fs.mkdirSync(path.join(__dirname, 'output'), { recursive: true });
  }
  
  const template = {
    customer: {
      name: submission.name,
      email: submission.email,
      tier: submission.tier,
      niche: submission.niche || submission.niches,
      location: submission.location,
      submitted: new Date().toISOString()
    },
    hunt_commands: commands,
    leads: [], // Fill this in after hunting
    status: 'pending'
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(template, null, 2));
  
  // Open in default editor (VS Code or TextEdit)
  exec(`open "${outputPath}"`, () => {
    console.log(`📄 Lead file opened: ${outputPath}`);
  });
  
  return outputPath;
}

// Auto-send email with leads
function sendLeadEmail(submission, leadsFile) {
  // This would integrate with your email system
  // For now, we'll just log it
  console.log(`📧 Would send email to: ${submission.email}`);
  console.log(`   Subject: Your ${submission.tier === 'free' ? '5' : submission.tier === 'starter' ? '15' : submission.tier === 'pro' ? '50' : '150'} Leads from Lead Hunter`);
  console.log(`   Attachment: ${leadsFile}`);
}

// Main automation loop
async function runAutomation(mode = 'manual') {
  console.log('🤖 Lead Hunter Auto-Hunt System');
  console.log(`Mode: ${mode.toUpperCase()}`);
  console.log('────────────────────────────────\n');
  
  const submissions = await checkNewSubmissions();
  
  if (submissions.length === 0) {
    console.log('⏳ No new submissions. Waiting...');
    console.log('\nTo submit a test:');
    console.log('1. Visit: https://innergclaw.github.io/lead-hunter/free.html');
    console.log('2. Fill out the form');
    console.log('3. Or manually create: pending/test-submission.json');
    return;
  }
  
  for (const { path: filePath, data: submission } of submissions) {
    console.log(`\n📋 New Submission: ${submission.name}`);
    console.log(`   Tier: ${submission.tier}`);
    console.log(`   Niche: ${submission.niche || submission.niches}`);
    console.log(`   Location: ${submission.location}`);
    
    // Generate hunt commands
    const commands = generateHuntCommands(submission);
    console.log(`\n🎯 Hunt Plan:`);
    commands.forEach((cmd, i) => {
      console.log(`   ${i + 1}. ${cmd.url}`);
      console.log(`      Leads: ${cmd.leads} | Time: ${cmd.time}`);
    });
    
    // Open Tandem Browser
    console.log('\n🌐 Opening Tandem Browser...');
    try {
      await openTandem(commands[0].url);
      
      // Generate lead file
      const leadsFile = generateLeadFile(submission, commands);
      
      if (mode === 'auto') {
        // In auto mode, would wait for hunt completion and send
        console.log('\n⚠️  Auto-send not fully implemented yet.');
        console.log('   File saved for manual review:', leadsFile);
      } else {
        console.log('\n✅ Manual mode:');
        console.log('   1. Hunt leads in Tandem Browser');
        console.log('   2. Fill in leads array in:', leadsFile);
        console.log('   3. Run: node send-leads.js', leadsFile);
      }
      
      // Move processed file
      const processedDir = path.join(__dirname, 'processed');
      if (!fs.existsSync(processedDir)) {
        fs.mkdirSync(processedDir, { recursive: true });
      }
      fs.renameSync(filePath, path.join(processedDir, path.basename(filePath)));
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
}

// CLI
const mode = process.argv.includes('--mode=auto') ? 'auto' : 'manual';
runAutomation(mode);

// Watch mode
if (process.argv.includes('--watch')) {
  console.log('\n👀 Watch mode enabled. Checking every 30 seconds...\n');
  setInterval(() => runAutomation(mode), 30000);
}
