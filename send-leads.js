#!/usr/bin/env node
/**
 * Send Leads to Customer
 * Usage: node send-leads.js leads-starter-john-smith-2026-03-17.json
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const leadsFile = process.argv[2];

if (!leadsFile) {
  console.log('Usage: node send-leads.js <leads-file.json>');
  console.log('\nExample:');
  console.log('  node send-leads.js output/leads-starter-john-smith-2026-03-17.json');
  process.exit(1);
}

const fullPath = path.resolve(leadsFile);

if (!fs.existsSync(fullPath)) {
  console.error(`❌ File not found: ${fullPath}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
const { customer, leads } = data;

// Generate email content
function generateEmail() {
  const tier = customer.tier;
  const leadCount = leads.length;
  
  let subject = '';
  let body = '';
  
  if (tier === 'free') {
    subject = 'Your 5 Free Leads from Lead Hunter';
    body = `Hi ${customer.name.split(' ')[0]},

Here are your 5 free leads for ${customer.niche} in ${customer.location}:

${leads.map((lead, i) => `
${i + 1}. ${lead.name}
   Address: ${lead.address}
   Phone: ${lead.phone}
   Google Maps: ${lead.google_maps}
   ${lead.website ? `Website: ${lead.website}` : 'Website: None'}
   Score: ${lead.score}/7
`).join('\n')}

---

Want 50 leads per month with verified emails?

Upgrade to Pro for $99/month:
https://innergclaw.github.io/lead-hunter/#pricing

Questions? Just reply to this email.

Lead Hunter Team
https://innergclaw.github.io/lead-hunter/
`;
  } else {
    subject = `Your ${leadCount} Leads — Lead Hunter ${tier.charAt(0).toUpperCase() + tier.slice(1)}`;
    body = `Hi ${customer.name.split(' ')[0]},

Your ${leadCount} leads for this month are ready!

Niche: ${customer.niche}
Location: ${customer.location}

${leads.map((lead, i) => `
${i + 1}. ${lead.name}
   ${lead.owner_name ? `Owner: ${lead.owner_name}` : ''}
   Address: ${lead.address}
   Phone: ${lead.phone}
   ${lead.email ? `Email: ${lead.email}` : ''}
   ${lead.instagram ? `Instagram: ${lead.instagram}` : ''}
   Google Maps: ${lead.google_maps}
   Website: ${lead.website || 'None'}
   Score: ${lead.score}/7
   ${lead.notes ? `Notes: ${lead.notes}` : ''}
`).join('\n')}

Happy hunting!

Lead Hunter Team
https://innergclaw.github.io/lead-hunter/
`;
  }
  
  return { subject, body };
}

// Open default email client with pre-filled message
function openEmailClient() {
  const { subject, body } = generateEmail();
  
  // Create mailto URL
  const mailto = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  console.log('\n📧 Opening email client...');
  console.log(`   To: ${customer.email}`);
  console.log(`   Subject: ${subject}`);
  
  exec(`open "${mailto}"`, (error) => {
    if (error) {
      console.error('❌ Could not open email client:', error);
      console.log('\n📋 Copy/paste this instead:\n');
      console.log('To:', customer.email);
      console.log('Subject:', subject);
      console.log('\nBody:\n', body);
    } else {
      console.log('✅ Email client opened!');
      console.log('\n💡 Tip: You can also copy the leads below:\n');
      console.log(JSON.stringify(leads, null, 2));
    }
  });
}

// Save email as file
function saveEmailFile() {
  const { subject, body } = generateEmail();
  const filename = `email-${customer.name.replace(/\s+/g, '-')}-${Date.now()}.txt`;
  const filepath = path.join(__dirname, 'emails', filename);
  
  if (!fs.existsSync(path.join(__dirname, 'emails'))) {
    fs.mkdirSync(path.join(__dirname, 'emails'));
  }
  
  const content = `To: ${customer.email}
Subject: ${subject}

${body}`;
  
  fs.writeFileSync(filepath, content);
  console.log(`📄 Email saved: ${filepath}`);
  exec(`open "${filepath}"`);
}

console.log('📧 Lead Hunter — Send Leads');
console.log('─────────────────────────────');
console.log(`Customer: ${customer.name}`);
console.log(`Email: ${customer.email}`);
console.log(`Tier: ${customer.tier}`);
console.log(`Leads: ${leads.length}`);
console.log('');

if (leads.length === 0) {
  console.log('⚠️  No leads in file yet!');
  console.log('   Hunt leads first, then add them to the JSON file.');
  process.exit(1);
}

// Ask user what to do
console.log('Options:');
console.log('1. Open email client (mailto)');
console.log('2. Save email as file');
console.log('3. Copy to clipboard (manual)');

// For now, auto-open email client
openEmailClient();
