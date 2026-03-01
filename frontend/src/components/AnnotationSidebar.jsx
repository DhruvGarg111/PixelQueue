import { useAnnotationStore } from "../store/annotationStore";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";
import { Trash2, Hash } from "lucide-react";
import { cn } from "../lib/utils";

export function AnnotationSidebar() {
    const annotations = useAnnotationStore((s) => s.annotations);
    const selectedId = useAnnotationStore((s) => s.selectedId);
    const selectAnnotation = useAnnotationStore((s) => s.selectAnnotation);
    const updateAnnotation = useAnnotationStore((s) => s.updateAnnotation);
    const removeAnnotation = useAnnotationStore((s) => s.removeAnnotation);

    return (
        <aside className="flex flex-col h-full overflow-hidden bg-[#020617] border-l border-[rgba(255,255,255,0.06)] relative z-10 w-80 flex-shrink-0">
            <div className="flex-shrink-0 p-5 border-b border-[rgba(255,255,255,0.06)] bg-[#111827]">
                <p className="text-[10px] font-mono uppercase tracking-widest text-ink-faint mb-1">Inspector</p>
                <div className="flex justify-between items-center">
                    <h3 className="text-base font-semibold font-display text-ink tracking-tight m-0">
                        Entities
                    </h3>
                    <Badge variant="secondary" className="font-mono">{annotations.length}</Badge>
                </div>
                <p className="text-xs text-ink-muted mt-2">Modify labels and manage valid regions.</p>
            </div>

            <div className="flex-grow overflow-y-auto flex flex-col gap-3 p-4 bg-[#020617] custom-scrollbar">
                {annotations.map((item, idx) => {
                    const isSelected = selectedId === item.id;
                    return (
                        <div
                            key={item.id}
                            onClick={() => selectAnnotation(item.id)}
                            className={cn(
                                "p-4 rounded-[8px] cursor-pointer transition-colors duration-150 border overflow-hidden",
                                isSelected
                                    ? "bg-[#111827] border-[#3B82F6]"
                                    : "bg-[#020617] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]"
                            )}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <Hash className={cn("w-3.5 h-3.5", isSelected ? "text-[#3B82F6]" : "text-ink-faint")} />
                                    <strong className={cn(
                                        "font-mono text-sm",
                                        isSelected ? "text-ink" : "text-ink-muted"
                                    )}>
                                        EN-{String(idx + 1).padStart(3, '0')}
                                    </strong>
                                </div>
                                <Badge variant="secondary" className="text-[9px] uppercase tracking-wider py-0.5 px-1.5 h-auto rounded">
                                    {item.geometry.type}
                                </Badge>
                            </div>

                            <Input
                                value={item.label}
                                onChange={(e) => updateAnnotation(item.id, { label: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Enter classification"
                                className="mb-3 h-8 text-xs bg-[#1F2937] border-transparent"
                            />

                            <div className="flex flex-wrap gap-x-2 gap-y-1 font-mono text-[10px] text-ink-muted mb-4">
                                <span className="uppercase">{item.source}</span>
                                <span className="text-ink-faint">|</span>
                                <span className={cn(
                                    "uppercase font-medium",
                                    item.status === "approved" ? "text-success" :
                                        item.status === "rejected" ? "text-danger" : "text-warning"
                                )}>
                                    {item.status}
                                </span>
                                {item.confidence != null && (
                                    <>
                                        <span className="text-ink-faint">|</span>
                                        <span>CONF: {item.confidence.toFixed(2)}</span>
                                    </>
                                )}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!isSelected}
                                className={cn(
                                    "w-full h-8 text-[10px] tracking-wider uppercase font-semibold border-transparent transition-colors duration-150",
                                    !isSelected && "opacity-0 pointer-events-none",
                                    isSelected && "border-[rgba(239,68,68,0.3)] text-danger hover:bg-[rgba(239,68,68,0.1)] hover:border-[#EF4444]"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeAnnotation(item.id);
                                }}
                            >
                                <Trash2 className="w-3 h-3 mr-1.5" /> Delete Entity
                            </Button>
                        </div>
                    );
                })}

                {annotations.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-[rgba(255,255,255,0.06)] rounded-[8px] bg-[#111827] text-ink-muted gap-3 mt-4">
                        <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.04)] flex items-center justify-center text-ink-faint">
                            <Hash className="w-5 h-5 mx-0" />
                        </div>
                        <div className="text-sm font-medium text-ink">No entities active.</div>
                        <div className="text-xs">Draw a region on the canvas.</div>
                    </div>
                )}
            </div>
        </aside>
    );
}
