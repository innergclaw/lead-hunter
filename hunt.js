#!/usr/bin/env node
/**
 * Lead Hunter CLI
 * Usage: node hunt.js --tier=[free|starter|pro|company] --niche="..." --location="..."
 */

const args = process.argv.slice(2);
const params = {};

// Parse arguments
args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.replace('--', '').split('=');
    params[key] = value ? value.replace(/"/g, '') : true;
  }
});

// Tier configurations
const tiers = {
  free: {
    name: 'Free',
    leads: 5,
    price: '$0',
    fields: ['name', 'address', 'phone', 'google_maps', 'website', 'score'],
    depth: 'surface',
    time: '15-20 min',
    searchUrl: (niche, location) => 
      `https://duckduckgo.com/?q=${encodeURIComponent(niche)}+${encodeURIComponent(location)}+business`,
    instructions: `
🆓 FREE TIER HUNT (5 leads)
===========================
1. Open: ${params.niche && params.location ? `https://duckduckgo.com/?q=${encodeURIComponent(params.niche)}+${encodeURIComponent(params.location)}+business` : '[Search URL will be generated]'}
2. Collect ONLY:
   - Business name
   - Address
   - Phone number
   - Google Maps link
   - Website (if immediately visible)
   - Score (0-7)
3. Stop at 5 leads
4. Time estimate: 15-20 minutes

⚡ QUICK TIPS:
- Don't dig deep - surface info only
- If website check takes >30 sec, skip it
- Score based on: no website (+2), low reviews (+1), needs booking (+1)
`
  },
  
  starter: {
    name: 'Starter',
    leads: 15,
    price: '$29/mo',
    fields: ['name', 'address', 'phone', 'google_maps', 'website', 'instagram', 'score', 'review_count'],
    depth: 'shallow',
    time: '45-60 min',
    instructions: `
💼 STARTER TIER HUNT (15 leads)
================================
1. Search: ${params.niche && params.location ? `${params.niche} in ${params.location}` : '[niche] in [location]'}
2. Collect:
   - Business name, address, phone
   - Google Maps link
   - Website status (has one?)
   - Instagram (if easily found)
   - Approximate review count
   - Score (0-7)
3. Check 2 pages of results
4. Stop at 15 leads
5. Time estimate: 45-60 minutes

🔍 EXTRA STEPS:
- Quick IG search: "[business name] instagram"
- If IG not found in 1 min, skip
- Note website: "none", "basic", "full"
`
  },
  
  pro: {
    name: 'Pro',
    leads: 50,
    price: '$99/mo',
    fields: ['name', 'address', 'phone', 'google_maps', 'website_status', 'instagram', 'instagram_followers', 'email', 'social_active', 'booking_system', 'score', 'notes'],
    depth: 'medium',
    time: '3-4 hours',
    instructions: `
⭐ PRO TIER HUNT (50 leads)
============================
1. Search multiple niches: ${params.niches || '[niche1, niche2, niche3]'}
2. Collect ALL fields:
   - Business name, address, phone
   - Google Maps link
   - Website status
   - Instagram + follower count
   - Try to find email (hunter.io, contact page)
   - Check if socially active
   - Booking system used
   - Score (0-7)
   - Notes on why good lead
3. Check 3-4 pages per niche
4. Stop at 50 leads total
5. Time estimate: 3-4 hours

🎯 PRO TIPS:
- Use Tandem Browser for all searches
- Screenshot IG profiles with follower counts
- Try email finder tools for high-value leads
- Write 1-sentence note on each lead
`
  },
  
  company: {
    name: 'Company',
    leads: 150,
    price: '$299/mo',
    fields: ['name', 'owner_name', 'address', 'phone', 'email', 'business_age', 'google_maps', 'website_status', 'instagram', 'facebook', 'tiktok', 'social_audit', 'competitor_check', 'booking_system', 'score', 'outreach_angle', 'notes'],
    depth: 'deep',
    time: '8-12 hours',
    instructions: `
🏢 COMPANY TIER HUNT (150 leads)
==================================
1. Full market research: ${params.location || '[location]'} (${params.radius || '25'} mile radius)
2. Collect EVERYTHING:
   - Business + owner name
   - Full contact (verified email + phone)
   - Business age
   - All social platforms
   - Deep social audit
   - Competitor analysis
   - Custom outreach angle
   - Detailed notes
3. Comprehensive search
4. Stop at 150 leads
5. Time estimate: 8-12 hours

🏆 COMPANY STANDARDS:
- Verify every email (use tools)
- Find owner name via IG/LinkedIn
- Check posting frequency on social
- Identify 2-3 competitors per area
- Write custom outreach suggestion
- Document everything
`
  }
};

// Show help if no tier specified
if (!params.tier || !tiers[params.tier]) {
  console.log(`
🎯 Lead Hunter CLI

Usage:
  node hunt.js --tier=[free|starter|pro|company] --niche="..." --location="..."

Examples:
  node hunt.js --tier=free --niche="lash-tech" --location="Philadelphia, PA"
  node hunt.js --tier=starter --niche="barbershop" --location="Miami, FL"
  node hunt.js --tier=pro --niches="lash-tech,barbershop,nail-salon" --location="NYC"
  node hunt.js --tier=company --niches="all" --location="Los Angeles, CA" --radius=50

Tiers:
  free     - 5 leads, basic info (15 min)
  starter  - 15 leads, +IG handles (1 hr)
  pro      - 50 leads, verified emails (3-4 hrs)
  company  - 150 leads, full research (8-12 hrs)
`);
  process.exit(0);
}

const tier = tiers[params.tier];

// Output hunt instructions
console.log(tier.instructions);

// Output summary
console.log(`
📊 HUNT SUMMARY
===============
Tier: ${tier.name} (${tier.price})
Leads needed: ${tier.leads}
Depth: ${tier.depth}
Time estimate: ${tier.time}
Fields to collect: ${tier.fields.length}

🚀 Ready to hunt? Open Tandem Browser and start searching!
`);

// Output data collection template
console.log(`
📋 DATA COLLECTION TEMPLATE
============================
Copy this for each lead:

${tier.fields.map(f => `- ${f}: `).join('\n')}

Save to: leads-${params.tier}-${new Date().toISOString().split('T')[0]}.json
`);
