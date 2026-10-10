# PulseOps Frontend Dashboard

Standalone React 18 + Vite dashboard with Nginx serving static assets and proxying API requests.

## Features
- **Modern Cloud UI**: Real-time backend connectivity checks, PostgreSQL status, pod/host metadata, and workload dispatcher
- **Trivy-compliant Multi-stage Dockerfile**: Builds with Node 20, serves via lightweight, hardened Nginx Alpine
- **Nginx SPA Routing & Proxy**: Built-in `/api` proxying and security headers
- **GitHub Actions CI**: Automated build verification, SonarQube SAST, Trivy image scanning, and push to GitHub Container Registry (`ghcr.io`)

---

## 🚀 Running Locally

### Option A: Using Docker Compose
```bash
docker compose up --build
```
Access the dashboard at [http://localhost:3000](http://localhost:3000).

### Option B: Bare-Metal (Vite Dev Server)
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (requests to `/api` and `/healthz` proxy to backend on port 5000 by default).
