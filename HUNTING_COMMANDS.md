# Lead Hunter — Command Reference by Tier

## Quick Command Generator

Run this to generate hunt commands based on tier:

```bash
# Example usage:
node hunt.js --tier=free --niche="lash-tech" --location="Philadelphia, PA"
node hunt.js --tier=starter --niche="barbershop" --location="Miami, FL"
node hunt.js --tier=pro --niches="lash-tech,barbershop" --location="NYC"
node hunt.js --tier=company --niches="all" --location="Los Angeles, CA" --radius=50
```

---

## 🆓 FREE TIER ($0 — 5 leads)

### What to Collect (Lightweight)
- ✅ Business name
- ✅ Address
- ✅ Phone number
- ✅ Google Maps link
- ✅ Website (if listed)
- ✅ Score (0-7)

### Command
```bash
# Using Tandem Browser + DuckDuckGo
curl -s -X POST http://127.0.0.1:8765/tabs/open \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://duckduckgo.com/?q=[NICHE]+[LOCATION]+-site:yelp.com+-site:yellowpages.com","focus":true}'

# Then extract basic info from search results
# No deep scraping - just what's visible on first page
```

### Hunt Script (free-hunt.js)
```javascript
// Free tier - Basic info only
const freeHunt = {
  tier: 'free',
  leads: 5,
  fields: ['name', 'address', 'phone', 'google_maps', 'website', 'score'],
  depth: 'surface', // First page only
  verify: false,    // No email/IG verification
  timeEstimate: '15-20 min'
};

// Output format:
{
  "name": "Wrights Barber Shop",
  "address": "1901 72nd Ave, Philadelphia, PA 19138",
  "phone": "(215) 548-6026",
  "google_maps": "https://maps.google.com/...",
  "website": null,  // or URL if found
  "score": 4
}
```

### Manual Process (for now)
1. Open Tandem Browser
2. Search: `"[niche] [location]"`
3. Copy first 5 results
4. Score each (0-7)
5. Format and email

---

## 💼 STARTER TIER ($29/mo — 15 leads)

### What to Collect
- ✅ Business name
- ✅ Address  
- ✅ Phone number
- ✅ Google Maps link
- ✅ Website status (has one?)
- ✅ Instagram handle (if found)
- ✅ Score (0-7)
- ✅ Review count (approximate)

### Command
```bash
node hunt.js --tier=starter --niche="barbershop" --location="Philadelphia, PA"
```

### Hunt Script (starter-hunt.js)
```javascript
const starterHunt = {
  tier: 'starter',
  leads: 15,
  fields: [
    'name', 'address', 'phone', 
    'google_maps', 'website', 
    'instagram', 'score', 'review_count'
  ],
  depth: 'shallow', // 2 pages of results
  verify: 'basic',  // Check if website exists, find IG if easy
  timeEstimate: '45-60 min'
};

// Output format:
{
  "name": "Wrights Barber Shop",
  "address": "1901 72nd Ave, Philadelphia, PA 19138",
  "phone": "(215) 548-6026",
  "google_maps": "https://maps.google.com/...",
  "website": null,
  "instagram": "@wrightsbarber",  // if found
  "review_count": 42,
  "score": 4
}
```

---

## ⭐ PRO TIER ($99/mo — 50 leads)

### What to Collect
- ✅ Everything in Starter +
- ✅ Verified email address (if possible)
- ✅ Instagram handle + follower count
- ✅ Social media audit (active? posting?)
- ✅ Business age estimate
- ✅ Booking system check
- ✅ Notes (why it's a good lead)

### Command
```bash
node hunt.js --tier=pro \
  --niches="lash-tech,barbershop,nail-salon" \
  --location="Philadelphia, PA" \
  --secondary="Camden, NJ"
```

### Hunt Script (pro-hunt.js)
```javascript
const proHunt = {
  tier: 'pro',
  leads: 50,
  fields: [
    'name', 'address', 'phone',
    'google_maps', 'website_status',
    'instagram', 'instagram_followers',
    'social_active', 'booking_system',
    'email', 'score', 'notes'
  ],
  depth: 'medium',      // 3-4 pages, some social checks
  verify: 'enhanced',   // Try to find emails, verify IG
  timeEstimate: '3-4 hours'
};

// Output format:
{
  "name": "Wrights Barber Shop",
  "address": "1901 72nd Ave, Philadelphia, PA 19138",
  "phone": "(215) 548-6026",
  "google_maps": "https://maps.google.com/...",
  "website_status": "none",
  "instagram": "@wrightsbarbershop",
  "instagram_followers": 1200,
  "social_active": true,
  "booking_system": "phone_only",
  "email": null,  // if can't find
  "score": 6,
  "notes": "Active IG, 4.3★ on Google, no website - strong lead for web design"
}
```

---

## 🏢 COMPANY TIER ($299/mo — 150 leads)

### What to Collect
- ✅ Everything in Pro +
- ✅ Verified email AND phone
- ✅ Multiple social platforms
- ✅ Full social media audit
- ✅ Owner name (if available)
- ✅ Business age
- ✅ Competitor analysis
- ✅ Custom outreach script suggestion

### Command
```bash
node hunt.js --tier=company \
  --niches="all" \
  --location="Philadelphia, PA" \
  --radius=50 \
  --custom="Only businesses under 2 years old"
```

### Hunt Script (company-hunt.js)
```javascript
const companyHunt = {
  tier: 'company',
  leads: 150,
  fields: [
    'name', 'address', 'phone', 'email',
    'owner_name', 'business_age',
    'google_maps', 'website_status',
    'instagram', 'facebook', 'tiktok',
    'social_audit', 'competitor_check',
    'booking_system', 'score',
    'outreach_angle', 'notes'
  ],
  depth: 'deep',        // Comprehensive search
  verify: 'full',       // Verify all contact info, deep social
  timeEstimate: '8-12 hours'
};

// Output format:
{
  "name": "Wrights Barber Shop",
  "owner_name": "Mike Wright",
  "address": "1901 72nd Ave, Philadelphia, PA 19138",
  "phone": "(215) 548-6026",
  "email": "wrightsbarber@gmail.com",  // verified
  "business_age": "3 years",
  "google_maps": "https://maps.google.com/...",
  "website_status": "none",
  "instagram": "@wrightsbarbershop",
  "facebook": "facebook.com/wrightsbarber",
  "instagram_followers": 1200,
  "social_audit": {
    "posting_frequency": "2-3x/week",
    "engagement": "medium",
    "booking_link": false
  },
  "competitor_check": "2 other barbers within 1 mile",
  "booking_system": "phone/text only",
  "score": 6,
  "outreach_angle": "Website + online booking to compete with [Competitor Name]",
  "notes": "Owner active on IG, posts cuts regularly. No online presence beyond social. High intent lead."
}
```

---

## 🎯 Quick Reference: What Each Tier Gets

| Field | Free | Starter | Pro | Company |
|-------|------|---------|-----|---------|
| Business Name | ✅ | ✅ | ✅ | ✅ |
| Address | ✅ | ✅ | ✅ | ✅ |
| Phone | ✅ | ✅ | ✅ | ✅ |
| Google Maps | ✅ | ✅ | ✅ | ✅ |
| Website Status | ✅ | ✅ | ✅ | ✅ |
| Instagram | ❌ | ✅ | ✅ + followers | ✅ + full audit |
| Email | ❌ | ❌ | ✅ (try) | ✅ (verified) |
| Review Count | ❌ | ✅ (approx) | ✅ | ✅ |
| Owner Name | ❌ | ❌ | ❌ | ✅ |
| Business Age | ❌ | ❌ | ✅ (est) | ✅ |
| Social Audit | ❌ | ❌ | ✅ | ✅ deep |
| Competitor Info | ❌ | ❌ | ❌ | ✅ |
| Outreach Script | ❌ | ❌ | ❌ | ✅ |
| **Leads/Month** | **5** | **15** | **50** | **150** |
| **Time to Hunt** | **15 min** | **1 hr** | **3-4 hrs** | **8-12 hrs** |

---

## 🛠 Command Builder (For Manual Use)

Until scripts are built, use this template:

```bash
# FREE TIER HUNT
# 1. Open Tandem
# 2. Search: [niche] + [location]
# 3. Collect: Name, Address, Phone, Maps link
# 4. Score: 0-7
# 5. Stop at 5 leads

# STARTER TIER HUNT  
# 1. Open Tandem
# 2. Search: [niche] + [location]
# 3. Collect: Name, Address, Phone, Maps, IG (if easy)
# 4. Score: 0-7
# 5. Stop at 15 leads

# PRO TIER HUNT
# 1. Open Tandem
# 2. Search multiple niches
# 3. Collect: All fields, verify emails
# 4. Social media audit
# 5. Score: 0-7
# 6. Stop at 50 leads

# COMPANY TIER HUNT
# 1. Full market research
# 2. All niches, all platforms
# 3. Deep verification
# 4. Competitor analysis
# 5. Custom scripts
# 6. Stop at 150 leads
```

---

## 📝 Delivery Templates

See `DELIVERY_TEMPLATES.md` for email formats for each tier.
