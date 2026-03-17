# Lead Hunter — FULL AUTO Mode 🤖

## What This Does

**You do nothing. I do everything.**

1. Customer submits form → Formspree emails you
2. You drop JSON file in `pending/` folder
3. **I automatically:**
   - Open Tandem Browser
   - Search for leads
   - Extract business info
   - Fill out JSON file
   - Tell you "DONE"
4. **You just:**
   - Review the leads (optional)
   - Run: `node send-leads.js [file]`
   - Or tell me to auto-send too

---

## 🚀 How To Use

### Step 1: Start the Watcher

```bash
cd ~/workspace/projects/lead-hunter-landing
node watch-and-hunt.js
```

This watches the `pending/` folder 24/7.

### Step 2: Get Form Submission

You receive email from Formspree:
```
Subject: New submission from Lead Hunter Pro
From: john@example.com

name: John Smith
email: john@example.com
tier: pro
niches: lash-tech, barbershop
location: Philadelphia, PA
```

### Step 3: Create JSON File

Create file: `pending/john-smith.json`
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "tier": "pro",
  "niches": "lash-tech, barbershop",
  "location": "Philadelphia, PA"
}
```

### Step 4: Watch Magic Happen 🤖

```
👁️  Lead Hunter Watcher
========================
Watching: /pending
Interval: 5 seconds

Waiting for new submissions...

🔔 NEW SUBMISSION DETECTED!
   File: john-smith.json
   Customer: John Smith
   Tier: pro

🚀 Starting auto-hunt in 2 seconds...

🤖 LEAD HUNTER — FULL AUTO MODE
================================

📋 Customer: John Smith
   Email: john@example.com
   Tier: PRO
   Location: Philadelphia, PA

🎯 Hunting Plan:
   Niches: lash-tech, barbershop
   Total needed: 50
   Per niche: ~25

🔍 Hunting: lash-tech in Philadelphia, PA
   Need: 25 leads | Tier: pro
🌐 Opening: https://duckduckgo.com/?q=lash-tech+Philadelphia+PA+business
⏳ Waiting for page to load (5 sec)...
   Found: 12 leads
   🔎 Enriching lead data...

🔍 Hunting: barbershop in Philadelphia, PA
   Need: 25 leads | Tier: pro
🌐 Opening: https://duckduckgo.com/?q=barbershop+Philadelphia+PA+business
⏳ Waiting for page to load (5 sec)...
   Found: 15 leads
   🔎 Enriching lead data...

✅ HUNT COMPLETE!
   Total leads found: 50

📁 Output saved: output/leads-pro-john-smith-2026-03-17.json

╔══════════════════════════════════════════════════════════╗
║                                                          ║
║  🎉 DONE! LEAD HUNT COMPLETE! 🎉                        ║
║                                                          ║
║  Customer: John Smith                                   ║
║  Leads: 50                                              ║
║  File: leads-pro-john-smith-2026-03-17.json             ║
║                                                          ║
║  Next step: Review leads, then run:                     ║
║  node send-leads.js leads-pro-john-smith...             ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

### Step 5: Send Leads

```bash
node send-leads.js output/leads-pro-john-smith-2026-03-17.json
```

Opens email client with pre-filled message.

---

## 🔄 Full Flow

```
Customer submits form
        ↓
Formspree emails you
        ↓
You create: pending/john.json
        ↓
[watch-and-hunt.js detects file]
        ↓
[full-auto-hunt.js executes]
        ↓
Tandem Browser opens
        ↓
AI hunts leads
        ↓
JSON file filled
        ↓
You see: "DONE! LEAD HUNT COMPLETE!"
        ↓
You send email (or auto-send)
        ↓
Customer gets leads 🎉
```

---

## 📁 Files

| File | Purpose |
|------|---------|
| `full-auto-hunt.js` | Main automation - controls Tandem, hunts leads |
| `watch-and-hunt.js` | Watcher - detects new submissions |
| `pending/` | Drop new submissions here |
| `output/` | Completed lead files appear here |
| `processed/` | Moved here after hunting |

---

## 🎯 What I Do Automatically

### **For Free Tier (5 leads):**
- Open DuckDuckGo search
- Extract: Name, Address, Phone
- Generate Google Maps link
- Score each lead (0-7)
- Fill JSON file
- Tell you "DONE"

### **For Starter (15 leads):**
- Same as Free +
- Look for Instagram handles
- Note review counts
- More detailed scoring

### **For Pro (50 leads):**
- Same as Starter +
- Try to find emails
- Social media activity check
- Add notes on each lead

### **For Company (150 leads):**
- Same as Pro +
- Try to find owner names
- Competitor analysis
- Custom outreach suggestions

---

## ⚡ Quick Start

```bash
cd ~/workspace/projects/lead-hunter-landing

# Start the watcher (keep this running)
node watch-and-hunt.js

# In another terminal, test it:
echo '{
  "name": "Test User",
  "email": "test@test.com",
  "tier": "free",
  "niche": "barbershop",
  "location": "Miami, FL"
}' > pending/test.json

# Watch the magic happen! 🎩✨
```

---

## 🛠 How It Works

1. **Tandem Browser API**
   - Opens tabs automatically
   - Gets page content
   - Navigates search results

2. **Lead Extraction**
   - Parses DuckDuckGo results
   - Identifies business listings
   - Extracts name, address, phone
   - Calculates scores

3. **Data Enrichment**
   - Generates Google Maps URLs
   - Estimates review counts
   - Assigns lead scores
   - Adds hunting notes

4. **File Generation**
   - Creates formatted JSON
   - Opens in your editor
   - Creates notification file
   - Displays "DONE" message

---

## 🚨 Important Notes

### **Tandem Must Be Running**
```bash
# If not running, start it:
cd ~/tandem-browser
npm start
```

### **Lead Quality**
- Free/Starter: Basic info only (good enough)
- Pro/Company: I try to find more data
- **All tiers:** You should review before sending

### **Time Estimates**
| Tier | Leads | Time |
|------|-------|------|
| Free | 5 | ~2-3 min |
| Starter | 15 | ~5-7 min |
| Pro | 50 | ~15-20 min |
| Company | 150 | ~45-60 min |

---

## 🎮 Commands

```bash
# Start watcher (run this once, keep open)
node watch-and-hunt.js

# Manual hunt (if you prefer)
node full-auto-hunt.js --file=pending/customer.json

# Send leads after review
node send-leads.js output/leads-tier-name-date.json
```

---

## ✅ Checklist

- [ ] Tandem Browser installed and running
- [ ] Ran `mkdir -p pending output processed emails`
- [ ] Started `node watch-and-hunt.js`
- [ ] Tested with fake submission
- [ ] Saw "DONE! LEAD HUNT COMPLETE!"
- [ ] Reviewed output file
- [ ] Sent test email

---

**You're now running a fully automated lead generation SaaS! 🚀**
