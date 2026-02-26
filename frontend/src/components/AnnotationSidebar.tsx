import { useAnnotationStore } from "../store/annotationStore";

export function AnnotationSidebar() {
  const annotations = useAnnotationStore((s) => s.annotations);
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const selectAnnotation = useAnnotationStore((s) => s.selectAnnotation);
  const updateAnnotation = useAnnotationStore((s) => s.updateAnnotation);
  const removeAnnotation = useAnnotationStore((s) => s.removeAnnotation);

  return (
    <aside className="card sidebar">
      <h3>Annotations ({annotations.length})</h3>
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
            <div className="annotation-row">
              <span>{item.source}</span>
              <span>{item.status}</span>
            </div>
            <button type="button" className="danger" onClick={(e) => { e.stopPropagation(); removeAnnotation(item.id); }}>
              Delete
            </button>
          </div>
        ))}
        {annotations.length === 0 && <p className="muted">No annotations yet.</p>}
      </div>
    </aside>
  );
}
