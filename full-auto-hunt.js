#!/usr/bin/env node
/**
 * Lead Hunter — FULL AUTO Mode
 * AI controls Tandem Browser, hunts leads, fills JSON, notifies when done
 * 
 * Usage: node full-auto-hunt.js --file=pending/submission.json
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { exec } = require('child_process');

// Config
const TOKEN_PATH = path.join(process.env.HOME, '.tandem/api-token');
const TANDEM_API = 'http://127.0.0.1:8765';
const OUTPUT_DIR = path.join(__dirname, 'output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Get Tandem API token
function getToken() {
  try {
    return fs.readFileSync(TOKEN_PATH, 'utf8').trim();
  } catch (e) {
    console.error('❌ Tandem token not found. Is Tandem running?');
    process.exit(1);
  }
}

// Make request to Tandem API
function tandemRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const options = {
      hostname: '127.0.0.1',
      port: 8765,
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Open new tab and navigate
async function openTab(url, focus = false) {
  console.log(`🌐 Opening: ${url}`);
  return await tandemRequest('/tabs/open', 'POST', { url, focus });
}

// Get page snapshot
async function getSnapshot() {
  return await tandemRequest('/snapshot?compact=true');
}

// Get page content
async function getPageContent() {
  return await tandemRequest('/page-content');
}

// Parse leads from DuckDuckGo search results
function parseLeadsFromDuckDuckGo(content, tier) {
  const text = content.text || '';
  const leads = [];
  
  // Look for business patterns in text
  const lines = text.split('\n').filter(line => line.trim());
  
  // Simple parsing - look for patterns that look like business listings
  // This is a basic parser - can be improved with better pattern matching
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Pattern: Business name (often followed by address/phone)
    if (line.match(/^[A-Z][a-zA-Z\s&']{2,50}$/) && 
        i + 1 < lines.length && 
        (lines[i + 1].match(/\d+/) || lines[i + 1].includes('St') || lines[i + 1].includes('Ave'))) {
      
      const lead = {
        name: line.trim(),
        address: null,
        phone: null,
        google_maps: null,
        website: null,
        instagram: null,
        score: 0
      };
      
      // Look for address in next few lines
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j];
        
        // Address pattern
        if (!lead.address && nextLine.match(/\d+\s+\w+\s+(St|Ave|Blvd|Rd|Dr|Ln|Way)/)) {
          lead.address = nextLine.trim();
        }
        
        // Phone pattern
        if (!lead.phone && nextLine.match(/\(\d{3}\)\s*\d{3}[-\s]?\d{4}/)) {
          lead.phone = nextLine.match(/\(\d{3}\)\s*\d{3}[-\s]?\d{4}/)[0];
        }
        
        // Rating/review pattern (for scoring)
        if (nextLine.match(/\d\.\d\s*\(\d+\)/)) {
          const match = nextLine.match(/\d\.\d\s*\((\d+)\)/);
          if (match) {
            const reviews = parseInt(match[1]);
            if (reviews < 50) lead.score += 1; // Low reviews = early stage
          }
        }
      }
      
      // Base scoring
      lead.score += 2; // No website assumed (they're on DDG not Google)
      lead.score += 1; // Needs booking system (assumed for service businesses)
      
      // Only add if we have at least name
      if (lead.name && lead.name.length > 3) {
        leads.push(lead);
      }
    }
  }
  
  return leads;
}

// Hunt leads for a specific niche
async function huntNiche(niche, location, tier, needed) {
  console.log(`\n🔍 Hunting: ${niche} in ${location}`);
  console.log(`   Need: ${needed} leads | Tier: ${tier}`);
  
  const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(niche)}+${encodeURIComponent(location)}+business`;
  
  // Open search in Tandem
  await openTab(searchUrl, true);
  
  // Wait for page to load
  console.log('⏳ Waiting for page to load (5 sec)...');
  await new Promise(r => setTimeout(r, 5000));
  
  // Get page content
  const content = await getPageContent();
  
  // Parse leads
  let leads = parseLeadsFromDuckDuckGo(content, tier);
  
  // Remove duplicates and limit
  leads = leads.slice(0, needed);
  
  console.log(`   Found: ${leads.length} leads`);
  
  // For higher tiers, we need to enrich data
  if (tier !== 'free' && leads.length > 0) {
    console.log('   🔎 Enriching lead data...');
    
    for (let lead of leads) {
      // Try to find Google Maps link
      if (lead.name) {
        const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(lead.name + ' ' + location)}`;
        lead.google_maps = mapsUrl;
      }
      
      // For Pro/Company tiers, try to find more info
      if (tier === 'pro' || tier === 'company') {
        // Simulate finding Instagram (in real implementation, would search)
        lead.instagram = null; // Would need additional search
        lead.email = null; // Would need hunter.io or similar
        
        // Add notes
        lead.notes = `Hunted via DuckDuckGo for ${niche}. Score based on early-stage signals.`;
      }
    }
  }
  
  return leads;
}

// Try alternative searches when primary doesn't yield enough
async function tryAlternativeSearches(niche, location, tier, needed, existingLeads) {
  const alternativeTerms = [
    `${niche} near me`,
    `${niche} ${location}`,
    `best ${niche} ${location}`,
    `${niche} services ${location}`
  ];
  
  const allLeads = [...existingLeads];
  const seenNames = new Set(existingLeads.map(l => l.name.toLowerCase()));
  
  for (const term of alternativeTerms) {
    if (allLeads.length >= needed) break;
    
    console.log(`\n🔄 Trying alternative: "${term}"`);
    
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(term)}`;
    await openTab(searchUrl, true);
    await new Promise(r => setTimeout(r, 5000));
    
    const content = await getPageContent();
    const newLeads = parseLeadsFromDuckDuckGo(content, tier);
    
    // Add only unique leads
    for (const lead of newLeads) {
      if (!seenNames.has(lead.name.toLowerCase()) && allLeads.length < needed) {
        seenNames.add(lead.name.toLowerCase());
        allLeads.push(lead);
      }
    }
    
    console.log(`   Total now: ${allLeads.length}/${needed} leads`);
  }
  
  return allLeads;
}

// Expand search radius for more leads
async function expandSearchRadius(niche, location, tier, needed, existingLeads) {
  const nearbyAreas = [
    `${location} area`,
    `near ${location}`,
    `${location} metro`
  ];
  
  const allLeads = [...existingLeads];
  const seenNames = new Set(existingLeads.map(l => l.name.toLowerCase()));
  
  for (const area of nearbyAreas) {
    if (allLeads.length >= needed) break;
    
    console.log(`\n🌎 Expanding to: "${niche} ${area}"`);
    
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(niche + ' ' + area)}`;
    await openTab(searchUrl, true);
    await new Promise(r => setTimeout(r, 5000));
    
    const content = await getPageContent();
    const newLeads = parseLeadsFromDuckDuckGo(content, tier);
    
    for (const lead of newLeads) {
      if (!seenNames.has(lead.name.toLowerCase()) && allLeads.length < needed) {
        seenNames.add(lead.name.toLowerCase());
        allLeads.push(lead);
      }
    }
    
    console.log(`   Total now: ${allLeads.length}/${needed} leads`);
  }
  
  return allLeads;
}

// Main hunt function
async function fullAutoHunt(submissionFile) {
  console.log('🤖 LEAD HUNTER — FULL AUTO MODE');
  console.log('================================\n');
  
  // Load submission
  if (!fs.existsSync(submissionFile)) {
    console.error(`❌ File not found: ${submissionFile}`);
    console.log('\nUsage: node full-auto-hunt.js --file=pending/submission.json');
    process.exit(1);
  }
  
  const submission = JSON.parse(fs.readFileSync(submissionFile, 'utf8'));
  const { name, email, tier, niche, niches, location, secondary_location } = submission;
  
  console.log(`📋 Customer: ${name}`);
  console.log(`   Email: ${email}`);
  console.log(`   Tier: ${tier.toUpperCase()}`);
  console.log(`   Location: ${location}`);
  console.log('');
  
  // Calculate leads needed
  const leadsNeeded = {
    'free': 5,
    'starter': 15,
    'pro': 50,
    'company': 150
  }[tier] || 5;
  
  // Determine niches to hunt
  const nichesToHunt = niches 
    ? niches.split(',').map(n => n.trim()) 
    : [niche];
  
  const leadsPerNiche = Math.ceil(leadsNeeded / nichesToHunt.length);
  
  console.log(`🎯 Hunting Plan:`);
  console.log(`   Niches: ${nichesToHunt.join(', ')}`);
  console.log(`   Total needed: ${leadsNeeded}`);
  console.log(`   Per niche: ~${leadsPerNiche}`);
  console.log('');
  
  // Hunt each niche
  let allLeads = [];
  
  for (const n of nichesToHunt) {
    const leads = await huntNiche(n, location, tier, leadsPerNiche);
    allLeads.push(...leads);
    
    // If we have secondary location, hunt there too
    if (secondary_location && allLeads.length < leadsNeeded) {
      const moreLeads = await huntNiche(n, secondary_location, tier, leadsPerNiche - leads.length);
      allLeads.push(...moreLeads);
    }
    
    if (allLeads.length >= leadsNeeded) break;
  }
  
  // If we still don't have enough, try alternative searches
  if (allLeads.length < leadsNeeded) {
    console.log(`\n⚠️  Only found ${allLeads.length}/${leadsNeeded} leads. Trying alternatives...`);
    
    for (const n of nichesToHunt) {
      if (allLeads.length >= leadsNeeded) break;
      
      allLeads = await tryAlternativeSearches(n, location, tier, leadsNeeded, allLeads);
    }
  }
  
  // If still not enough, expand search radius
  if (allLeads.length < leadsNeeded) {
    console.log(`\n⚠️  Still need ${leadsNeeded - allLeads.length} leads. Expanding search area...`);
    
    for (const n of nichesToHunt) {
      if (allLeads.length >= leadsNeeded) break;
      
      allLeads = await expandSearchRadius(n, location, tier, leadsNeeded, allLeads);
    }
  }
  
  // Remove duplicates by name
  const seenNames = new Set();
  const uniqueLeads = [];
  for (const lead of allLeads) {
    const nameKey = lead.name.toLowerCase();
    if (!seenNames.has(nameKey) && uniqueLeads.length < leadsNeeded) {
      seenNames.add(nameKey);
      uniqueLeads.push(lead);
    }
  }
  
  const finalLeads = uniqueLeads;
  const isPartial = finalLeads.length < leadsNeeded;
  
  console.log(`\n${isPartial ? '⚠️' : '✅'} HUNT ${isPartial ? 'PARTIALLY COMPLETE' : 'COMPLETE'}!`);
  console.log(`   Leads found: ${finalLeads.length}/${leadsNeeded}`);
  
  if (isPartial) {
    console.log(`   Note: Could not find ${leadsNeeded - finalLeads.length} more unique leads.`);
    console.log(`   This area may be saturated or the niche too specific.`);
  }
  
  // Generate output file
  const timestamp = new Date().toISOString().split('T')[0];
  const safeName = name.replace(/\s+/g, '-').toLowerCase();
  const outputFile = path.join(OUTPUT_DIR, `leads-${tier}-${safeName}-${timestamp}.json`);
  
  const output = {
    customer: {
      name,
      email,
      tier,
      niche: niche || niches,
      location,
      secondary_location: secondary_location || null,
      submitted: new Date().toISOString(),
      hunted: new Date().toISOString()
    },
    hunt_summary: {
      niches_hunted: nichesToHunt,
      leads_requested: leadsNeeded,
      leads_found: finalLeads.length,
      is_partial: isPartial,
      tier
    },
    leads: finalLeads,
    status: isPartial ? 'partial_ready_to_send' : 'ready_to_send'
  };
  
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  
  console.log(`\n📁 Output saved: ${outputFile}`);
  
  // Open file for review
  exec(`open "${outputFile}"`);
  
  // Move submission to processed
  const processedDir = path.join(__dirname, 'processed');
  if (!fs.existsSync(processedDir)) {
    fs.mkdirSync(processedDir, { recursive: true });
  }
  
  const processedFile = path.join(processedDir, path.basename(submissionFile));
  fs.renameSync(submissionFile, processedFile);
  
  // FINAL NOTIFICATION
  const statusEmoji = isPartial ? '⚠️' : '✅';
  const statusText = isPartial ? 'PARTIALLY COMPLETE' : 'COMPLETE';
  
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log(`║  ${statusEmoji} DONE! LEAD HUNT ${statusText}! ${statusEmoji}          ║`);
  console.log('║                                                          ║');
  console.log(`║  Customer: ${name.padEnd(45)} ║`);
  console.log(`║  Leads: ${String(finalLeads.length).padEnd(48)} ║`);
  console.log(`║  Requested: ${String(leadsNeeded).padEnd(44)} ║`);
  if (isPartial) {
    console.log(`║  ⚠️  Shortfall: ${String(leadsNeeded - finalLeads.length).padEnd(41)} ║`);
  }
  console.log(`║  File: ${outputFile.split('/').pop().slice(0, 45).padEnd(47)} ║`);
  console.log('║                                                          ║');
  console.log('║  Next step: Review leads, then run:                     ║');
  console.log(`║  node send-leads.js ${outputFile.split('/').pop().slice(0, 35).padEnd(35)} ║`);
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  // Also save a notification file
  const notificationFile = path.join(__dirname, 'READY_TO_SEND.txt');
  fs.writeFileSync(notificationFile, `
✅ LEAD HUNT COMPLETE!

Customer: ${name}
Email: ${email}
Tier: ${tier}
Leads: ${finalLeads.length}
File: ${outputFile}

Ready to send. Run:
node send-leads.js ${outputFile}
`);
  
  exec(`open "${notificationFile}"`);
  
  return outputFile;
}

// CLI
const args = process.argv.slice(2);
const fileArg = args.find(arg => arg.startsWith('--file='));

if (!fileArg) {
  console.log('Usage: node full-auto-hunt.js --file=pending/submission.json');
  console.log('\nExample:');
  console.log('  node full-auto-hunt.js --file=pending/john-smith.json');
  process.exit(1);
}

const submissionFile = fileArg.replace('--file=', '');
fullAutoHunt(submissionFile).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
