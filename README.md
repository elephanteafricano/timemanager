# TimeManager Backend

[![CI](https://github.com/elephanteafricano/timemanager/actions/workflows/ci.yml/badge.svg)](https://github.com/elephanteafricano/timemanager/actions/workflows/ci.yml)
[![Security](https://github.com/elephanteafricano/timemanager/actions/workflows/security.yml/badge.svg)](https://github.com/elephanteafricano/timemanager/actions/workflows/security.yml)

Node.js + Express + Sequelize backend for time tracking with JWT auth, RBAC, and comprehensive tests.

## Quick Start

### Requirements
- Node 20+, PostgreSQL 15+, or Docker

### Local Development (with Docker)

```bash
cd C:\Users\temoa\Desktop\timemanager

# Start with hot-reload (backend-dev service with nodemon)
docker compose --profile dev up

# Or production mode
docker compose -f compose.prod.yml up -d --build
docker compose -f compose.prod.yml ps

# Test health via Nginx
curl http://localhost:8080/api/health
```

### Local Development (without Docker)

```bash
cd backend

# Install dependencies
npm ci

# Set environment (or export DATABASE_URL)
cp .env.example .env
# Edit .env if needed; defaults work with local Postgres

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Start dev server (hot-reload with nodemon)
npm run dev

# Health check
curl http://localhost:3000/api/health
```

## Configuration

### Environment Variables

Required (for production/Docker):
- `JWT_SECRET`: Secret key for access tokens (min 32 chars). Change in production!
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens (min 32 chars, distinct recommended)
- `DATABASE_URL`: PostgreSQL connection string

Optional (with defaults):
- `ACCESS_TTL`: Access token lifetime (default: `1h`)
- `REFRESH_TTL`: Refresh token lifetime (default: `7d`)
- `NODE_ENV`: `development`, `test`, or `production` (default: `development`)
- `PORT`: Server port (default: `3000`)
- `DB_SYNC`: Auto-sync database schema on startup (default: `false`)
- `LOG_LEVEL`: Logging level - `trace`, `debug`, `info`, `warn`, `error`, `fatal` (default: `debug` in dev, `info` in prod)

### .env Example

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://admin:secret@localhost:5432/timemanager
JWT_SECRET=my_super_secret_key_change_in_production
JWT_REFRESH_SECRET=my_super_refresh_secret_change_in_production
ACCESS_TTL=1h
REFRESH_TTL=7d
DB_SYNC=false
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user (first_name, last_name required)
- `POST /api/auth/login` - Login with username/email
- `POST /api/auth/refresh` - Refresh access token

### Users (RBAC)
- `GET /api/users` - List all users (manager only) or self (employee)
- `GET /api/users/:id` - Get user by ID (manager or self)
- `POST /api/users` - Create user (manager only)
- `PUT /api/users/:id` - Update user (manager or self; employees can't change role)
- `DELETE /api/users/:id` - Delete user (manager or self)

### Teams
- `GET /api/teams` - List all teams
- `GET /api/teams/:id` - Get team with members
- `POST /api/teams` - Create team (manager only)
- `PUT /api/teams/:id` - Update team (manager only)
- `PUT /api/teams/:id/members` - Update team members (manager only)
- `DELETE /api/teams/:id` - Delete team (manager only)

### Clocks (Time Tracking)
- `POST /api/clocks` - Clock in/out (employees only for self, managers for any)
- `GET /api/clocks/:userId` - Get clock records (employees only for self, managers for any)

### Reports (KPIs)
- `GET /api/reports?userId=X` - Get time report for user (requires userId query param)

### Health & Docs
- `GET /api/health` - Service health check
- `GET /api/swagger` - **Swagger/OpenAPI interactive docs** (with auth form for testing)

## Testing

```bash
cd backend

# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.test.js
```

**Test Results**: 67/67 passing (100%), ~86% code coverage

## Linting & Security

```bash
# Lint all files
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

**CI/CD**:
- GitHub Actions runs tests + coverage on push/PR
- CodeQL security scanning enabled
- ESLint checks enforced

### Accessibility & UX (CI)

Accessibility is lint-gated in CI on every push/PR in `.github/workflows/ci.yml`:
- job: `frontend`
- step: `Lint (frontend)` running `npm run lint`

Frontend accessibility rules are enforced in `frontend/package.json` under `eslintConfig.rules`, including:
- `jsx-a11y/anchor-is-valid: "error"`
- `jsx-a11y/alt-text: "error"`
- `jsx-a11y/aria-role: "error"`

This provides auditable REQ-025 evidence that UX/accessibility checks are part of CI.

## Structured Logging & Request Tracing

The backend uses **Pino** for structured JSON logging with automatic request correlation:

### Features
- **JSON logs** in production for machine-readable output
- **Pretty-printed logs** in development with timestamps and colors
- **Request correlation**: Every request gets a unique `X-Request-ID` (auto-generated or passed in header)
- **Automatic log levels**: INFO for 2xx, WARN for 4xx, ERROR for 5xx
- **Sensitive field redaction**: Passwords, tokens, and auth headers are redacted as `[REDACTED]`

### Request ID Propagation
```bash
# Client sends custom request ID
curl -H "X-Request-ID: my-custom-id" http://localhost:3000/api/health

# Response includes the same ID in header
X-Request-ID: my-custom-id

# All logs for this request include: "req": {"id": "my-custom-id", ...}
```

### Log Levels
Control verbosity with `LOG_LEVEL` env var:
```bash
LOG_LEVEL=debug npm run dev    # Debug SQL queries + full request/response
LOG_LEVEL=info npm start       # Production: only INFO and above
LOG_LEVEL=warn npm start       # Only warnings and errors
```

### Example Log Output (Development)
```
[10:11:35 UTC] WARN: POST /api/auth/login 400
  env: "development"
  req: {
    "id": "6a01e2d6-4300-4d4d-8732-fbe47610ea30",
    "method": "POST",
    "url": "/api/auth/login",
    "headers": {
      "authorization": "[REDACTED]"
    }
  }
  res: {
    "statusCode": 400,
    "headers": {
      "x-request-id": "6a01e2d6-4300-4d4d-8732-fbe47610ea30"
    }
  }
  responseTime: 3
```

### Example Log Output (Production)
```json
{"level":30,"time":1705317095000,"env":"production","req":{"id":"uuid-here","method":"GET","url":"/api/health"},"res":{"statusCode":200,"headers":{"x-request-id":"uuid-here"}},"responseTime":2,"msg":"GET /health 200"}
```

## API Rate Limiting

The backend enforces rate limits to prevent abuse and ensure fair usage:

### Limits
- **Global**: 100 requests per 15 minutes per IP (all endpoints)
- **Auth endpoints** (`/api/auth/*`): 10 requests per 15 minutes per IP (stricter for login/register/refresh)
- **Test environment**: Rate limiting automatically disabled

### Rate Limit Headers
Responses include standard rate limit headers:
```
RateLimit-Limit: 100
RateLimit-Remaining: 97
RateLimit-Reset: 1705317995
```

### 429 Response
When rate limit exceeded:
```json
{
  "error": {
    "status": 429,
    "message": "Too many requests, please try again later.",
    "requestId": "uuid-here"
  }
}
```

### Behind Nginx/Load Balancer
The server trusts proxy headers (`app.set('trust proxy', 1)`) for accurate IP identification in Docker/cloud environments.

## Docker & Compose

### Production Mode

```bash
docker compose -f compose.prod.yml up -d --build
docker compose -f compose.prod.yml ps
```

Runs: Postgres, backend (production Dockerfile), Nginx reverse proxy on port 8080

### Development Mode (with Hot-Reload)

```bash
docker compose --profile dev up --build
```

Runs: Postgres, backend-dev (nodemon + volume mounts), Nginx on port 8080

REQ-009 separation:
- Dev uses `docker compose --profile dev ...` for hot-reload via `backend-dev`.
- Prod uses `docker compose -f compose.prod.yml ...` for production-style containers.
- Keep validation and troubleshooting commands in the same mode you started.

### Runtime Validation (REQ-008)

REQ-008 requires proving that backend and frontend are exposed, and that database data persists across restarts.

#### A) Dev Compose (`compose.yml`)

```bash
# Start dev stack
docker compose --profile dev up -d --build

# Backend reachable through reverse proxy
curl -fsS http://localhost:8080/api/health
# EXPECT: HTTP 200 + JSON containing "status":"ok"

# Frontend reachable through reverse proxy
curl -I http://localhost:8080/
# EXPECT: HTTP/1.1 200 OK (or 304) from nginx

# DB persistence check: create user through API, verify before/after restart
TS=$(date +%s)
EMAIL="req008.dev.${TS}@example.com"
USERNAME="req008dev${TS}"

curl -fsS -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${USERNAME}\",\"email\":\"${EMAIL}\",\"password\":\"Password1\",\"first_name\":\"Req008\",\"last_name\":\"Dev\"}"
# EXPECT: HTTP 201 + JSON containing created user (including "email":"${EMAIL}")

docker compose exec -T postgres psql -U admin -d timemanager -tAc "SELECT COUNT(*) FROM users WHERE email='${EMAIL}';"
# EXPECT: 1

docker compose down
docker compose --profile dev up -d

docker compose exec -T postgres psql -U admin -d timemanager -tAc "SELECT COUNT(*) FROM users WHERE email='${EMAIL}';"
# EXPECT: 1 (same value after restart, proving persistence)
```

#### B) Prod Compose (`compose.prod.yml`)

```bash
# Start prod stack
docker compose -f compose.prod.yml up -d --build

# Backend reachable through reverse proxy
curl -fsS http://localhost:8080/api/health
# EXPECT: HTTP 200 + JSON containing "status":"ok"

# Frontend reachable through reverse proxy
curl -I http://localhost:8080/
# EXPECT: HTTP/1.1 200 OK (or 304) from nginx

# DB persistence check: create user through API, verify before/after restart
TS=$(date +%s)
EMAIL="req008.prod.${TS}@example.com"
USERNAME="req008prod${TS}"

curl -fsS -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${USERNAME}\",\"email\":\"${EMAIL}\",\"password\":\"Password1\",\"first_name\":\"Req008\",\"last_name\":\"Prod\"}"
# EXPECT: HTTP 201 + JSON containing created user (including "email":"${EMAIL}")

docker compose -f compose.prod.yml exec -T postgres psql -U admin -d timemanager -tAc "SELECT COUNT(*) FROM users WHERE email='${EMAIL}';"
# EXPECT: 1

docker compose -f compose.prod.yml down
docker compose -f compose.prod.yml up -d

docker compose -f compose.prod.yml exec -T postgres psql -U admin -d timemanager -tAc "SELECT COUNT(*) FROM users WHERE email='${EMAIL}';"
# EXPECT: 1 (same value after restart, proving persistence)
```

### Database seeding (Docker)

Default seed data (from `docker/postgres/init/01_seed.sql`):
- Users:
  - `manager1` / `manager1@example.com` / `manager`
  - `manager2` / `manager2@example.com` / `manager`
  - `employee1` / `employee1@example.com` / `employee`
  - `employee2` / `employee2@example.com` / `employee`
  - `employee3` / `employee3@example.com` / `employee`
  - `employee4` / `employee4@example.com` / `employee`
- Teams:
  - `Development Team`
  - `Design Team`
- Clocks/time records:
  - No default `clocks` rows are inserted by the SQL seed file.

When seeding runs:
- Compose mounts `./docker/postgres/init` into `/docker-entrypoint-initdb.d` for Postgres.
- With named volumes (`pgdata` / `pgdata_prod`), init scripts run on first database initialization only.
- If the volume already exists, seed SQL does not run again automatically.

Force reseed (destructive):

```bash
docker compose down -v
docker compose up -d --build
```

This removes Postgres volume data and recreates DB content from init scripts.

Verify seeded data:

```bash
docker compose exec -T postgres psql -U admin -d timemanager -c "SELECT id, username, role, team_id FROM users ORDER BY id;"
docker compose exec -T postgres psql -U admin -d timemanager -c "SELECT id, name, manager_id FROM teams ORDER BY id;"
docker compose exec -T postgres psql -U admin -d timemanager -c "SELECT id, user_id, clock_in, clock_out FROM clocks ORDER BY id DESC LIMIT 20;"
```

Manual seed scripts:
- `backend/scripts/seed-users.js` exists for manual execution only (not auto-run by compose/startup).
- `backend/src/seed/seedUsers.js` exists but is env-gated (`SEED_DEFAULT_USERS`) and not wired into server startup.

### Mailpit (Fake Email)

- Mailpit UI: `http://localhost:8025`
- Password reset emails from `POST /api/auth/forgot-password` are delivered to Mailpit in Docker

```bash
curl -fsS -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"manager1@example.com"}'

curl -fsS http://localhost:8025/api/v1/message/latest/raw
```

### Common Commands

```bash
# View logs
docker compose logs -f backend

# Stop all services
docker compose down

# Remove volumes (reset DB)
docker compose down -v
```

> [!WARNING]
> `docker compose down -v` removes the Postgres volume (`pgdata`) and wipes all database data (users, teams, roles/assignments).
> Seeded accounts/teams are recreated only on a fresh database initialization; if no seed runs, you must register users again.
> After a reset, logging in as a non-manager can show `Insufficient permissions` on `/users` and `/teams` because those routes are manager-restricted.

Safe restart (keeps data):

```bash
docker compose down
docker compose up -d --build
```

Full reset (wipes data and reseeds on fresh init):

```bash
docker compose down -v
docker compose up -d --build
```

## Project Structure

```
backend/
├── src/
│   ├── config/              # Database configuration
│   ├── controllers/         # Request handlers with RBAC
│   ├── middleware/          # Auth & role checks
│   ├── models/              # Sequelize models
│   ├── routes/              # Endpoint definitions (JSDoc comments for Swagger)
│   ├── utils/               # Validators, error handling, env
│   ├── swagger.config.js    # OpenAPI/Swagger spec
│   └── index.js             # Express app entry
├── tests/                   # Jest + Supertest suite
├── Dockerfile              # Multi-stage production build
├── .dockerignore            # Slim image files
├── package.json
└── .eslintrc.json           # ESLint strict rules
```

## Tech Stack

- **Framework**: Express 5
- **Database**: PostgreSQL 15 + Sequelize ORM
- **Auth**: JWT (jsonwebtoken) + bcrypt
- **Testing**: Jest + Supertest
- **Linting**: ESLint with strict rules
- **Logging**: Pino (structured JSON logging with request correlation)
- **Docs**: Swagger/OpenAPI (swagger-ui-express)
- **DevOps**: Docker, Docker Compose, GitHub Actions

## Security Notes

- All endpoints require JWT bearer token (except `/api/auth/register` and `/api/auth/login`)
- Passwords hashed with bcrypt (10 rounds)
- RBAC enforced: employees can only access their own resources; managers have full access
- `.env` excluded from Git; use `DATABASE_URL` or `.env.example` for setup
- Secrets (JWT_SECRET) must be changed in production

## Troubleshooting

### "relation 'users' does not exist"
- Set `DB_SYNC=true` in `.env` or compose to auto-create tables on startup
- Or manually: `npm run db:sync` (not yet implemented; use DB_SYNC instead)

### JWT validation errors
- Ensure `JWT_SECRET` is set consistently across services
- Check token expiry: access tokens expire after 1 hour

### Port already in use
- Change `PORT` env var or stop conflicting service:
  ```bash
  lsof -i :3000  # Find process
  kill <PID>     # Kill it
  ```

### Nginx returns 502
- Check backend health: `docker compose logs backend`
- Ensure backend service name is correct in nginx.conf (should be `http://backend:3000`)

## Next Steps

- Add frontend (React/Vue SPA)
- Add email notifications
- Add audit logging
- Add rate limiting
- Add request tracing/observability
- Set up branch protection rules on GitHub


