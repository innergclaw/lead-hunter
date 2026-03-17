# 🚀 Lead Hunter — Full System Overview

## ✅ What's Live

### **Website**
https://innergclaw.github.io/lead-hunter/

### **Forms** (Connected to your email)
- Free: https://formspree.io/f/xkoqpnjo
- Starter: https://formspree.io/f/xreyogpk
- Pro: https://formspree.io/f/mbdzpjgk
- Company: https://formspree.io/f/xnjgoqpb

### **Payments** (Stripe)
- Starter ($29): https://buy.stripe.com/28E3cxacnaKtdtA8hZao80i
- Pro ($99): https://buy.stripe.com/cNi5kF0BNcSBbls2XFao80j
- Company ($299): https://buy.stripe.com/6oU5kF70bdWFgFM7dVao80k

---

## 🤖 Automation System

### **How It Works**

```
Customer submits form
    ↓
You get email (Formspree)
    ↓
Drop JSON file in pending/
    ↓
Run: node auto-hunt.js
    ↓
Tandem Browser opens automatically
    ↓
Lead file generated (opens in editor)
    ↓
You hunt leads manually
    ↓
Run: node send-leads.js [file]
    ↓
Email sent to customer
```

### **Quick Start**

```bash
cd ~/workspace/projects/lead-hunter-landing

# 1. Create folders
mkdir -p pending output processed emails

# 2. Start watching
node auto-hunt.js --watch

# 3. Test with fake submission
echo '{
  "name": "John Smith",
  "email": "john@example.com",
  "tier": "starter",
  "niche": "barbershop",
  "location": "Philadelphia, PA"
}' > pending/test.json

# 4. Watch Tandem open automatically!
```

---

## 📋 Daily Workflow

### **Morning Routine**
1. Check email for new Formspree submissions
2. Create JSON file in `pending/` folder
3. Run: `node auto-hunt.js --watch`
4. Tandem opens → Hunt leads
5. Fill lead data in generated file
6. Run: `node send-leads.js output/[file]`

### **Time Per Customer**
| Tier | Time | Leads |
|------|------|-------|
| Free | 15 min | 5 |
| Starter | 1 hr | 15 |
| Pro | 3-4 hrs | 50 |
| Company | 8-12 hrs | 150 |

---

## 💰 Revenue Potential

| Customers | Monthly Revenue | Hours/Week |
|-----------|-----------------|------------|
| 10 (mixed) | ~$1,000 | 10-15 hrs |
| 50 (mixed) | ~$5,000 | 40-60 hrs |
| 100 (mostly Pro) | ~$10,000 | 80+ hrs |

**At 50 customers:** You may need to hire hunters or build full automation.

---

## 🎯 Next Steps

### **Immediate (This Week)**
- [ ] Test full flow with fake submission
- [ ] Get first real customer
- [ ] Document any issues

### **Short Term (This Month)**
- [ ] Build Tandem API scraper (for auto-hunting)
- [ ] Create customer dashboard
- [ ] Add more niches

### **Long Term**
- [ ] Hire lead hunters
- [ ] White-label for agencies
- [ ] Expand to more cities

---

## 📁 GitHub Repo

**https://github.com/innergclaw/lead-hunter**

**Files:**
- `index.html` — Landing page
- `free.html` — Free tier form
- `thank-you-*.html` — Paid tier forms
- `hunt.js` — Command generator
- `auto-hunt.js` — Automation engine
- `send-leads.js` — Email sender
- `webhook-server.js` — Webhook receiver

---

## 🆘 Support

**If something breaks:**
1. Check Tandem is running: `lsof -i :8765`
2. Check form endpoints in HTML files
3. Check Stripe payment links work
4. Review `AUTOMATION_GUIDE.md`

**For help:**
- Read `AUTOMATION_GUIDE.md`
- Read `OPERATORS_GUIDE.md`
- Read `HUNTING_COMMANDS.md`

---

## 🎉 You're Ready!

You now have:
- ✅ Live website
- ✅ Payment processing
- ✅ Form handling
- ✅ Semi-automated delivery
- ✅ Full documentation

**Go get your first customer! 🚀**

---

*Built with OpenClaw + Tandem Browser*  
*Part of InnerG Intel*
