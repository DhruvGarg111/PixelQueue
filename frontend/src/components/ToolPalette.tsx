import { useAnnotationStore } from "../store/annotationStore";

const TOOLS: Array<{ id: "select" | "bbox" | "polygon"; label: string }> = [
  { id: "select", label: "Select" },
  { id: "bbox", label: "BBox" },
  { id: "polygon", label: "Polygon" },
];

export function ToolPalette() {
  const tool = useAnnotationStore((s) => s.tool);
  const setTool = useAnnotationStore((s) => s.setTool);

  return (
    <div className="tool-palette">
      {TOOLS.map((item) => (
        <button key={item.id} className={tool === item.id ? "active" : ""} onClick={() => setTool(item.id)}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

