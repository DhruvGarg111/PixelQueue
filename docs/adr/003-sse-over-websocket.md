# ADR 003: Server-Sent Events (SSE) over WebSockets

*   **Status**: Approved
*   **Decided by**: Tech Lead
*   **Date**: 2026-07-02

---

## Context and Problem Statement

PixelQueue runs heavy tasks asynchronously in the background. The frontend needs to be notified in real-time when:
- An image upload is committed to the database.
- An ML auto-labeling job finishes predicting boundaries.
- A ZIP dataset export is compiled and ready for download.

What protocol should we use to push these events from the backend API to the client browser?

---

## Decision Driver

1.  **Low Complexity**: The system only needs unidirectional communication (server-to-client).
2.  **Resource Efficiency**: The connection must be lightweight and easily traverse standard proxies and firewalls.
3.  **Automatic Reconnections**: Built-in support for reconnecting when connection dropouts occur.

---

## Considered Options

1.  **Server-Sent Events (SSE)**: Standard HTTP-based unidirectional data streaming using the `text/event-stream` media type.
2.  **WebSockets**: A full-duplex TCP-based bidirectional communication protocol.
3.  **Short Polling**: Client continually makes standard HTTP GET requests (e.g. every 3 seconds) to verify status.

---

## Decision Outcome

We chose **Server-Sent Events (SSE)**.

### Consequences

*   **Positive (Pros)**:
    *   **Simplicity**: Built over standard HTTP. It does not require custom socket protocols or connection upgrades, making it easy to route through Nginx proxies.
    *   **Native Browser API**: Uses the browser's native `EventSource` API, which automatically handles connection retries and exposes clean event listener bindings.
    *   **Lightweight**: Heartbeat pings require negligible server resources.
*   **Negative (Cons)**:
    *   **Unidirectional**: We cannot send messages back to the server over the same SSE connection. However, standard HTTP POST/PUT requests are sufficient for client-to-server operations.
    *   **HTTP/1.1 Connection Limits**: Standard HTTP/1.1 limits the number of open connections per domain to 6. This limit is bypassed in production by deploying over HTTP/2.
