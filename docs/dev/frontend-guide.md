# Frontend Development Guide

This guide describes the client-side architecture, state stores, coordinate geometry scaling, and custom hook wrappers powering the PixelQueue React frontend client.

---

## 📂 Frontend Architecture

The frontend is a lightweight Single Page Application built using React, Vite, and TailwindCSS:

```
frontend/src/
├── api/             # API client wrappers and endpoint routes
│   ├── client.js    # Fetch client with CSRF injection and auto-refresh interceptors
│   └── index.js     # API function bindings
├── components/      # Reusable UI parts and canvas stages
│   ├── CanvasStage.jsx        # KonvaJS interactive annotation canvas
│   ├── AnnotationSidebar.jsx  # Labels manager and revision history panel
│   ├── ToolPalette.jsx        # Drawing tool button palette
│   └── ui/                    # Base visual primitives (Button, Input, Badge)
├── hooks/           # Component-level side effects encapsulation
│   ├── useAnnotationTask.js   # Canvas fetch and save state coordinator
│   ├── useKeyboardShortcuts.js# Global hotkey listener registry
│   ├── useImageUpload.js      # Direct S3 multi-file uploader
│   └── useReviewQueue.js      # Quality assurance review actions
├── layouts/         # Page layout wrappers (Sidebar navigation)
├── pages/           # View route endpoints (Projects, Annotate, Review)
└── store/           # Global application state (Zustand)
    ├── authStore.js           # Session and profile state
    └── annotationStore.js     # Active canvas polygons list
```

---

## 🎨 Component Hierarchy: Workspace

Inside the workspace page `/projects/{id}/annotate` (`AnnotatePage.jsx`), the workspace is organized as follows:

```
AnnotatePage (Fetches active Task via useAnnotationTask)
 ├── Sidebar (Global app navigation)
 ├── Main Layout
 │    ├── ToolPalette (Tool selection: Select, Polygon, Bounding Box, Zoom)
 │    ├── CanvasStage (Konva Stage -> Image, active lines, draft shapes)
 │    └── AnnotationSidebar (List of objects, polygon label tags, save/submit buttons)
```

---

## 🧠 Zustand Store Architecture

We use **Zustand** for lightweight, performant state management.

### 1. `authStore.js`
Tracks active user session state, email, name, global role permissions, and token refresh intervals.
```javascript
export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  setSession: (user) => set({ user, isAuthenticated: !!user }),
  clearSession: () => set({ user: null, isAuthenticated: false }),
}));
```

### 2. `annotationStore.js`
Manages the active polygons, undo/redo stacks, selected annotations, active draw tools, and current revision.
*   **Key State Variables**:
    *   `annotations`: Array of polygons rendered on the canvas.
    *   `selectedId`: The ID of the polygon currently highlighted or active.
    *   `tool`: Active canvas mode (`select`, `polygon`, `bbox`).
    *   `history`: Undo/redo stack (snapshots of the `annotations` array).
*   **Actions**: `setAnnotations`, `addAnnotation`, `updateAnnotation`, `deleteAnnotation`, `undo`, `redo`.

---

## 📐 Canvas Coordinate Calculations

Canvas drawings must scale independently of the client's screen size or window aspect ratio. PixelQueue solves this by storing coordinates normalized to the image's original dimensions and translating them dynamically in the UI.

### 1. Image Scaling (Letterbox Fit)
`CanvasStage.jsx` calculates the bounding box needed to fit the image on the screen:
```javascript
const ratio = Math.min(availableWidth / imageWidth, availableHeight / imageHeight);
const displayWidth = Math.round(imageWidth * ratio);
const displayHeight = Math.round(imageHeight * ratio);
```

### 2. Coordinates Normalization (`geometry.js`)
When drawing vertices, the screen-space coordinates are normalized relative to the display size before sending them to the API:
```javascript
export function normalizePoint(x, y, displayWidth, displayHeight) {
  return {
    x: x / displayWidth,
    y: y / displayHeight
  };
}
```

### 3. Coordinates Denormalization (`geometry.js`)
When annotations are loaded from the database, the API's normalized values (between 0.0 and 1.0) are scaled back to screen-space coordinates:
```javascript
export function denormalizePolygon(points, displayWidth, displayHeight) {
  return points.map(p => ({
    x: p.x * displayWidth,
    y: p.y * displayHeight
  }));
}
```

### 4. Stage Zoom and Panning
Konva Stage zoom levels are tracked via a `zoom` scale state. Pointer coordinates are adjusted to account for current zoom and pan positions:
```javascript
function stagePoint(evt) {
  const stage = evt.target.getStage();
  const p = stage.getPointerPosition();
  if (!p) return null;
  return {
    x: (p.x - stagePos.x) / zoom,
    y: (p.y - stagePos.y) / zoom
  };
}
```

---

## 🔗 Custom React Hooks

PixelQueue encapsulates API side-effects into reusable custom hooks:

| Hook | File Path | Responsibility |
|---|---|---|
| `useAnnotationTask` | `src/hooks/useAnnotationTask.js` | Fetches next task, saves annotation changes, triggers auto-labeling, and locks tasks. |
| `useReviewQueue` | `src/hooks/useReviewQueue.js` | Handles task reviews (accept/reject) and retrieves review queues. |
| `useImageUpload` | `src/hooks/useImageUpload.js` | Direct S3 uploads using pre-signed URLs and commits metadata to the DB. |
| `useProjectList` | `src/hooks/useProjectList.js` | Handles project creation, list updates, and membership actions. |
| `useExportsList` | `src/hooks/useExportsList.js` | Subscribes to export status polling and handles ZIP downloads. |
| `useKeyboardShortcuts`| `src/hooks/useKeyboardShortcuts.js` | Binds hotkeys (`Ctrl+Z`, `Ctrl+Y`, `Esc`, `Space` for panning, `+`/`-` for zoom). |
