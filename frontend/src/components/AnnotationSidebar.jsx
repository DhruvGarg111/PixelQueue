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
        <aside className="flex flex-col h-full overflow-hidden bg-surface border-r border-border/80 shadow-[1px_0_5px_rgba(0,0,0,0.02)] relative z-10 w-80 flex-shrink-0">
            <div className="flex-shrink-0 p-5 border-b border-border/60 bg-gray-50/50">
                <p className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1">Inspector</p>
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold font-display text-ink tracking-tight m-0">
                        Entities
                    </h3>
                    <Badge variant="secondary" className="font-mono">{annotations.length}</Badge>
                </div>
                <p className="text-xs text-ink-muted mt-2">Modify labels and manage valid regions.</p>
            </div>

            <div className="flex-grow overflow-y-auto flex flex-col gap-3 p-4 bg-gray-50/30 custom-scrollbar">
                {annotations.map((item, idx) => {
                    const isSelected = selectedId === item.id;
                    return (
                        <div
                            key={item.id}
                            onClick={() => selectAnnotation(item.id)}
                            className={cn(
                                "p-4 rounded-xl cursor-pointer transition-all duration-200 border relative overflow-hidden group",
                                isSelected
                                    ? "bg-brand/5 border-brand ring-1 ring-brand/50 shadow-sm"
                                    : "bg-surface border-border hover:border-brand/40 hover:shadow-sm"
                            )}
                        >
                            {isSelected && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-brand rounded-l-xl" />
                            )}

                            <div className="flex justify-between items-start mb-3 pl-1">
                                <div className="flex items-center gap-2">
                                    <Hash className={cn("w-3.5 h-3.5", isSelected ? "text-brand" : "text-ink-faint")} />
                                    <strong className={cn(
                                        "font-mono text-sm",
                                        isSelected ? "text-brand" : "text-ink"
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
                                className="mb-3 h-8 text-xs bg-white text-ink border-border shadow-none focus-visible:ring-1"
                            />

                            <div className="flex flex-wrap gap-x-2 gap-y-1 font-mono text-[10px] text-ink-muted mb-4 pl-1">
                                <span className="uppercase">{item.source}</span>
                                <span className="text-border/80">|</span>
                                <span className={cn(
                                    "uppercase font-medium",
                                    item.status === "approved" ? "text-success" :
                                        item.status === "rejected" ? "text-danger" : "text-warning"
                                )}>
                                    {item.status}
                                </span>
                                {item.confidence != null && (
                                    <>
                                        <span className="text-border/80">|</span>
                                        <span>CONF: {item.confidence.toFixed(2)}</span>
                                    </>
                                )}
                            </div>

                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={!isSelected}
                                className={cn(
                                    "w-full h-7 text-[10px] tracking-wider uppercase font-semibold border border-transparent transition-all",
                                    !isSelected && "opacity-0 group-hover:opacity-100 bg-red-50 text-red-600 hover:bg-danger hover:text-white"
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
                    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border/80 rounded-xl bg-surface/50 text-ink-muted gap-3 mt-4">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-ink-faint">
                            <Hash className="w-5 h-5 mx-0" />
                        </div>
                        <div className="text-sm font-medium">No entities active.</div>
                        <div className="text-xs">Draw a region on the canvas to initialize tracking.</div>
                    </div>
                )}
            </div>
        </aside>
    );
}
