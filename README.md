# TimeManager Backend

[![CI](https://github.com/elephanteafricano/timemanager/actions/workflows/ci.yml/badge.svg)](https://github.com/elephanteafricano/timemanager/actions/workflows/ci.yml)

Node.js + Express + Sequelize backend for time tracking with JWT auth, RBAC, and comprehensive tests.

## Quick Start

- Requirements: Node 18+ (or 20), PostgreSQL 15+
- Clone the repo, then:

```bash
cd backend
npm ci

# Set your database (or export DATABASE_URL)
# Default (dev) is postgresql://admin:secret@localhost:5432/timemanager

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Start dev server
npm run dev
```

## Configuration

- Copy `backend/.env.example` to `.env` if you prefer env files
- Or export `DATABASE_URL` directly (used in tests and CI)

## Tech

- Express 5, Sequelize 6 (PostgreSQL)
- JWT auth (access/refresh), bcrypt
- Jest + Supertest (100% tests passing locally)
- GitHub Actions CI (Node 18/20 + Postgres service)

## Endpoints

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`
- Users: `/api/users` CRUD (RBAC)
- Teams: `/api/teams` + members
- Clocks: `/api/clocks` (toggle), `/api/clocks/:userId`
- Reports: `/api/reports?userId=...&startDate=...&endDate=...`

## Notes

- `.env`, `coverage`, and other artifacts ignored per root `.gitignore`
- Default dev DB: `admin:secret@localhost:5432/timemanager`
