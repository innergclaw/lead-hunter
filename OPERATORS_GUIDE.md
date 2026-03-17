# Lead Hunter — Operator's Guide

## Quick Start Commands

### Generate Hunt Instructions

```bash
cd ~/workspace/projects/lead-hunter-landing

# Free tier (5 leads, 15 min)
node hunt.js --tier=free --niche="lash-tech" --location="Philadelphia, PA"

# Starter tier (15 leads, 1 hr)
node hunt.js --tier=starter --niche="barbershop" --location="Miami, FL"

# Pro tier (50 leads, 3-4 hrs)
node hunt.js --tier=pro --niches="lash-tech,barbershop,nail-salon" --location="NYC"

# Company tier (150 leads, 8-12 hrs)
node hunt.js --tier=company --niches="all" --location="Los Angeles, CA" --radius=50
```

---

## File Structure

```
lead-hunter-landing/
├── index.html                    # Main landing page (pricing)
├── free.html                     # Free tier signup form
├── thank-you-starter.html        # Post-payment form ($29)
├── thank-you-pro.html            # Post-payment form ($99)
├── thank-you-company.html        # Post-payment form ($299)
├── hunt.js                       # CLI command generator
├── HUNTING_COMMANDS.md           # Full hunting guide
├── STRIPE_LINKS.md               # Payment link docs
├── FORMS_SETUP.md                # Form setup guide
├── UPDATED_LINKS.md              # Updated payment links
└── PAYMENT_SETUP.md              # Stripe setup guide
```

---

## Daily Workflow

### 1. Check for New Orders
```bash
# Check Stripe dashboard for new subscriptions
# Check Formspree for free tier signups
```

### 2. Generate Hunt Command
```bash
# For each new customer, run:
node hunt.js --tier=[tier] --niche="[niche]" --location="[location]"
```

### 3. Hunt Leads
- Open Tandem Browser
- Follow the generated instructions
- Collect data according to tier specifications

### 4. Deliver Leads
- Format as JSON/CSV
- Email to customer
- Include upgrade pitch (for free tier)

---

## Tier Specifications

| Tier | Leads | Time | What to Collect |
|------|-------|------|-----------------|
| **Free** | 5 | 15 min | Name, address, phone, maps, website, score |
| **Starter** | 15 | 1 hr | + Instagram handle, review count |
| **Pro** | 50 | 3-4 hrs | + Verified email, social audit, notes |
| **Company** | 150 | 8-12 hrs | + Owner name, all social, competitor analysis |

---

## Data Collection Template

Copy this structure for each lead:

```json
{
  "name": "Business Name",
  "address": "123 Main St, City, ST 12345",
  "phone": "(555) 123-4567",
  "google_maps": "https://maps.google.com/...",
  "website": null,
  "instagram": "@handle",
  "instagram_followers": 1200,
  "email": "owner@email.com",
  "score": 6,
  "notes": "Why this is a good lead"
}
```

---

## Automation TODO

- [ ] Stripe webhook → Auto-create hunt job
- [ ] Tandem Browser script → Auto-hunt based on preferences
- [ ] Formspree → Auto-acknowledge receipt
- [ ] Email template → Auto-deliver leads

For now: Manual process works fine for MVP.

---

## Revenue Tracking

Track monthly in a spreadsheet:

| Date | Customer | Tier | Amount | Leads Delivered | Status |
|------|----------|------|--------|-----------------|--------|
| 3/17 | John Smith | Pro | $99 | 50 | Active |

---

## Support Email Template

Subject: Your Lead Hunter [Tier] Subscription

```
Hi [Name],

Thanks for subscribing to Lead Hunter [Tier]!

Your first batch of leads is being hunted now. You'll receive them within 24-48 hours at this email address.

Your preferences:
- Niche: [niche]
- Location: [location]
- Leads per month: [number]

Questions? Just reply to this email.

Thanks,
Lead Hunter Team
```
