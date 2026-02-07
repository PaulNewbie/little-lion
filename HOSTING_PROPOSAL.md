# Little Lions Monitoring System - Hosting Strategy Proposal

**Prepared for:** Client Review
**Date:** February 7, 2026
**System:** Little Lions SPED School Monitoring System

---

## 1. Overview

The Little Lions system is a web application built with modern technology. The key architectural detail relevant to hosting is:

- **The frontend** (what users see and interact with) is a static web application that needs to be hosted and served to browsers.
- **The backend** (database, user accounts, file storage) is handled entirely by **Firebase** (Google Cloud) and **Cloudinary** -- these are separate services that run independently of where the frontend is hosted.

**This means we only need hosting for static files** (HTML, CSS, JavaScript). We do NOT need a traditional web server, PHP support, databases on the hosting side, or server-side processing. This gives us access to very affordable (often free) hosting options.

---

## 2. Hosting Options Comparison

| Feature | **Cloudflare Pages** | **Netlify** (Current) | **Vercel** | **Firebase Hosting** | **Hostinger** |
|---|---|---|---|---|---|
| **Monthly Cost** | Free | Free | Free | Free | $2.99 - $9.99/mo |
| **Bandwidth** | Unlimited | 100 GB/mo | 100 GB/mo | 10 GB/mo | 100 GB/mo |
| **Build Minutes** | 500/mo | 300/mo | Limited | N/A (manual deploy) | N/A |
| **Global CDN** | Yes (300+ cities) | Yes | Yes | Yes | Limited |
| **Custom Domain** | Yes | Yes | Yes | Yes | Yes |
| **Free SSL (HTTPS)** | Yes | Yes | Yes | Yes | Yes |
| **Auto-Deploy from Git** | Yes | Yes | Yes | Yes | No (manual) |
| **Deploy Previews** | Yes | Yes | Yes | No | No |
| **Setup Difficulty** | Easy | Easy | Easy | Moderate | Moderate |
| **Suitable for our app** | **Best fit** | Good | Limited | Limited | Overkill |

---

## 3. Option-by-Option Analysis

### A. Cloudflare Pages (Recommended)

**Cost:** Free

**Advantages:**
- Unlimited bandwidth at no cost -- no surprise bills, no matter how many users access the system
- Fastest global network with 300+ data centers worldwide
- 500 build minutes per month (more than Netlify's 300)
- Built-in DDoS protection and security features
- Automatic deployments from GitHub
- No credit card required

**Disadvantages:**
- Slightly less intuitive dashboard compared to Netlify
- Smaller community/ecosystem than Netlify or Vercel

**Verdict:** Best overall value. Unlimited bandwidth on a free plan is unmatched. Performance is industry-leading. With 300+ edge locations (including strong Southeast Asia presence), pages load faster for our users compared to any other option.

---

### B. Netlify (Current Setup)

**Cost:** Free (current plan)

**Advantages:**
- Already set up and working -- no migration effort needed
- Very user-friendly dashboard and management interface
- Good documentation and large community
- 100 GB bandwidth per month (sufficient for a school system)
- Deploy previews for testing changes before going live

**Disadvantages:**
- 100 GB bandwidth limit -- if exceeded, all sites pause until next month
- Only 300 build minutes per month
- New credit-based pricing model (Sept 2025) adds billing complexity on paid plans
- Paid plan jumps to $19/user/month if free tier is ever outgrown

**Verdict:** Functional but outperformed. While it works, Netlify has fewer edge locations (~150 vs 300+), capped bandwidth, and fewer build minutes. Cloudflare offers measurably faster load times at the same cost (free).

---

### C. Vercel

**Cost:** Free (Hobby plan)

**Advantages:**
- Excellent performance and global CDN
- Great developer experience with instant deployments
- 100 GB bandwidth per month

**Disadvantages:**
- Free plan is restricted to personal/non-commercial use (Hobby tier)
- Commercial use requires the Pro plan at $20/user/month
- More limited build minutes on the free tier
- Serverless function timeout limited to 60 seconds on free plan

**Verdict:** Not ideal for this project. The free tier's non-commercial restriction makes it unsuitable for a client deployment without upgrading to the paid plan.

---

### D. Firebase Hosting

**Cost:** Free (Spark plan) / Pay-as-you-go (Blaze plan)

**Advantages:**
- Already part of our tech stack (we use Firebase for the backend)
- Keeps everything under one Google platform
- Global CDN included
- Simple deployment via Firebase CLI

**Disadvantages:**
- Only 10 GB bandwidth per month on the free plan (very limited)
- No automatic Git-based deployments (requires manual CLI deploy)
- No deploy previews
- If bandwidth is exceeded on the free plan, the site goes down
- Blaze plan charges $0.15/GB for bandwidth overages

**Verdict:** Too limited on bandwidth. While it simplifies the stack, 10 GB/month is risky for a production system, and it lacks the developer-friendly features of Netlify or Cloudflare.

---

### E. Hostinger

**Cost:** $2.99 - $9.99/month (requires 12-48 month commitment for promotional pricing)

**Advantages:**
- Traditional hosting with cPanel access
- Includes email hosting
- Phone and chat support

**Disadvantages:**
- Costs money when free alternatives exist that perform better
- Promotional prices require 48-month commitment; renewal rates are significantly higher
- Traditional shared hosting is slower than CDN-based platforms for static sites
- No automatic Git-based deployment (manual upload via FTP or file manager)
- Limited global CDN compared to Cloudflare/Netlify/Vercel
- Overkill -- provides PHP, databases, and server features we don't need
- More maintenance overhead (server management, updates)

**Verdict:** Not recommended. It costs more and performs worse than the free alternatives for our type of application. Traditional hosting is designed for server-side applications, which is not what we have.

---

## 4. Cost Summary

| Option | Year 1 Cost | Year 2 Cost | 3-Year Total |
|---|---|---|---|
| **Cloudflare Pages** | $0 | $0 | **$0** |
| **Netlify (Current)** | $0 | $0 | **$0** |
| **Vercel (Pro)** | $240 | $240 | **$720** |
| **Firebase Hosting** | $0* | $0* | **$0*** |
| **Hostinger (Premium)** | $36 - $120 | $108 - $120 | **$252 - $360** |

*\* Firebase free tier has only 10 GB bandwidth -- overage charges may apply.*

---

## 5. Recommendation

### Migrate to Cloudflare Pages

After thorough evaluation, **Cloudflare Pages is the clear best choice** for the Little Lions system. Here is why:

**Why Cloudflare Pages wins over Netlify (our current host):**

| Factor | Netlify (Current) | Cloudflare Pages (Recommended) |
|---|---|---|
| **Bandwidth** | 100 GB/mo (site pauses if exceeded) | **Unlimited** |
| **Edge locations** | ~150 | **300+** |
| **Build minutes** | 300/mo | **500/mo** |
| **Load speed** | Good | **Faster** (more servers closer to users) |
| **Compression** | Brotli supported | **Brotli by default** (smaller file transfers) |
| **DDoS protection** | Basic | **Enterprise-grade (free)** |
| **Cost** | Free | **Free** |

**Key advantages for our users:**

1. **Faster page loads** -- Cloudflare has 300+ data centers worldwide, including strong coverage in Southeast Asia. Our users (parents, teachers, therapists) will connect to a closer server, meaning the app opens faster on their phones and computers.

2. **No bandwidth limits** -- During busy periods like enrollment season, when many parents activate accounts simultaneously, there is zero risk of the site going down due to bandwidth limits.

3. **Better security** -- Enterprise-level DDoS protection is included for free, keeping the system safe and available.

4. **Easy migration** -- The move takes less than one hour and requires no changes to the application itself. The system will look and work exactly the same -- just faster.

### Why NOT Netlify?
While Netlify has served us well, it has limitations that Cloudflare does not:
- Bandwidth cap of 100 GB/month -- the site shuts down if exceeded
- Fewer global servers -- pages load slower for users farther from server locations
- New credit-based pricing (Sept 2025) makes costs harder to predict if we ever need to scale

### Why NOT Hostinger?
Hostinger is a traditional web host designed for a different type of application. Our system is a modern static web app with a cloud backend. Using Hostinger would mean:
- Paying $3-10/month for something we can get for free
- Slower performance (no global CDN by default)
- More manual work to deploy updates
- Paying for server features (PHP, MySQL) that we don't use

### Final Recommendation

> **Migrate to Cloudflare Pages.** It is free, faster, and more reliable than our current setup. The migration is simple (under 1 hour) and the system will continue to work exactly as it does today -- just with faster load times, unlimited bandwidth, and better security.
>
> **Hostinger is not recommended** for this type of application. The free modern platforms outperform it in every relevant metric while costing nothing.

---

## 6. Summary for Decision-Makers

| | Recommendation | Cost | Performance | Action |
|---|---|---|---|---|
| **Recommended** | **Cloudflare Pages** | **Free** | **Fastest** | ~1 hour migration |
| Current | Netlify | Free | Good | No change |
| Avoid | Hostinger | $3-10/mo | Slower | Not suitable |

The bottom line: **The fastest option is also the most affordable option -- it's free.** Cloudflare Pages delivers faster load times, unlimited bandwidth, and enterprise-grade security at zero cost. There is no reason to stay on a slower platform or to pay for traditional hosting when a superior free option exists.

---

*This proposal was prepared based on publicly available pricing as of February 2026. Pricing may change -- always verify current rates before making a final decision.*

**Sources:**
- [Netlify Pricing](https://www.netlify.com/pricing/)
- [Cloudflare Pages Limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Cloudflare Plans](https://www.cloudflare.com/plans/)
- [Vercel Pricing](https://vercel.com/pricing)
- [Firebase Hosting Pricing](https://firebase.google.com/pricing)
- [Hostinger Pricing](https://www.hostinger.com/pricing)
- [Hostinger Pricing Breakdown (CyberNews)](https://cybernews.com/best-web-hosting/hostinger-review/pricing/)
