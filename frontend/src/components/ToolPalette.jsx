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
        <div className="flex gap-1 p-1 bg-[#020617] rounded-[8px] border border-[rgba(255,255,255,0.06)]">
            {TOOLS.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    onClick={() => setTool(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] border-none cursor-pointer transition-colors duration-150 ${tool === item.id
                            ? "bg-[rgba(59,130,246,0.12)] text-[#3B82F6]"
                            : "bg-transparent text-ink-muted hover:bg-[rgba(255,255,255,0.04)] hover:text-ink"
                        }`}
                >
                    <span className={`text-sm ${tool === item.id ? "font-semibold" : "font-normal"}`}>{item.label}</span>
                    <span className="text-[10px] font-mono opacity-50 border-l border-current pl-2">{item.hint}</span>
                </button>
            ))}
        </div>
    );
}
