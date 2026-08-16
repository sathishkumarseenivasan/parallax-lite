# Deploying Parallax Lite

Parallax Lite is designed to run anywhere, from a free-tier hobby stack to a robust enterprise environment.

## Option A: Vercel + Render (Free Tier)
Perfect for testing and small communities.

1. **Backend (Render):**
   - Connect your GitHub repo to Render.
   - Use the provided `render.yaml` blueprint.
   - It deploys the backend as a Docker container, mounts a persistent 1GB disk for SQLite, and sets up health checks.
   - **Environment Matrix:**
     - `PARALLAX_ENV`: production
     - `PARALLAX_MODE`: network (or private)
     - `DATABASE_URL`: sqlite:////data/parallax.db
     - `FRONTEND_ORIGIN`: Your Vercel domain (e.g., `https://my-parallax.vercel.app`)

2. **Frontend (Vercel):**
   - Connect your repo to Vercel and select the `frontend` directory as the Root Directory.
   - The provided `vercel.json` handles SPA routing and API proxies.
   - **Environment Matrix:**
     - `BACKEND_URL`: Your Render URL (e.g., `https://parallax-backend.onrender.com`)

### Hosted Network Checklist (Manual Journey)
For the public network mode, run through these manually:
- [ ] Visit the Vercel URL and confirm the landing page loads without error.
- [ ] Ensure `/api/health` shows `mode: network`.
- [ ] Test the No-Code Studio (Door A) via the Playground page.
- [ ] Generate an API key locally, verify you can't access `/api/system/doctor` from the public internet.
- [ ] Verify CORS prevents transactions from unauthorized origins.

## Option B: Single VPS (Docker Compose)
Ideal for private teams self-hosting Parallax.

1. Clone the repository on your VPS.
2. Configure `.env` with:
   - `PARALLAX_ENV=production`
   - `PARALLAX_MODE=private`
   - `FRONTEND_ORIGIN=http://your-domain.com`
3. Boot the stack:
   ```bash
   docker compose up -d
   ```
4. Check health:
   ```bash
   plx doctor
   ```

## Option C: Local Dev
Ideal for hacking on Parallax.

1. Setup:
   ```bash
   make dev
   ```
2. **Environment Matrix:**
   - `PARALLAX_ENV`: development
   - `PARALLAX_MODE`: local

### CORS Settings
- **network mode**: Highly restrictive. `FRONTEND_ORIGIN` must exactly match your live site.
- **private mode**: Internal use, typically allows intranet IPs.
- **local mode**: Allows `http://localhost:3000` by default.
