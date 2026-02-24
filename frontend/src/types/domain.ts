export type ProjectRole = "annotator" | "reviewer" | "admin";
export type TaskStatus = "open" | "in_progress" | "in_review" | "done";
export type AnnotationStatus = "draft" | "approved" | "rejected";
export type AnnotationSource = "manual" | "auto";
export type ExportFormat = "coco" | "yolo";

export type Point = { x: number; y: number };
export type BBoxGeometry = { type: "bbox"; x: number; y: number; w: number; h: number };
export type PolygonGeometry = { type: "polygon"; points: Point[] };
export type Geometry = BBoxGeometry | PolygonGeometry;

export interface UserMembership {
  project_id: string;
  role: ProjectRole;
}

export interface MeResponse {
  id: string;
  email: string;
  full_name: string;
  global_role: ProjectRole;
  memberships: UserMembership[];
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  created_by: string;
  created_at: string;
  my_role?: ProjectRole | null;
}

export interface ImageInfo {
  id: string;
  project_id: string;
  object_key: string;
  width: number;
  height: number;
  checksum?: string | null;
  annotation_revision: number;
  uploaded_by: string;
  created_at: string;
  download_url?: string | null;
}

export interface TaskInfo {
  id: string;
  project_id: string;
  image_id: string;
  status: TaskStatus;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
  image?: ImageInfo | null;
}

export interface AnnotationItem {
  id: string;
  project_id: string;
  image_id: string;
  label: string;
  geometry: Geometry;
  source: AnnotationSource;
  status: AnnotationStatus;
  confidence?: number | null;
  revision: number;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface AnnotationBundle {
  image_id: string;
  revision: number;
  task_status?: TaskStatus | null;
  annotations: AnnotationItem[];
}

export interface ExportJob {
  id: string;
  project_id: string;
  format: ExportFormat;
  status: "queued" | "running" | "completed" | "failed";
  object_key?: string | null;
  summary_jsonb: Record<string, unknown>;
  error_text?: string | null;
  created_at: string;
  finished_at?: string | null;
  download_url?: string | null;
}

