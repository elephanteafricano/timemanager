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
docker compose up

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
- `JWT_SECRET`: Secret key for JWT signing. Change in production!
- `DATABASE_URL`: PostgreSQL connection string

Optional (with defaults):
- `NODE_ENV`: `development`, `test`, or `production` (default: `development`)
- `PORT`: Server port (default: `3000`)
- `DB_SYNC`: Auto-sync database schema on startup (default: `false`)

### .env Example

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://admin:secret@localhost:5432/timemanager
JWT_SECRET=my_super_secret_key_change_in_production
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
- `DELETE /api/users/:id` - Delete user (manager only)

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

## Docker & Compose

### Production Mode

```bash
docker compose up --build
```

Runs: Postgres, backend (production Dockerfile), Nginx reverse proxy on port 8080

### Development Mode (with Hot-Reload)

```bash
docker compose --profile dev up --build
```

Runs: Postgres, backend-dev (nodemon + volume mounts), Nginx on port 8080

### Common Commands

```bash
# View logs
docker compose logs -f backend

# Stop all services
docker compose down

# Remove volumes (reset DB)
docker compose down -v
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


