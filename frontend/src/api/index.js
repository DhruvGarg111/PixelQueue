import { apiRequest } from "./client";

export async function login(email, password) {
    return apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

export async function getMe() {
    return apiRequest("/api/v1/me");
}

export async function listProjects() {
    return apiRequest("/api/v1/projects");
}

export async function createProject(name, description) {
    return apiRequest("/api/v1/projects", {
        method: "POST",
        body: JSON.stringify({ name, description }),
    });
}

export async function presignUpload(projectId, fileName, contentType) {
    return apiRequest(
        `/api/v1/projects/${projectId}/images/presign-upload`,
        {
            method: "POST",
            body: JSON.stringify({ file_name: fileName, content_type: contentType }),
        },
    );
}

export async function commitUpload(projectId, payload) {
    return apiRequest(`/api/v1/projects/${projectId}/images/commit-upload`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function nextTask(projectId) {
    return apiRequest(`/api/v1/projects/${projectId}/tasks/next`);
}

export async function listTasks(projectId, status) {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiRequest(`/api/v1/projects/${projectId}/tasks${query}`);
}

export async function getAnnotations(imageId) {
    return apiRequest(`/api/v1/images/${imageId}/annotations`);
}

export async function saveAnnotations(imageId, payload) {
    return apiRequest(`/api/v1/images/${imageId}/annotations`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function triggerAutoLabel(imageId) {
    return apiRequest(`/api/v1/images/${imageId}/auto-label`, { method: "POST" });
}

export async function reviewAnnotation(annotationId, action, comment) {
    return apiRequest(`/api/v1/annotations/${annotationId}/review`, {
        method: "POST",
        body: JSON.stringify({ action, comment }),
    });
}

export async function createExport(projectId, format) {
    return apiRequest(`/api/v1/projects/${projectId}/exports`, {
        method: "POST",
        body: JSON.stringify({ format }),
    });
}

export async function listExports(projectId) {
    return apiRequest(`/api/v1/projects/${projectId}/exports`);
}
