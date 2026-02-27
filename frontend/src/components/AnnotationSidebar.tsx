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
      <h3 className="card-title">Annotations ({annotations.length})</h3>
      <p className="card-subtitle">Edit labels, inspect geometry type, and remove bad regions.</p>
      <div className="annotation-list">
        {annotations.map((item, idx) => (
          <div key={item.id} className={`annotation-item ${selectedId === item.id ? "selected" : ""}`} onClick={() => selectAnnotation(item.id)}>
            <div className="annotation-row">
              <strong>#{idx + 1}</strong>
              <span className="badge">{item.geometry.type}</span>
            </div>
            <input
              value={item.label}
              onChange={(e) => updateAnnotation(item.id, { label: e.target.value })}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="annotation-meta muted small">
              <span>{item.source}</span>
              <span>{item.status}</span>
            </div>
            <button type="button" className="danger" onClick={(e) => { e.stopPropagation(); removeAnnotation(item.id); }}>
              Delete
            </button>
          </div>
        ))}
        {annotations.length === 0 && <div className="empty-state">No annotations yet. Draw a box or polygon to begin.</div>}
      </div>
    </aside>
  );
}
