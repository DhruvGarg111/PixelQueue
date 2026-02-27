import { useAnnotationStore } from "../store/annotationStore";

export function AnnotationSidebar() {
    const annotations = useAnnotationStore((s) => s.annotations);
    const selectedId = useAnnotationStore((s) => s.selectedId);
    const selectAnnotation = useAnnotationStore((s) => s.selectAnnotation);
    const updateAnnotation = useAnnotationStore((s) => s.updateAnnotation);
    const removeAnnotation = useAnnotationStore((s) => s.removeAnnotation);

    return (
        <aside className="card sidebar">
            <p className="page-kicker">Inspector</p>
            <h3 className="card-title">
                Annotations{" "}
                <span
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.8rem",
                        opacity: 0.5,
                        fontWeight: 400,
                    }}
                >
                    ({annotations.length})
                </span>
            </h3>
            <p className="card-subtitle">Edit labels, check shape type, and remove invalid regions.</p>
            <div className="annotation-list">
                {annotations.map((item, idx) => (
                    <div key={item.id} className={`annotation-item ${selectedId === item.id ? "selected" : ""}`} onClick={() => selectAnnotation(item.id)}>
                        <div className="annotation-row">
                            <strong style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem" }}>#{idx + 1}</strong>
                            <span className="badge">{item.geometry.type}</span>
                        </div>
                        <input
                            value={item.label}
                            onChange={(e) => updateAnnotation(item.id, { label: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Enter label"
                        />
                        <div className="annotation-meta muted small">
                            <span>{item.source}</span>
                            <span>{item.status}</span>
                            {item.confidence != null && <span>conf {item.confidence.toFixed(2)}</span>}
                        </div>
                        <button
                            type="button"
                            className="danger"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeAnnotation(item.id);
                            }}
                        >
                            Delete
                        </button>
                    </div>
                ))}
                {annotations.length === 0 && <div className="empty-state">No annotations yet. Draw a box or polygon to begin.</div>}
            </div>
        </aside>
    );
}
