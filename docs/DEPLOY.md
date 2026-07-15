# Deploying VitalPlan

## Architecture

| Surface | Host | URL |
|---------|------|-----|
| Frontend (React SPA) | GitHub Pages | https://amulyavarshney.github.io/VitalPlan/ |
| Backend (FastAPI + **Swagger**) | Render (Docker) | https://vitalplan-api.onrender.com |
| Swagger UI | Backend | https://vitalplan-api.onrender.com/api/docs |

> **Why not run the API on github.io?** GitHub Pages only serves static files. A FastAPI process needs a container/VM host (Render free tier here).

## 1. Backend (Swagger + API)

1. Open [Render Blueprints](https://dashboard.render.com/blueprints) and connect this repo.
2. Apply `render.yaml` (service name `vitalplan-api`, root `backend/`).
3. Wait for the first deploy. Confirm:
   - Health: `https://<service>.onrender.com/api/health`
   - Swagger: `https://<service>.onrender.com/api/docs` (alias `/docs`)
4. In the GitHub repo → **Settings → Secrets and variables → Actions → Variables**, set:
   - `VITE_API_URL` = `https://<service>.onrender.com/api`

Free Render instances cold-start after idle; the first request may take ~30–60s.

## 2. Frontend (GitHub Pages)

1. Repo **Settings → Pages → Build and deployment → Source**: **GitHub Actions**.
2. Push to `main` (or run **Deploy GitHub Pages** workflow manually).
3. Site: https://amulyavarshney.github.io/VitalPlan/

The workflow builds with `VITE_BASE=/VitalPlan/` and the `VITE_API_URL` variable.

## 3. Local production-like check

```bash
# API
cd backend && source .venv/bin/activate
export ENVIRONMENT=production
export SECRET_KEY="$(python -c 'import secrets; print(secrets.token_hex(32))')"
export ADMIN_REGISTRATION_SECRET="$(python -c 'import secrets; print(secrets.token_hex(16))')"
export ALLOWED_HOSTS='["http://localhost:5173","https://amulyavarshney.github.io"]'
alembic upgrade head
uvicorn main:app --host 0.0.0.0 --port 8000
# Swagger: http://localhost:8000/api/docs

# Frontend (GitHub Pages base path)
cd frontend
VITE_BASE=/VitalPlan/ VITE_API_URL=http://localhost:8000/api npm run build
npx vite preview --base /VitalPlan/
```

## Swagger notes

- Interactive docs are always enabled (`/api/docs`, `/docs` redirect).
- CSP is relaxed only for Swagger/ReDoc routes so CDN assets load.
- Use **Authorize** in Swagger with a Bearer token from `/api/auth/login`.
