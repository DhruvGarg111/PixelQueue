import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Image as KonvaImage, Layer, Line, Rect, Stage } from "react-konva";
import useImage from "use-image";
import { useAnnotationStore } from "../store/annotationStore";
import type { BBoxGeometry, Point, PolygonGeometry } from "../types/domain";
import { denormalizeBBox, denormalizePolygon, normalizePoint } from "./geometry";

type Props = {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
};

type DraftBox = { x1: number; y1: number; x2: number; y2: number } | null;
const ACTIVE_STROKE = "#ef4444";
const IDLE_STROKE = "#0ea5a4";
const DRAFT_STROKE = "#0f6d8a";

function uid() {
  return crypto.randomUUID();
}

function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function CanvasStage({ imageUrl, imageWidth, imageHeight }: Props) {
  const [image] = useImage(imageUrl, "anonymous");
  const tool = useAnnotationStore((s) => s.tool);
  const annotations = useAnnotationStore((s) => s.annotations);
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const addAnnotation = useAnnotationStore((s) => s.addAnnotation);
  const updateAnnotation = useAnnotationStore((s) => s.updateAnnotation);
  const selectAnnotation = useAnnotationStore((s) => s.selectAnnotation);

  const [draftBox, setDraftBox] = useState<DraftBox>(null);
  const [draftPolygon, setDraftPolygon] = useState<Point[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState(980);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const width = Math.floor(entries[0]?.contentRect?.width ?? 980);
      setAvailableWidth(Math.max(320, width - 8));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { displayWidth, displayHeight } = useMemo(() => {
    const maxWidth = Math.min(1200, availableWidth);
    if (imageWidth <= maxWidth) {
      return { displayWidth: imageWidth, displayHeight: imageHeight };
    }
    const ratio = maxWidth / imageWidth;
    return { displayWidth: Math.round(imageWidth * ratio), displayHeight: Math.round(imageHeight * ratio) };
  }, [availableWidth, imageHeight, imageWidth]);

  function stagePoint(evt: any) {
    const stage = evt.target.getStage();
    const p = stage.getPointerPosition();
    return p ? { x: p.x, y: p.y } : null;
  }

  function finalizePolygon(points: Point[]) {
    if (points.length < 3) return;
    const geometry: PolygonGeometry = {
      type: "polygon",
      points: points.map((p) => normalizePoint(p.x, p.y, displayWidth, displayHeight)),
    };
    addAnnotation({
      id: uid(),
      label: "object",
      geometry,
      source: "manual",
      status: "draft",
      confidence: null,
    });
    setDraftPolygon([]);
  }

  function onMouseDown(evt: any) {
    const p = stagePoint(evt);
    if (!p) return;
    if (tool === "bbox") {
      setDraftBox({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
      return;
    }
    if (tool === "polygon") {
      if (draftPolygon.length >= 3) {
        const first = draftPolygon[0];
        const current = { x: p.x, y: p.y };
        if (distance(first, current) < 10) {
          finalizePolygon(draftPolygon);
          return;
        }
      }
      setDraftPolygon((prev) => [...prev, { x: p.x, y: p.y }]);
    }
  }

  function onMouseMove(evt: any) {
    if (!draftBox || tool !== "bbox") return;
    const p = stagePoint(evt);
    if (!p) return;
    setDraftBox((prev) => (prev ? { ...prev, x2: p.x, y2: p.y } : null));
  }

  function onMouseUp() {
    if (!draftBox || tool !== "bbox") return;
    const x = Math.min(draftBox.x1, draftBox.x2);
    const y = Math.min(draftBox.y1, draftBox.y2);
    const w = Math.abs(draftBox.x2 - draftBox.x1);
    const h = Math.abs(draftBox.y2 - draftBox.y1);
    setDraftBox(null);
    if (w < 5 || h < 5) return;
    const geometry: BBoxGeometry = {
      type: "bbox",
      x: x / displayWidth,
      y: y / displayHeight,
      w: w / displayWidth,
      h: h / displayHeight,
    };
    addAnnotation({
      id: uid(),
      label: "object",
      geometry,
      source: "manual",
      status: "draft",
      confidence: null,
    });
  }

  const draftPolygonPoints = draftPolygon.flatMap((p) => [p.x, p.y]);

  return (
    <div className="canvas-wrap" ref={containerRef}>
      <div className="stage-shell">
        <Stage width={displayWidth} height={displayHeight} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onDblClick={() => finalizePolygon(draftPolygon)}>
          <Layer>
            {image && <KonvaImage image={image} width={displayWidth} height={displayHeight} />}
            {annotations.map((ann) => {
              if (ann.geometry.type === "bbox") {
                const g = ann.geometry;
                const bbox = denormalizeBBox(g, displayWidth, displayHeight);
                return (
                  <Rect
                    key={ann.id}
                    x={bbox.x}
                    y={bbox.y}
                    width={bbox.w}
                    height={bbox.h}
                    stroke={selectedId === ann.id ? ACTIVE_STROKE : IDLE_STROKE}
                    strokeWidth={2}
                    draggable={tool === "select"}
                    onClick={() => selectAnnotation(ann.id)}
                    onDragEnd={(evt) => {
                      const nx = evt.target.x() / displayWidth;
                      const ny = evt.target.y() / displayHeight;
                      updateAnnotation(ann.id, {
                        geometry: {
                          ...g,
                          x: Math.max(0, Math.min(1 - g.w, nx)),
                          y: Math.max(0, Math.min(1 - g.h, ny)),
                        },
                      });
                    }}
                  />
                );
              }

              const g = ann.geometry;
              const points = denormalizePolygon(g, displayWidth, displayHeight);
              return (
                <Group
                  key={ann.id}
                  draggable={tool === "select"}
                  onClick={() => selectAnnotation(ann.id)}
                  onDragEnd={(evt) => {
                    const dx = evt.target.x();
                    const dy = evt.target.y();
                    evt.target.x(0);
                    evt.target.y(0);
                    updateAnnotation(ann.id, {
                      geometry: {
                        ...g,
                        points: g.points.map((pt) => ({
                          x: Math.max(0, Math.min(1, pt.x + dx / displayWidth)),
                          y: Math.max(0, Math.min(1, pt.y + dy / displayHeight)),
                        })),
                      },
                    });
                  }}
                >
                  <Line
                    points={points}
                    closed
                    stroke={selectedId === ann.id ? ACTIVE_STROKE : IDLE_STROKE}
                    strokeWidth={2}
                    fill="rgba(14,165,164,0.16)"
                  />
                </Group>
              );
            })}
            {draftBox && (
              <Rect
                x={Math.min(draftBox.x1, draftBox.x2)}
                y={Math.min(draftBox.y1, draftBox.y2)}
                width={Math.abs(draftBox.x2 - draftBox.x1)}
                height={Math.abs(draftBox.y2 - draftBox.y1)}
                stroke={DRAFT_STROKE}
                dash={[4, 4]}
                strokeWidth={2}
              />
            )}
            {draftPolygon.length > 1 && <Line points={draftPolygonPoints} stroke={DRAFT_STROKE} strokeWidth={2} />}
          </Layer>
        </Stage>
      </div>
      {tool === "polygon" && draftPolygon.length > 0 && (
        <div className="polygon-hint">
          Click to add points. Double-click or click near first point to finish polygon.
        </div>
      )}
      {tool === "bbox" && <div className="polygon-hint">Drag to create a bounding box. Switch to select tool to reposition.</div>}
    </div>
  );
}
