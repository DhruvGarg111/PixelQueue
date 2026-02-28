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
        <div style={{ display: "flex", gap: "0.25rem", padding: "0.25rem", background: "var(--bg-inset)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
            {TOOLS.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    onClick={() => setTool(item.id)}
                    style={{
                        padding: "0.5rem 0.75rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: tool === item.id ? "rgba(0, 240, 255, 0.1)" : "transparent",
                        border: "none",
                        borderRadius: "var(--radius-xs)",
                        color: tool === item.id ? "var(--brand)" : "var(--text-secondary)",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                    }}
                >
                    <span style={{ fontSize: "0.85rem", fontWeight: tool === item.id ? "600" : "400" }}>{item.label}</span>
                    <span style={{ fontSize: "0.65rem", fontFamily: "'JetBrains Mono', monospace", opacity: 0.5, borderLeft: "1px solid currentColor", paddingLeft: "0.5rem" }}>{item.hint}</span>
                </button>
            ))}
        </div>
    );
}
