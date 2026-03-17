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
  const seenNames = new Set();
  
  // STRICT Blocklist - exclude these completely
  const BLOCKLIST = [
    // Directories & platforms
    'yelp', 'google', 'mapquest', 'booksy', 'square', 'facebook', 'instagram',
    'tiktok', 'youtube', 'hours guide', 'hours open', 'salondiscover', 'local',
    'find local', 'discover', 'best of', 'near me', 'services', 'appointment',
    'booking', 'schedule', 'open now', 'closed', 'reviews', 'photos',
    'directions', 'website', 'phone', 'address', 'map', 'search', 'results',
    'privacy', 'terms', 'about', 'contact', 'home', 'menu', 'book now',
    'get directions', 'call now', 'visit website', 'read more', 'learn more',
    'view profile', 'see all', 'show more', 'load more', 'next page',
    'page 1', 'page 2', '1 - 10', 'of 100', 'sort by', 'filter by',
    'booksy inc', 'the booking', 'app store', 'play store', 'download',
    'install', 'get app', 'mobile app', 'website builder', 'wix', 'squarespace',
    'wordpress', 'godaddy', 'shopify', 'etsy', 'amazon', 'ebay', 'craigslist',
    'barbershops.net', 'locate', 'groupon', 'thumbtack', 'porch', 'angie',
    
    // Generic non-businesses
    'services', 'service', 'local', 'best', 'top', 'near', 'find', 
    'search', 'results', 'page', 'next', 'previous', 'loading',
    'error', '404', 'home', 'about', 'contact', 'menu', 'nav',
    'experience', 'updated', 'guide', 'the best', '[updated', '2026]', '2025]',
    'in philadelphia', 'philadelphia pa', 'philadelphia, pa', 'barber shops',
    'barbershops', 'hair salons', 'nail salons', 
    
    // Articles and blog titles
    'the ultimate', 'ultimate guide', 'complete guide', 'how to', 'top 10',
    'best of', 'review', 'reviews 202', 'vs ', 'versus', 'compared',
    'what is', 'where to', 'when to', 'why choose', 'should you',
    
    // Single words that aren't businesses
    'barbers', 'salons', 'shops', 'stores', 'spa', 'studio', 'shop',
    'place', 'spot', 'location', 'area', 'center', 'centre'
  ];
  
  // Helper to check if name is valid business
  function isValidBusiness(name) {
    // Clean up the name
    const cleanName = name.trim();
    const lower = cleanName.toLowerCase();
    
    // Must be 3-40 chars (business names aren't super long)
    if (cleanName.length < 3 || cleanName.length > 40) return false;
    
    // Must start with capital letter
    if (!cleanName.match(/^[A-Z]/)) return false;
    
    // Must contain at least 2 words OR be a proper brand name
    // (real businesses usually have 2+ words like "Joe's Barbershop" or "Main Street Cuts")
    const wordCount = cleanName.split(/\s+/).length;
    if (wordCount < 2) {
      // Single word might be okay if it's a proper brand (e.g., "Supercuts")
      // but most single words are generic
      return false;
    }
    
    // Block if contains any blocklisted term
    for (const blocked of BLOCKLIST) {
      if (lower.includes(blocked)) return false;
    }
    
    // Block URLs and domains
    if (cleanName.match(/\.com|\.net|\.org|\.io/i)) return false;
    
    // Block names with brackets (article titles)
    if (cleanName.match(/\[|\]\{}/)) return false;
    
    // Block all-caps (not business names)
    if (cleanName === cleanName.toUpperCase()) return false;
    
    // Block all-lowercase
    if (cleanName === cleanName.toLowerCase()) return false;
    
    // Must have letters (not just numbers)
    if (!cleanName.match(/[a-zA-Z]{3,}/)) return false;
    
    // Block dates (like "Feb 25, 2026")
    if (cleanName.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i)) return false;
    
    // Block if starts with numbers (addresses, not business names)
    if (cleanName.match(/^\d/)) return false;
    
    // Block very generic patterns
    if (cleanName.match(/^(the|a|an)\s+(best|top|good)/i)) return false;
    
    return true;
  }
  
  // Helper to extract clean address
  function extractAddress(lines, startIdx) {
    for (let j = startIdx; j < Math.min(startIdx + 3, lines.length); j++) {
      const line = lines[j].trim();
      
      // Skip lines that are clearly not addresses
      if (line.length > 100) continue; // Too long
      if (line.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)) continue; // Dates
      if (line.match(/you might also|thank me later|check out/i)) continue; // Blog text
      if (line.match(/vibe|atmosphere|experience/i)) continue; // Descriptions
      
      // Address patterns: "123 Main St" or "123 Main Street, City, ST 12345"
      if (line.match(/^\d+\s+[A-Za-z]+\s+(St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive|Ln|Lane|Way|Pl|Place|Ct|Court|Apt|Suite)/i)) {
        // Clean up the address (remove trailing descriptions)
        let address = line.replace(/\s+(🗺️|☎️|🌐|🕒).*$/, '').trim();
        return address;
      }
    }
    return null;
  }
  
  // Helper to extract phone
  function extractPhone(lines, startIdx) {
    for (let j = startIdx; j < Math.min(startIdx + 4, lines.length); j++) {
      const line = lines[j];
      // Phone patterns: (215) 555-1234 or 215-555-1234
      const phoneMatch = line.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
      if (phoneMatch) {
        // Validate it's not a fake/short number
        const digits = phoneMatch[0].replace(/\D/g, '');
        if (digits.length === 10) return phoneMatch[0];
      }
    }
    return null;
  }
  
  // Parse lines
  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && l.length < 100); // Skip very long lines (articles)
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip if we've seen this name
    const nameKey = line.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenNames.has(nameKey)) continue;
    
    // Check if this looks like a business name
    if (isValidBusiness(line)) {
      // Look ahead for address/phone
      const address = extractAddress(lines, i + 1);
      const phone = extractPhone(lines, i + 1);
      
      // For free tier, be more lenient - just need name
      // For paid tiers, require address OR phone
      const minRequirements = (tier === 'free') ? true : (address || phone);
      
      if (minRequirements) {
        const lead = {
          name: line.trim(),
          address: address,
          phone: phone,
          google_maps: null,
          website: null,
          instagram: null,
          review_count: null,
          score: 3 // Base score for qualifying
        };
        
        seenNames.add(nameKey);
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
