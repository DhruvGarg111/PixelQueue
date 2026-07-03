# Projects API (v1)

This reference documents the endpoints and schemas used to manage annotation projects, memberships, roles, and tasks inside PixelQueue.

---

## 📂 Project Schemas

### Project Object Schema
All endpoints returning project information serialize records into this JSON shape:
```json
{
  "id": "e44d3209-7756-4221-a3f2-c0c28d00f37f",
  "name": "Object Segmentation Project",
  "description": "Seeded boundaries dataset.",
  "created_by": "a0ba5ce1-59fb-d616-de40-527bdd3f0c5a",
  "created_at": "2026-07-02T15:12:00Z",
  "my_role": "admin"
}
```

---

## 🛠️ Operational Endpoints

### 1. Create a Project (`POST /api/v1/projects`)
Creates a new project. The invoking user is automatically granted the `admin` role for the project in the `project_memberships` table.
*   **Permissions**: Any authenticated user (`annotator`, `reviewer`, `admin` global roles).
*   **Request Payload**:
    ```json
    {
      "name": "Autonomous Drone Navigation",
      "description": "Obstacle avoidance training dataset."
    }
    ```
*   **Response**: `201 Created` with a [Project Object](#project-object-schema).

### 2. List Projects (`GET /api/v1/projects`)
Lists all projects.
*   **Behavior**:
    *   **Global Admins**: Returns every project in the system. The `my_role` field is set to `"admin"`.
    *   **Standard Users**: Returns only projects where the user has active membership. The `my_role` field matches the role defined in their membership.
*   **Response**: `200 OK` (Array of Project Objects).

### 3. Delete Project (`DELETE /api/v1/projects/{project_id}`)
Deletes a project and all associated images, annotations, tasks, and memberships.
*   **Permissions**: `admin` project role (or global admin).
*   **Response**: `204 No Content`.

---

## 👥 Memberships & Invites

Memberships bind users to projects and grant them specific access roles.

### Member Object Schema
```json
{
  "id": "18024537-831a-8eb5-31ba-05492671169a",
  "user_id": "a0ba5ce1-59fb-d616-de40-527bdd3f0c5a",
  "project_id": "e44d3209-7756-4221-a3f2-c0c28d00f37f",
  "role": "reviewer",
  "created_at": "2026-07-02T15:15:00Z",
  "email": "reviewer@example.com",
  "full_name": "Reviewer User",
  "global_role": "annotator"
}
```

### 1. List Project Members (`GET /api/v1/projects/{project_id}/members`)
Returns all active memberships in a project.
*   **Permissions**: `annotator` project role or higher.
*   **Response**: `200 OK` (Array of Member Objects).

### 2. Upsert Membership (`POST /api/v1/projects/{project_id}/members`)
Adds a user to a project or updates their existing role.
*   **Permissions**: `admin` project role (or global admin).
*   **Request Payload**: Specify either the `user_id` or `email` along with the target role (`admin`, `reviewer`, `annotator`):
    ```json
    {
      "email": "developer@example.com",
      "role": "annotator"
    }
    ```
*   **Constraints**: A project must retain at least one administrator membership. An error `400 Bad Request` is returned if the request attempts to demote the sole admin of a project.
*   **Response**: `201 Created` / `200 OK` with a [Member Object](#member-object-schema).

---

## 📋 Project Tasks Listing

Tasks track the annotation lifecycle of individual images within a project.

### Task Object Schema
```json
{
  "id": "e14a6439-e66b-30d1-003b-24b1dab4954c",
  "project_id": "e44d3209-7756-4221-a3f2-c0c28d00f37f",
  "image_id": "07ec528c-8ca1-4b70-073c-3caf8bbd8d32",
  "status": "in_review",
  "assigned_to": null,
  "created_at": "2026-07-02T15:12:30Z",
  "updated_at": "2026-07-02T15:18:00Z"
}
```

### 1. Get Project Tasks (`GET /api/v1/projects/{project_id}/tasks`)
Lists task records for the project, sorted by `updated_at` descending (limit: 200).
*   **Permissions**: `annotator` project role or higher.
*   **Query Parameters**:
    *   `status` (Optional): Filter tasks by lifecycle status:
        *   `unassigned`
        *   `assigned`
        *   `in_review` (corresponds to Review Queue items)
        *   `approved` (finalized ground-truth)
        *   `rejected` (returned for corrections)
*   **Response**: `200 OK` (Array of Task Objects).
