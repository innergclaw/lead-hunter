# Lead Hunter — Automation Guide

## 🤖 What We've Built

### 1. **auto-hunt.js** — Automated Hunt System

**What it does:**
- Watches `pending/` folder for new submissions
- Opens Tandem Browser automatically
- Generates lead template file
- Ready for manual or auto-send

**Usage:**
```bash
# One-time run
node auto-hunt.js --mode=manual

# Watch mode (checks every 30 sec)
node auto-hunt.js --mode=manual --watch
```

### 2. **webhook-server.js** — Formspree Webhook Receiver

**What it does:**
- Receives POST requests from Formspree
- Saves submissions to `pending/` folder
- Can auto-trigger hunt

**Usage:**
```bash
# Start server
node webhook-server.js

# Expose with ngrok (for Formspree)
ngrok http 3000

# Add webhook URL to Formspree:
# https://YOUR-NGROK-ID.ngrok.io/webhook
```

### 3. **send-leads.js** — Email Sender

**What it does:**
- Opens email client with pre-filled message
- Or saves email as file
- Formats leads nicely

**Usage:**
```bash
# After filling in leads
node send-leads.js output/leads-starter-john-smith-2026-03-17.json
```

---

## 🔄 Recommended Workflow

### Option A: Manual (Simplest)

1. **Get Formspree email** with submission
2. **Create file:** `pending/john-smith.json`
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "tier": "starter",
  "niche": "barbershop",
  "location": "Philadelphia, PA"
}
```
3. **Run:** `node auto-hunt.js`
4. **Tandem opens** automatically with search URL
5. **Hunt leads** and fill in `output/leads-...json`
6. **Send:** `node send-leads.js output/leads-...json`

### Option B: Webhook (More Automated)

1. **Start webhook server:** `node webhook-server.js`
2. **Expose with ngrok:** `ngrok http 3000`
3. **Add webhook to Formspree:** `https://abc123.ngrok.io/webhook`
4. **When form submitted:** Auto-saved to `pending/`
5. **Run:** `node auto-hunt.js --watch` (auto-detects)
6. **Rest same as Option A**

---

## 📁 Folder Structure

```
lead-hunter-landing/
├── pending/              # New submissions (drop here)
├── output/               # Lead files after hunting
├── processed/            # Completed submissions
├── emails/               # Saved email drafts
├── auto-hunt.js         # Main automation
├── webhook-server.js    # Webhook receiver
├── send-leads.js        # Email sender
└── hunt-state.json      # Tracks processed
```

---

## ⚡ Quick Start

```bash
cd ~/workspace/projects/lead-hunter-landing

# Create folders
mkdir -p pending output processed emails

# Start watching for submissions
node auto-hunt.js --watch

# In another terminal, test:
echo '{
  "name": "Test User",
  "email": "test@example.com",
  "tier": "free",
  "niche": "lash-tech",
  "location": "Philadelphia, PA"
}' > pending/test.json

# Watch auto-hunt.js detect and open Tandem!
```

---

## 🎯 Full Automation Flow

```
User submits form (Formspree)
    ↓
Formspree sends webhook (or you get email)
    ↓
File created in pending/
    ↓
auto-hunt.js detects file
    ↓
Opens Tandem Browser with search URL
    ↓
Generates lead template file
    ↓
You hunt leads (manual)
    ↓
Fill in lead data to JSON
    ↓
Run send-leads.js
    ↓
Email sent to customer
    ↓
File moved to processed/
```

---

## 🔧 Advanced: Full Auto-Send

To fully automate (no manual hunting):

1. Build Tandem Browser scraper script
2. Replace manual hunting with API calls
3. Auto-fill lead data
4. Auto-trigger send-leads.js

**This requires:**
- Tandem API for page scraping
- OCR or DOM parsing
- Error handling for captchas

**Status:** Not built yet (manual hunting recommended for quality)

---

## 📝 Files to Commit

```bash
git add auto-hunt.js webhook-server.js send-leads.js
```

**Don't commit:**
- `pending/` (customer data)
- `output/` (lead data)
- `processed/` (completed)
- `hunt-state.json`

Add to `.gitignore`:
```
pending/
output/
processed/
emails/
hunt-state.json
```

---

## 💡 Pro Tips

1. **Keep Tandem running** — auto-hunt will use existing instance
2. **Use --watch mode** — don't miss submissions
3. **Save email templates** — in `emails/` for reference
4. **Track in spreadsheet** — revenue, customers, status

---

## 🚀 Next Level

Future automation ideas:
- [ ] Web dashboard for managing hunts
- [ ] Auto-scraper using Tandem API
- [ ] Stripe webhook for instant hunt trigger
- [ ] Customer portal to view leads
- [ ] Airtable/Notion integration

---

**You now have a semi-automated lead delivery system!**
