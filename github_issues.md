### Issue Title:
Cross-Site Request Forgery (CSRF) Gaps for Cookie-Based Auth

### Description:
Authentication accepts cookie tokens for API requests (`get_access_token` falls back to cookies in `api/app/api/deps.py`), and state-changing routes rely on that session. Cookies are issued with configurable `SameSite` policy (`api/app/api/v1/auth.py`), while the frontend always sends credentials (`frontend/src/api/client.js`). The API currently does not enforce CSRF tokens or explicit `Origin`/`Referer` validation for mutation endpoints.

### Why this matters:
`SameSite=lax` mitigates many CSRF cases, but this setup still lacks defense-in-depth and can become vulnerable if deployment requires `SameSite=None` (cross-site SPA/API), if browser behavior differs, or if future routes loosen constraints.

### Suggested Fix:
Add explicit CSRF protection for cookie-authenticated mutating requests:
- implement double-submit or signed CSRF tokens
- validate `Origin`/`Referer` for unsafe methods
- consider requiring bearer tokens in `Authorization` for API mutations

### Priority:
High

### Labels:
security, bug

---

### Issue Title:
No Brute-Force or Abuse Throttling on Auth Endpoints

### Description:
`/api/v1/auth/login`, `/api/v1/auth/register`, and `/api/v1/auth/refresh` have no request-rate throttling or lockout strategy.

### Why this matters:
This increases exposure to credential stuffing, password spraying, and token abuse.

### Suggested Fix:
Add rate limits (IP + account/email dimensions), optional progressive delays, and audit logging/alerts for repeated failures.

### Priority:
High

### Labels:
security, enhancement

---

### Issue Title:
No Production Guard Against Default MinIO Secret

### Description:
`api/app/core/config.py` validates production `JWT_SECRET_KEY`, cookie security, and CORS origin, but does not reject default `MINIO_SECRET_KEY` values such as `minioadmin`.

### Why this matters:
Deploying with default MinIO credentials can expose object storage for unauthorized read/write access.

### Suggested Fix:
Add a production validator in `validate_security_settings` to fail startup when `MINIO_SECRET_KEY` is default/placeholder.

### Priority:
High

### Labels:
security, enhancement

---

### Issue Title:
Synchronous One-Off HTTP Calls in Google OAuth Callback

### Description:
`api/app/api/v1/auth.py` defines `google_callback` as sync and performs OAuth token/userinfo calls via top-level `httpx.post` and `httpx.get`, which create new clients per request and do not reuse pooled connections.

### Why this matters:
This increases latency and resource usage under load and limits scalability for OAuth login bursts.

### Suggested Fix:
Use an application-lifecycle-managed `httpx.AsyncClient` (or a shared sync `httpx.Client`) with connection pooling and timeouts, and make the callback route async when using `AsyncClient`.

### Priority:
High

### Labels:
performance, refactor

---

### Issue Title:
Metrics Endpoint Is Exposed Without Authentication

### Description:
`api/app/api/v1/health.py` exposes `GET /metrics` publicly with no auth guard.

### Why this matters:
Metrics can reveal internal route patterns, request volumes, and service behavior useful for reconnaissance or abuse.

### Suggested Fix:
Restrict metrics to internal networks, protect it with auth, or gate it behind environment-based feature flags.

### Priority:
Medium

### Labels:
security, observability