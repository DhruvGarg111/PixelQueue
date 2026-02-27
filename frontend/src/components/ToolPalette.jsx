import { useAnnotationStore } from "../store/annotationStore";

const TOOLS = [
    { id: "select", label: "Select", hint: "Move" },
    { id: "bbox", label: "BBox", hint: "Rect" },
    { id: "polygon", label: "Polygon", hint: "Mask" },
];

export function ToolPalette() {
    const tool = useAnnotationStore((s) => s.tool);
    const setTool = useAnnotationStore((s) => s.setTool);

    return (
        <div className="tool-palette">
            {TOOLS.map((item) => (
                <button key={item.id} type="button" className={tool === item.id ? "active" : ""} onClick={() => setTool(item.id)}>
                    <span>{item.label}</span>
                    <small>{item.hint}</small>
                </button>
            ))}
        </div>
    );
}
