# Authentication & Sessions API (v1)

PixelQueue uses secure, cookie-based session management for the internal frontend application. It employs short-lived JWT access tokens, long-lived refresh tokens, and strict CSRF double-submit token validation to protect against session hijacking and Cross-Site Request Forgery (CSRF).

---

## 🔐 Cookie-Based Authentication Flow

The standard authentication cycle manages user sessions automatically via HTTP-only cookies.

```
[Register/Login] ──► Sets access cookie (pixelqueue_access)
                 ──► Sets refresh cookie (pixelqueue_refresh)
                 ──► Sets CSRF cookie (csrf_token)
```

### 1. Registration (`POST /api/v1/auth/register`)
Creates a new user profile and establishes an active session immediately.
*   **Request Payload**:
    ```json
    {
      "email": "user@example.com",
      "full_name": "Jane Doe",
      "password": "securepassword123"
    }
    ```
*   **Response Headers**:
    *   `Set-Cookie: pixelqueue_access=[JWT]; HttpOnly; Path=/api; SameSite=Lax` (Expires in 30m)
    *   `Set-Cookie: pixelqueue_refresh=[UUID]; HttpOnly; Path=/api/v1/auth; SameSite=Lax` (Expires in 7d)
    *   `Set-Cookie: csrf_token=[TokenString]; Path=/; SameSite=Lax` (Readable by JavaScript)

### 2. Login (`POST /api/v1/auth/login`)
Establishes a session for an existing user.
*   **Request Payload**:
    ```json
    {
      "email": "user@example.com",
      "password": "securepassword123"
    }
    ```
*   **Response Headers**: Sets cookies exactly like `/register`.

### 3. Logout (`POST /api/v1/auth/logout`)
Clears all active cookies on the client browser and revokes the refresh session in the database.
*   **Response Headers**: Deletes `pixelqueue_access`, `pixelqueue_refresh`, and `csrf_token` cookies.

---

## 🛡️ CSRF Double-Submit Protection

To prevent Cross-Site Request Forgery, the backend enforces CSRF validation on all unsafe HTTP methods (`POST`, `PUT`, `DELETE`, `PATCH`) when cookie-based authentication is active.

1.  **CSRF Cookie**: On registration/login or any safe GET request, the backend drops a `csrf_token` cookie. This cookie has `httponly=False` so that the client JavaScript can read it.
2.  **Header Injection**: The frontend client must read the value of the `csrf_token` cookie and append it as the `X-CSRF-Token` header in all modification requests.
3.  **Validation**: The `CSRFMiddleware` checks that the `csrf_token` cookie value matches the `X-CSRF-Token` header value using cryptographically secure string comparison.

### Exempt Endpoints
CSRF verification is skipped on:
*   Safe methods (`GET`, `HEAD`, `OPTIONS`, `TRACE`)
*   OAuth and onboarding boundaries (`/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/google/*`)

---

## 🔑 Google OAuth callback flow

If Google OAuth is configured, the browser initiates authentication by directing the user to the auth endpoints:

1.  **Initiation**: The frontend directs the user's browser to `GET /api/v1/auth/google/start`.
2.  **Redirect**: The backend redirects the client to the Google consent screen.
3.  **Callback**: After consent, Google redirects the browser back to `GET /api/v1/auth/google/callback` with a authorization code query parameter.
4.  **Session Setup**: The backend exchanges the code for a profile token, ensures the user is registered, sets the session cookies, and redirects the browser back to the frontend dashboard (`FRONTEND_URL`).

---

## 🚨 Session Expiration & Refresh (`401` Handling)

If the 30-minute access token (`pixelqueue_access`) expires, API calls return an `HTTP 401 Unauthorized` status.

### Automatic Token Refresh Workflow
The frontend client uses an interceptor (implemented in `src/api/client.js`) to seamlessly refresh the session without user intervention:

1.  **Interceptor Trigger**: Any request returning an HTTP 401 status intercepts execution.
2.  **Token Refresh call**: The client triggers a request to `POST /api/v1/auth/refresh`. Since this endpoint resides under `/api/v1/auth`, the browser automatically transmits the long-lived `pixelqueue_refresh` cookie.
3.  **Re-issue**: The API verifies the refresh token session in the DB, registers a new short-lived access JWT, and writes a fresh `pixelqueue_access` cookie.
4.  **Retry**: The original request is retried and completes successfully.
5.  **Hard Expire**: If `/auth/refresh` also fails (e.g. refresh token is revoked or expired past 7 days), the frontend must clean up state and redirect the user to `/login`.

---

## 💻 Frontend Fetch Integration Example

Here is how the React frontend client encapsulates token propagation and CSRF header configuration:

```javascript
// Function to read the CSRF cookie value
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Custom Fetch Client
async function apiRequest(url, options = {}) {
  // Ensure credentials are sent (cookies)
  options.credentials = 'include';
  
  // Setup headers
  options.headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Inject CSRF token on modifying methods
  const method = (options.method || 'GET').toUpperCase();
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (!safeMethods.includes(method)) {
    const csrfToken = getCookie('csrf_token');
    if (csrfToken) {
      options.headers['X-CSRF-Token'] = csrfToken;
    }
  }

  let response = await fetch(url, options);

  // Auto-refresh on 401 Unauthorized
  if (response.status === 401 && !url.includes('/auth/refresh')) {
    const refreshResponse = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshResponse.ok) {
      // Re-try original request once token is updated
      response = await fetch(url, options);
    } else {
      // Refresh failed; clear session and redirect
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  return response;
}
```
