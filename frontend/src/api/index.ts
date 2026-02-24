import { apiRequest } from "./client";
import type { AnnotationBundle, ExportJob, MeResponse, Project, TaskInfo } from "../types/domain";

export async function login(email: string, password: string) {
  return apiRequest<{ access_token: string; refresh_token: string }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe() {
  return apiRequest<MeResponse>("/api/v1/me");
}

export async function listProjects() {
  return apiRequest<Project[]>("/api/v1/projects");
}

export async function createProject(name: string, description?: string) {
  return apiRequest<Project>("/api/v1/projects", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

export async function presignUpload(projectId: string, fileName: string, contentType: string) {
  return apiRequest<{ object_key: string; upload_url: string; expires_in: number }>(
    `/api/v1/projects/${projectId}/images/presign-upload`,
    {
      method: "POST",
      body: JSON.stringify({ file_name: fileName, content_type: contentType }),
    },
  );
}

export async function commitUpload(projectId: string, payload: { object_key: string; width: number; height: number; checksum?: string }) {
  return apiRequest(`/api/v1/projects/${projectId}/images/commit-upload`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function nextTask(projectId: string) {
  return apiRequest<TaskInfo>(`/api/v1/projects/${projectId}/tasks/next`);
}

export async function listTasks(projectId: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<TaskInfo[]>(`/api/v1/projects/${projectId}/tasks${query}`);
}

export async function getAnnotations(imageId: string) {
  return apiRequest<AnnotationBundle>(`/api/v1/images/${imageId}/annotations`);
}

export async function saveAnnotations(imageId: string, payload: { expected_revision: number; annotations: unknown[] }) {
  return apiRequest<AnnotationBundle>(`/api/v1/images/${imageId}/annotations`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function triggerAutoLabel(imageId: string) {
  return apiRequest<{ job_id: string; status: string }>(`/api/v1/images/${imageId}/auto-label`, { method: "POST" });
}

export async function reviewAnnotation(annotationId: string, action: "approve" | "reject", comment?: string) {
  return apiRequest(`/api/v1/annotations/${annotationId}/review`, {
    method: "POST",
    body: JSON.stringify({ action, comment }),
  });
}

export async function createExport(projectId: string, format: "coco" | "yolo") {
  return apiRequest<ExportJob>(`/api/v1/projects/${projectId}/exports`, {
    method: "POST",
    body: JSON.stringify({ format }),
  });
}

export async function listExports(projectId: string) {
  return apiRequest<ExportJob[]>(`/api/v1/projects/${projectId}/exports`);
}
