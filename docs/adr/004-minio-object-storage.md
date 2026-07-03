# ADR 004: MinIO Object Storage over Filesystem Storage

*   **Status**: Approved
*   **Decided by**: Tech Lead
*   **Date**: 2026-07-02

---

## Context and Problem Statement

PixelQueue manages original high-resolution image uploads, ML model weights, and compressed ZIP archives. 

Should we store these files on a shared local directory (filesystem storage) mounted to the containers, or use an S3-compatible object storage service?

---

## Decision Driver

1.  **Cloud Portability**: The code must be compatible with standard cloud environments (like AWS S3) without requiring code refactoring.
2.  **Horizontal Scaling**: Application containers must remain stateless. We should avoid relying on locally mounted directories that are difficult to coordinate across multiple nodes.
3.  **Security**: Support for temporary pre-signed URLs to fetch and upload files securely from the client browser.

---

## Considered Options

1.  **MinIO**: An open-source, S3-compatible high-performance object storage server.
2.  **Mounted Local Directory**: Storing files directly on the host filesystem and mapping them as volumes inside the API and worker containers.

---

## Decision Outcome

We chose **MinIO** as our local object storage service.

### Consequences

*   **Positive (Pros)**:
    *   **S3 Interface**: The codebase uses S3 SDK APIs (`minio` Python client), allowing us to switch from local MinIO to AWS S3, Google Cloud Storage, or Azure Blob Storage in production by changing only env variables.
    *   **Pre-signed URLs**: Allows the frontend to upload image binaries directly to storage and download them securely, bypassing the API backend server.
    *   **State-Free Containers**: The API and worker nodes do not need to share a mounted filesystem.
*   **Negative (Cons)**:
    *   **Configuration Overhead**: Requires running and maintaining a separate MinIO container and bucket initialization scripts (`minio-init`).
    *   **Network Routing**: Requires separate config settings for internal container connections (`minio:9000`) and external browser connections (`localhost:9000`).
