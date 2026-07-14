# VitalPlan - AI-Powered Diet Guide

Personalized diet plans, AI food scanning, marketplace checkout, and nutrition tracking.

## Architecture

| Layer | Stack |
|-------|--------|
| Frontend | React 18, TypeScript, Vite, Tailwind, React Router, Stripe Elements |
| Backend | FastAPI, SQLAlchemy, Alembic, JWT auth |
| Data | SQLite (dev) / PostgreSQL (Docker), optional Redis for rate limits |
| AI | Azure OpenAI / Groq / OpenAI when configured; demo fallbacks otherwise |

## Features

- Auth: register/login, refresh tokens, password reset, email verification (required in production)
- Profile, goals, AI diet plans (persisted), food scanner + Open Food Facts barcodes, scan history
- Marketplace catalog (DB-backed), cart/checkout with demo or Stripe payments + webhooks
- Admin dashboard (`/admin`) for products and users
- PWA installable shell (static asset precache; online API required for core features)

## Local development

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn main:app --reload --port 8000
pytest -q
```

In development, SQLAlchemy `create_all` can bootstrap tables; **production uses Alembic only** (`entrypoint.sh`).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:8000/api
npm run dev
```

### Docker (dev)

```bash
cd backend
docker compose up -d
```

API `:8000`, Postgres `:5432`, Redis `:6379`.

## Production-like stack

From the repo root:

```bash
export SECRET_KEY='...at-least-32-chars...'
export ADMIN_REGISTRATION_SECRET='...at-least-16-chars...'
export PUBLIC_URL='https://your.domain'
export ALLOWED_HOSTS='["https://your.domain"]'
# Recommended for email verification:
export SMTP_HOST=... SMTP_PORT=587 SMTP_USER=... SMTP_PASSWORD=... SMTP_FROM=...
# Optional Stripe:
export STRIPE_SECRET_KEY=... STRIPE_PUBLISHABLE_KEY=... STRIPE_WEBHOOK_SECRET=...

docker compose -f docker-compose.prod.yml up -d --build
```

HTTP on `:80` via nginx. For automatic HTTPS with Caddy/Let's Encrypt:

```bash
export PUBLIC_HOST=app.example.com
docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml up -d --build
```

Optional: `SENTRY_DSN` / `VITE_SENTRY_DSN`, S3 upload vars (`S3_BUCKET`, …). Stripe webhooks: [docs/STRIPE_WEBHOOKS.md](docs/STRIPE_WEBHOOKS.md).

Frontend E2E smoke: `cd frontend && npm run test:e2e`.

## Security notes

- `ENVIRONMENT=production` enforces strong `SECRET_KEY` and `ADMIN_REGISTRATION_SECRET`
- Email verification is always required in production; configure SMTP
- Admin registration uses `X-Admin-Secret` after the first bootstrap admin in development
- Order totals are computed server-side (subtotal + vendor delivery fee + 8% tax)
- `DELETE /api/users/me` permanently erases account data after password confirmation
- API responses set a tight CSP; the frontend nginx image adds SPA-oriented CSP + framing headers
- Unpaid orders can be cancelled (`POST /api/orders/{id}/cancel`); AI/scanner/order create endpoints are rate-limited
- Production logging defaults to JSON (`LOG_FORMAT=auto`)
- Admin audit log (`GET /api/admin/audit`), logout token revocation (`POST /api/auth/logout`), Prometheus `/metrics`
- Local uploads require signed URLs; account delete purges scan images

## Key API endpoints

### Auth
- `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/refresh`
- `POST /api/auth/verify-email` · `POST /api/auth/verify-email/resend`
- `POST /api/auth/password-reset/request` · `POST /api/auth/password-reset/confirm`

### Users / admin
- `GET|PUT /api/users/me` · `GET /api/users/me/export` · `DELETE /api/users/me` (body: `{ "password" }`)
- `POST /api/auth/logout` (revokes refresh/access `jti`)
- `GET /api/admin/users?limit&offset` · `PATCH /api/admin/users/{id}` · `GET /api/admin/audit`
- Marketplace admin CRUD under `/api/marketplace/admin/items`
- `GET /metrics` (Prometheus)

### Plans / scanner / orders
- `POST /api/diet-plans/generate` · `GET /api/diet-plans`
- `POST /api/scanner/analyze-image` · `GET /api/scanner/history` · `POST /api/scanner/barcode/{barcode}`
- `POST /api/orders` · `POST /api/orders/{id}/pay` · `POST /api/orders/{id}/cancel` · `GET /api/orders?limit&offset`
- `POST /api/webhooks/stripe` (Stripe signature; see webhook docs)
- `GET /api/health` (DB + Redis probes)

## Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full list (SMTP, Stripe, AI keys, Redis, uploads).

## License

MIT
