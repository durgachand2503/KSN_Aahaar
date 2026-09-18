# KSN Aahaar — Deployment Guide

## Overview

| Service | Platform | URL (initial) |
|---------|----------|---------------|
| Frontend (Next.js) | Vercel | `https://your-app.vercel.app` |
| Backend (Express) | Render | `https://your-backend.onrender.com` |
| Database (MongoDB) | MongoDB Atlas | (connection string only) |
| Payments | Razorpay | Test Mode → Live Mode |

---

## Step 1: MongoDB Atlas Setup

1. Create a free account at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create a new Project → Create a Cluster (M0 Free Tier is fine for testing)
3. Database Access → Add a database user → choose a strong username/password
4. Network Access → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`) for Render
5. Clusters → Connect → Drivers → copy the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/ksn-aahaar?retryWrites=true&w=majority
   ```

---

## Step 2: Render (Backend) Setup

1. Go to [render.com](https://render.com) → New Web Service → connect your GitHub repo
2. Set **Root Directory**: `backend`
3. Set **Build Command**: `npm install && npm run build`
4. Set **Start Command**: `npm start`
5. Add **Environment Variables** (Render Dashboard → Environment):

   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `MONGO_URI` | *(MongoDB Atlas connection string)* |
   | `JWT_SECRET` | *(64-byte hex — generate below)* |
   | `CORS_ORIGIN` | `https://your-app.vercel.app` *(update after Vercel deploy)* |
   | `FRONTEND_URL` | `https://your-app.vercel.app` *(same as above)* |
   | `RAZORPAY_KEY_ID` | *(from Razorpay Dashboard)* |
   | `RAZORPAY_KEY_SECRET` | *(from Razorpay Dashboard)* |
   | `RAZORPAY_WEBHOOK_SECRET` | *(from Razorpay Dashboard — after webhook setup)* |
   | `WHATSAPP_OWNER_PHONE` | `917993877507` *(no + sign)* |
   | `EMAIL_USER` | `your-gmail@gmail.com` |
   | `EMAIL_PASS` | *(Gmail App Password — 16 chars)* |
   | `EMAIL_TO` | `admin-email@gmail.com` |

   **Generate JWT_SECRET**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

6. After deploy, note your Render URL: `https://your-backend.onrender.com`

---

## Step 3: Vercel (Frontend) Setup

1. Go to [vercel.com](https://vercel.com) → New Project → import your repo
2. Set **Root Directory**: `frontend`
3. Framework: Next.js (auto-detected)
4. Add **Environment Variables** (Vercel Dashboard → Settings → Environment Variables):

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com/api` |
   | `NEXT_PUBLIC_API_HOST` | `your-backend.onrender.com` |
   | `NEXT_PUBLIC_RAZORPAY_KEY_ID` | *(Razorpay Key ID — NOT the secret)* |

5. Deploy. Note your Vercel URL: `https://your-app.vercel.app`

---

## Step 4: Update CORS After Both Are Deployed

Once you have both URLs, update Render environment variables:
- `CORS_ORIGIN` → `https://your-app.vercel.app`
- `FRONTEND_URL` → `https://your-app.vercel.app`

Then **redeploy** the backend on Render.

---

## Step 5: Create Admin Account

Run this **once** on your local machine pointed at the production Atlas database:

```bash
cd backend
# Set production env vars temporarily
MONGO_URI="mongodb+srv://..." ADMIN_EMAIL="admin@ksnaahaar.com" ADMIN_PASSWORD="YourSecurePassword123!" npm run seed
```

Or set them in a local `.env` file temporarily (never commit it).

---

## Step 6: Razorpay Webhook Setup

1. Razorpay Dashboard → Settings → Webhooks → Add New Webhook
2. Webhook URL: `https://your-backend.onrender.com/api/payments/webhook`
3. Events to enable: `payment.captured`, `payment.failed`
4. Copy the **Webhook Secret** → add to Render as `RAZORPAY_WEBHOOK_SECRET`
5. Redeploy backend

---

## Step 7: Domain Migration (ksnaahaar.com)

When ready to go live with the custom domain:

**Vercel**:
- Project Settings → Domains → Add `ksnaahaar.com` and `www.ksnaahaar.com`
- Follow Vercel's DNS instructions for your domain registrar

**Render**:
- Service Settings → Custom Domains → Add `api.ksnaahaar.com`
- Add CNAME record: `api` → your Render service hostname

**Update env vars after domain setup**:
- Render: `CORS_ORIGIN=https://ksnaahaar.com`, `FRONTEND_URL=https://ksnaahaar.com`
- Vercel: `NEXT_PUBLIC_API_URL=https://api.ksnaahaar.com/api`, `NEXT_PUBLIC_API_HOST=api.ksnaahaar.com`

---

## Test Mode → Live Mode (Razorpay)

When ready to accept real payments:
1. Complete Razorpay KYC in the dashboard
2. Switch to Live Mode → generate new Key ID and Key Secret
3. Update Render: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
4. Update Vercel: `NEXT_PUBLIC_RAZORPAY_KEY_ID`
5. Update webhook URL to live mode webhook if separate

---

## Security Checklist Before Go-Live

- [ ] `JWT_SECRET` is at least 64 random bytes (never a dictionary word)
- [ ] `RAZORPAY_KEY_SECRET` is never in frontend code or `NEXT_PUBLIC_` vars
- [ ] MongoDB Atlas Network Access uses IP allowlist (not `0.0.0.0/0`) if possible
- [ ] Gmail App Password used (not your Gmail login password)
- [ ] `NODE_ENV=production` set on Render
- [ ] `CORS_ORIGIN` set to exact frontend domain (no wildcard)
- [ ] Webhook secret is set and verified in Razorpay dashboard
- [ ] Admin password is strong (12+ chars, mixed case, numbers, symbols)
