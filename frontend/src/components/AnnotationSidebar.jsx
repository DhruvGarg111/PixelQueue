import { useAnnotationStore } from "../store/annotationStore";

export function AnnotationSidebar() {
    const annotations = useAnnotationStore((s) => s.annotations);
    const selectedId = useAnnotationStore((s) => s.selectedId);
    const selectAnnotation = useAnnotationStore((s) => s.selectAnnotation);
    const updateAnnotation = useAnnotationStore((s) => s.updateAnnotation);
    const removeAnnotation = useAnnotationStore((s) => s.removeAnnotation);

    return (
        <aside className="card sidebar" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "1.25rem", overflow: "hidden" }}>
            <div style={{ flexShrink: 0, borderBottom: "1px solid var(--border-strong)", paddingBottom: "1rem", marginBottom: "1rem" }}>
                <p className="page-kicker" style={{ marginBottom: "0.25rem" }}>Inspector</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 className="card-title" style={{ fontSize: "1.25rem", margin: 0 }}>
                        Entities
                    </h3>
                    <span className="badge" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{annotations.length}</span>
                </div>
                <p className="card-subtitle" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>Modify labels and manage valid regions.</p>
            </div>

            <div className="annotation-list" style={{ flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", paddingRight: "0.5rem" }}>
                {annotations.map((item, idx) => (
                    <div
                        key={item.id}
                        className={`annotation-item ${selectedId === item.id ? "selected" : ""}`}
                        onClick={() => selectAnnotation(item.id)}
                        style={{
                            padding: "1rem",
                            background: selectedId === item.id ? "rgba(0, 240, 255, 0.05)" : "var(--bg-inset)",
                            border: selectedId === item.id ? "1px solid var(--brand)" : "1px solid var(--border-subtle)",
                            borderRadius: "var(--radius-sm)",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                            <strong style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.9rem", color: selectedId === item.id ? "var(--brand)" : "var(--text-primary)" }}>
                                EN-{String(idx + 1).padStart(3, '0')}
                            </strong>
                            <span className="badge" style={{ fontSize: "0.65rem", padding: "0.2rem 0.4rem" }}>{item.geometry.type.toUpperCase()}</span>
                        </div>

                        <input
                            value={item.label}
                            onChange={(e) => updateAnnotation(item.id, { label: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Enter classification"
                            style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem", marginBottom: "0.75rem", background: "rgba(0,0,0,0.5)" }}
                        />

                        <div style={{ display: "flex", gap: "0.5rem", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "var(--text-secondary)", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                            <span style={{ textTransform: "uppercase" }}>{item.source}</span>
                            <span style={{ opacity: 0.5 }}>|</span>
                            <span style={{ textTransform: "uppercase", color: item.status === "approved" ? "var(--success)" : item.status === "rejected" ? "var(--danger)" : "var(--warning)" }}>{item.status}</span>
                            {item.confidence != null && (
                                <>
                                    <span style={{ opacity: 0.5 }}>|</span>
                                    <span>CONF: {item.confidence.toFixed(2)}</span>
                                </>
                            )}
                        </div>

                        <button
                            type="button"
                            className="danger ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeAnnotation(item.id);
                            }}
                            style={{ width: "100%", padding: "0.4rem", fontSize: "0.75rem", border: "1px dashed rgba(255, 0, 60, 0.4)" }}
                        >
                            DELETE ENTITY
                        </button>
                    </div>
                ))}

                {annotations.length === 0 && (
                    <div style={{ textAlign: "center", padding: "3rem 1rem", border: "1px dashed var(--border-strong)", borderRadius: "var(--radius-sm)", color: "var(--text-tertiary)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                        <div style={{ fontSize: "2rem", opacity: 0.3 }}>⚲</div>
                        <div style={{ fontSize: "0.85rem", lineHeight: "1.5" }}>No entities active.<br />Draw a region to initialize.</div>
                    </div>
                )}
            </div>
        </aside>
    );
}
