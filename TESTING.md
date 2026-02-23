# Backend Route Test Coverage

This document maps API route groups to integration test files and records remaining untested routes/behaviors with rationale.

## Tested Routes

### Auth (`/api/auth`)
- `POST /register` -> `backend/tests/auth.test.js`
- `POST /login` -> `backend/tests/auth.test.js`
- `POST /refresh` -> `backend/tests/auth.test.js`
- `POST /forgot-password` -> `backend/tests/auth.reset.test.js`
- `POST /reset-password` -> `backend/tests/auth.reset.test.js`

### Users (`/api/users`)
- `GET /` -> `backend/tests/users.test.js`
- `GET /:id` -> `backend/tests/users.test.js`
- `PUT /:id` -> `backend/tests/users.test.js`
- `DELETE /:id` -> `backend/tests/users.test.js`
- `GET /:id/clocks` (alias route) -> `backend/tests/clocks.test.js`

### Teams (`/api/teams`)
- `POST /` -> `backend/tests/teams.test.js`
- `GET /` -> `backend/tests/teams.test.js`
- `GET /:id` -> `backend/tests/teams.test.js`
- `PUT /:id` -> `backend/tests/teams.test.js`
- `DELETE /:id` -> `backend/tests/teams.test.js`
- `PUT /:id/members` -> `backend/tests/teams.test.js`

### Clocks (`/api/clocks`)
- `POST /` -> `backend/tests/clocks.test.js`
- `GET /:userId` -> `backend/tests/clocks.test.js`
- `PUT /:id` -> `backend/tests/clocks.test.js`

### Reports (`/api/reports`)
- `GET /` -> `backend/tests/reports.test.js`

### KPIs (`/api/kpis`)
- `GET /current` -> `backend/tests/kpis.test.js`

### Time Rules (`/api/time-rules`)
- `GET /current` -> `backend/tests/timeRules.test.js`
- `GET /` -> `backend/tests/timeRules.test.js`
- `GET /:id` -> `backend/tests/timeRules.test.js`
- `POST /` -> `backend/tests/timeRules.test.js`
- `PUT /:id` -> `backend/tests/timeRules.test.js`
- `DELETE /:id` -> `backend/tests/timeRules.test.js`

### Health
- `GET /api/health` -> `backend/tests/health.test.js`

## Untested Routes / Behaviors

1. `GET /api/swagger` and Swagger UI assets  
Reason: endpoint returns generated HTML/static assets and is documentation-only; payload is not a stable JSON contract.  
Risk: UI rendering issues could go unnoticed in CI.  
Mitigation: manual smoke check in browser (`http://localhost:8080/api/swagger`) during release validation.

2. Auth rate-limit threshold behavior on `/api/auth/*`  
Reason: deterministic assertions are brittle because limiter state and timing can vary by environment/parallel runs.  
Risk: misconfigured limiter window/limits might only appear under sustained traffic.  
Mitigation: keep middleware unit/integration smoke checks for normal auth paths, and run targeted load/rate-limit checks in staging.
