import { useAnnotationStore } from "../store/annotationStore";

const TOOLS = [
    { id: "select", label: "Select", hint: "Move", icon: "near_me" },
    { id: "bbox", label: "BBox", hint: "Rect", icon: "crop_square" },
    { id: "polygon", label: "Polygon", hint: "Mask", icon: "polyline" },
];

export function ToolPalette() {
    const tool = useAnnotationStore((s) => s.tool);
    const setTool = useAnnotationStore((s) => s.setTool);

    return (
        <div className="flex gap-1 p-1 bg-background-dark rounded border border-primary/20 shadow-none">
            {TOOLS.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    onClick={() => setTool(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] border-none cursor-pointer transition-colors duration-150 ${tool === item.id
                        ? "bg-primary/20 text-primary"
                        : "bg-transparent text-slate-400 hover:bg-primary/5 hover:text-slate-100"
                        }`}
                >
                    <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                    <span className={`text-sm ${tool === item.id ? "font-bold" : "font-normal"}`}>{item.label}</span>
                    <span className="text-[10px] font-mono opacity-50 border-l border-current pl-2">{item.hint}</span>
                </button>
            ))}
        </div>
    );
}
