# Deployment Guide — CareerDraft AI

Full-stack deployment across three platforms:
- **Frontend** → [Vercel](https://vercel.com)
- **Backend** → [Render](https://render.com)
- **Database** → [Supabase](https://supabase.com) (PostgreSQL)

> The Python ATS microservice is **optional** — the Java backend has a full fallback scorer. See [Python ATS Service](#4-python-ats-service-optional) if you want semantic similarity scoring too.

---

## Architecture Overview

```
Browser
  │
  ▼
Vercel (React/Vite)
  │  VITE_API_URL=""  →  relative /api/* calls
  │  vercel.json rewrites /api/* → Render backend
  ▼
Render (Spring Boot :8080)
  │  DB_URL / DB_USERNAME / DB_PASSWORD
  ▼
Supabase (PostgreSQL)
```

Because `vercel.json` rewrites `/api/*` to the Render backend, the frontend and backend appear on the **same origin** to the browser. This means:
- No CORS preflight for API calls
- `SameSite=None; Secure` cookies work correctly
- No `VITE_API_URL` needs to be set in Vercel

---

## 1. Supabase — Database Setup

1. Go to [supabase.com](https://supabase.com) → New project.
2. Once provisioned, go to **Project Settings → Database → Connection string**.
3. Select **Transaction pooler** (port `5432`) — required for Render's ephemeral instances.
4. Copy the JDBC-style URL — it looks like:
   ```
   jdbc:postgresql://aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require
   ```
5. Note your **DB Username** (format: `postgres.<project-ref>`) and **DB Password**.

> `spring.jpa.hibernate.ddl-auto=update` is set, so Hibernate will create/migrate all tables automatically on first boot. No manual SQL setup needed.

---

## 2. Render — Backend Deployment

### Option A — Using render.yaml (recommended)

The `render.yaml` at the repo root pre-configures everything.

1. Push your code to GitHub.
2. In Render: **New → Blueprint** → connect your repo → Render will detect `render.yaml`.
3. Fill in the secret values that are marked `sync: false` (see table below).
4. Deploy.

### Option B — Manual Web Service

1. **New → Web Service** → connect your repo.
2. **Runtime:** Docker
3. **Dockerfile path:** `./resume-ai-backend/Dockerfile`
4. **Docker context:** `./resume-ai-backend`
5. **Health check path:** `/actuator/health`

### Required Environment Variables on Render

Set these under **Environment → Environment Variables**:

| Variable | Value / Notes |
|---|---|
| `DB_URL` | Supabase Transaction Pooler JDBC URL (with `?sslmode=require`) |
| `DB_USERNAME` | Supabase DB username (`postgres.<ref>`) |
| `DB_PASSWORD` | Supabase DB password |
| `AI_MODE` | `groq` |
| `GROQ_API_KEY` | From [console.groq.com/keys](https://console.groq.com/keys) |
| `GROQ_MODEL` | `llama-3.1-8b-instant` |
| `JWT_SECRET` | Random string ≥ 32 chars — use Render's "Generate" button |
| `COOKIE_SECURE` | `true` (Render serves HTTPS) |
| `COOKIE_DOMAIN` | *(leave blank)* — correct for cross-origin Vercel ↔ Render |
| `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` (your actual Vercel URL) |
| `FRONTEND_URL` | `https://your-app.vercel.app` (used in password-reset email links) |
| `RAZORPAY_KEY_ID` | From [Razorpay dashboard](https://dashboard.razorpay.com/app/keys) |
| `RAZORPAY_KEY_SECRET` | From Razorpay dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | From Razorpay dashboard → Webhooks |
| `RESEND_API_KEY` | From [resend.com/api-keys](https://resend.com/api-keys) |
| `RESEND_FROM_EMAIL` | A verified sender address in Resend |
| `ATS_PYTHON_URL` | *(leave blank)* — enables Java fallback scorer |

> **Do NOT set `PORT`** — Render injects it automatically and Spring Boot reads `${PORT:8080}`.

### Verify the backend is live

After deploy, visit:
```
https://your-backend.onrender.com/actuator/health
```
Expected response:
```json
{"status":"UP"}
```

---

## 3. Vercel — Frontend Deployment

### Deploy steps

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
2. Set **Root Directory** to `resume_frontend`.
3. **Framework preset:** Vite (auto-detected).
4. **Build command:** `npm run build` (default).
5. **Output directory:** `dist` (default).

### Environment Variables on Vercel

> Because `vercel.json` already rewrites `/api/*` to the Render backend, **you do not need to set `VITE_API_URL`** unless you want to override the proxy. The empty default in `.env` is correct.

If you ever want to call the backend directly (bypassing the proxy — e.g. for debugging):

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.onrender.com` |

### Update vercel.json with your actual Render URL

Edit `resume_frontend/vercel.json` and replace the placeholder with your real Render service URL:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-ACTUAL-BACKEND.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Commit and push — Vercel redeploys automatically.

### SPA Routing

The second rewrite rule (`"/(.*)" → "/index.html"`) handles React Router client-side navigation. Direct URL access (`/dashboard`, `/ats-analysis`, etc.) will work without a 404.

---

## 4. Python ATS Service (Optional)

The Spring Boot backend has a full Java ATS scorer as fallback. The Python service adds semantic similarity scoring via SentenceTransformer (`all-MiniLM-L6-v2`).

**To deploy on Render:**

1. **New → Web Service** → same repo.
2. **Runtime:** Docker
3. **Dockerfile path:** `./ats-python-service/Dockerfile`
4. **Docker context:** `./ats-python-service`
5. **Health check:** `/health`
6. After it's live, set `ATS_PYTHON_URL` on the backend service to `https://your-python-service.onrender.com`.

> Note: The SentenceTransformer model download (~90 MB) happens at Docker build time (baked into the image). First cold start on Render free tier will be slow (~60s). The Java backend handles this gracefully — it pings `/health` at startup and skips Python if unreachable.

---

## 5. Post-Deployment Checklist

- [ ] `/actuator/health` returns `{"status":"UP"}`
- [ ] Register a new account → verification email arrives
- [ ] Login → auth cookie is set (check DevTools → Application → Cookies for your Vercel domain)
- [ ] Generate a resume → AI responds correctly
- [ ] Upload a PDF for ATS analysis → score appears
- [ ] Password reset email contains correct Vercel URL (not localhost)
- [ ] Razorpay payment flow completes (use test card `4111 1111 1111 1111`)
- [ ] Direct URL navigation works (e.g. paste `/dashboard` in browser bar — no 404)

---

## 6. Common Issues & Fixes

### Auth cookie not being sent

**Symptom:** Login succeeds but every subsequent request returns 401.

**Cause:** Cookie requires `SameSite=None; Secure` for cross-origin requests, which requires HTTPS on both sides.

**Fix:** Ensure `COOKIE_SECURE=true` is set on Render. Render always serves HTTPS so this is always correct in production. Never set `COOKIE_DOMAIN` to anything — leave it blank.

---

### CORS error in browser console

**Symptom:** `Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy`

**Fix:** Add your exact Vercel URL (including `https://`, no trailing slash) to `CORS_ALLOWED_ORIGINS` on Render:
```
https://your-app.vercel.app
```
If Vercel gave you a preview URL like `your-app-git-main-yourname.vercel.app`, add that too (comma-separated).

> If you're using the `vercel.json` proxy approach (recommended), CORS errors should not occur because the browser sees all requests as same-origin.

---

### 500 errors on first boot

**Symptom:** Backend crashes at startup.

**Likely cause:** A required env var is missing. Check Render logs for:
- `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` → database not connected
- `GROQ_API_KEY` → AI will not work (check for `NOT SET` in startup logs)
- `JWT_SECRET` → app will fail to start
- `RESEND_API_KEY` → email sending fails silently

---

### Supabase connection timeout / pool exhaustion

The HikariCP pool is already tuned for Supabase in `application.properties` (min 2, max 10, keepalive 30s). If you see timeout errors:

1. Confirm you're using the **Transaction Pooler** URL (port `5432`), not the direct connection.
2. Check Supabase → Database → Connection Pooling is enabled.
3. Increase `spring.datasource.hikari.maximum-pool-size` if on a paid Render plan.

---

### Password reset link goes to localhost

**Fix:** Set `FRONTEND_URL=https://your-app.vercel.app` on Render.

---

### Vercel shows blank page on direct URL access

**Fix:** Ensure `vercel.json` is present in `resume_frontend/` and committed. The catch-all rewrite `"/(.*)" → "/index.html"` is what enables SPA routing.

---

## 7. Local Development

```bash
# Terminal 1 — Backend
cd resume-ai-backend
# Ensure .env is populated (copy from .env.example)
./mvnw spring-boot:run

# Terminal 2 — Frontend
cd resume_frontend
npm install
npm run dev
# Vite proxies /api/* → localhost:8081 automatically (vite.config.js)

# Terminal 3 — Python ATS (optional)
cd ats-python-service
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python main.py
```

Local frontend runs at `http://localhost:5173`. The Vite proxy handles all `/api/*` traffic — no CORS setup needed locally.
