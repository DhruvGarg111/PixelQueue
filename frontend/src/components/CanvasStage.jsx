import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Group, Image as KonvaImage, Layer, Line, Rect, Stage } from "react-konva";
import useImage from "use-image";
import { useAnnotationStore } from "../store/annotationStore";
import { denormalizeBBox, denormalizePolygon, normalizePoint } from "./geometry";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { KeyboardShortcutModal } from "./KeyboardShortcutModal";

const ACTIVE_STROKE = "#0DDFF2"; // primary cyan
const IDLE_STROKE = "rgba(13,223,242,0.4)";
const DRAFT_STROKE = "#A855F7"; // purple-500 for draft to distinguish
const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 5;

function uid() {
    return crypto.randomUUID();
}

function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function CanvasStage({ imageUrl, imageWidth, imageHeight }) {
    const [image] = useImage(imageUrl, "anonymous");
    const tool = useAnnotationStore((s) => s.tool);
    const annotations = useAnnotationStore((s) => s.annotations);
    const selectedId = useAnnotationStore((s) => s.selectedId);
    const addAnnotation = useAnnotationStore((s) => s.addAnnotation);
    const updateAnnotation = useAnnotationStore((s) => s.updateAnnotation);
    const selectAnnotation = useAnnotationStore((s) => s.selectAnnotation);
    const undo = useAnnotationStore((s) => s.undo);
    const redo = useAnnotationStore((s) => s.redo);

    const [draftBox, setDraftBox] = useState(null);
    const [draftPolygon, setDraftPolygon] = useState([]);
    const containerRef = useRef(null);
    const [availableWidth, setAvailableWidth] = useState(980);
    const [availableHeight, setAvailableHeight] = useState(800);

    // --- Zoom & Pan state ---
    const [zoom, setZoom] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

    const zoomIn = useCallback(() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP)), []);
    const zoomOut = useCallback(() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP)), []);
    const zoomReset = useCallback(() => { setZoom(1); setStagePos({ x: 0, y: 0 }); }, []);

    // Wire keyboard shortcuts
    useKeyboardShortcuts({ onZoomIn: zoomIn, onZoomOut: zoomOut, onZoomReset: zoomReset });

    useEffect(() => {
        if (!containerRef.current || typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver((entries) => {
            const width = Math.floor(entries[0]?.contentRect?.width ?? 980);
            const height = Math.floor(entries[0]?.contentRect?.height ?? 800);
            setAvailableWidth(Math.max(320, width - 16));
            setAvailableHeight(Math.max(320, height - 16));
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const { displayWidth, displayHeight } = useMemo(() => {
        if (!imageWidth || !imageHeight) return { displayWidth: 800, displayHeight: 600 };
        const ratio = Math.min(availableWidth / imageWidth, availableHeight / imageHeight);
        return { displayWidth: Math.round(imageWidth * ratio), displayHeight: Math.round(imageHeight * ratio) };
    }, [availableWidth, availableHeight, imageHeight, imageWidth]);

    function stagePoint(evt) {
        const stage = evt.target.getStage();
        const p = stage.getPointerPosition();
        if (!p) return null;
        // Correct for zoom & pan
        return { x: (p.x - stagePos.x) / zoom, y: (p.y - stagePos.y) / zoom };
    }

    function finalizePolygon(points) {
        if (points.length < 3) return;
        const geometry = {
            type: "polygon",
            points: points.map((p) => normalizePoint(p.x, p.y, displayWidth, displayHeight)),
        };
        addAnnotation({ id: uid(), label: "object", geometry, source: "manual", status: "draft", confidence: null });
        setDraftPolygon([]);
    }

    function onMouseDown(evt) {
        const p = stagePoint(evt);
        if (!p) return;
        if (tool === "bbox") {
            setDraftBox({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
            return;
        }
        if (tool === "polygon") {
            if (draftPolygon.length >= 3) {
                const first = draftPolygon[0];
                if (distance(first, { x: p.x, y: p.y }) < 10 / zoom) {
                    finalizePolygon(draftPolygon);
                    return;
                }
            }
            setDraftPolygon((prev) => [...prev, { x: p.x, y: p.y }]);
        }
    }

    function onMouseMove(evt) {
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
        if (w < 5 / zoom || h < 5 / zoom) return;
        const geometry = {
            type: "bbox",
            x: x / displayWidth,
            y: y / displayHeight,
            w: w / displayWidth,
            h: h / displayHeight,
        };
        addAnnotation({ id: uid(), label: "object", geometry, source: "manual", status: "draft", confidence: null });
    }

    function onWheel(evt) {
        evt.evt.preventDefault();
        const delta = evt.evt.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
        // Zoom towards pointer
        const pointer = evt.target.getStage().getPointerPosition();
        if (pointer) {
            const mouseX = (pointer.x - stagePos.x) / zoom;
            const mouseY = (pointer.y - stagePos.y) / zoom;
            setStagePos({
                x: pointer.x - mouseX * newZoom,
                y: pointer.y - mouseY * newZoom,
            });
        }
        setZoom(newZoom);
    }

    const draftPolygonPoints = draftPolygon.flatMap((p) => [p.x, p.y]);
    const canUndo = useAnnotationStore((s) => s._past.length > 0);
    const canRedo = useAnnotationStore((s) => s._future.length > 0);

    return (
        <div className="w-full h-full flex items-center justify-center" ref={containerRef}>
            <div className="relative bg-[#0A1112] rounded overflow-hidden border border-primary/20">
                {/* --- Zoom & Undo toolbar --- */}
                <div className="absolute top-2 right-2 z-10 flex gap-1 p-1 bg-background-dark/80 backdrop-blur rounded border border-primary/20">
                    <button onClick={undo} disabled={!canUndo} className="w-7 h-7 rounded flex items-center justify-center bg-transparent text-primary/50 hover:text-primary hover:bg-primary/5 disabled:opacity-30 transition-colors duration-150" title="Undo (Ctrl+Z)">
                        <span className="material-symbols-outlined text-[16px]">undo</span>
                    </button>
                    <button onClick={redo} disabled={!canRedo} className="w-7 h-7 rounded flex items-center justify-center bg-transparent text-primary/50 hover:text-primary hover:bg-primary/5 disabled:opacity-30 transition-colors duration-150" title="Redo (Ctrl+Y)">
                        <span className="material-symbols-outlined text-[16px]">redo</span>
                    </button>
                    <div className="w-px bg-primary/20 mx-0.5" />
                    <button onClick={zoomOut} className="w-7 h-7 rounded flex items-center justify-center bg-transparent text-primary/50 hover:text-primary hover:bg-primary/5 transition-colors duration-150" title="Zoom Out (Ctrl+-)">
                        <span className="material-symbols-outlined text-[16px]">zoom_out</span>
                    </button>
                    <button onClick={zoomReset} className="h-7 px-2 rounded flex items-center justify-center bg-transparent text-primary/70 font-bold text-[10px] font-mono hover:bg-primary/5" title="Reset Zoom (Ctrl+0)">
                        {Math.round(zoom * 100)}%
                    </button>
                    <button onClick={zoomIn} className="w-7 h-7 rounded flex items-center justify-center bg-transparent text-primary/50 hover:text-primary hover:bg-primary/5 transition-colors duration-150" title="Zoom In (Ctrl++)">
                        <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                    </button>
                    <button onClick={zoomReset} className="w-7 h-7 rounded flex items-center justify-center bg-transparent text-primary/50 hover:text-primary hover:bg-primary/5 transition-colors duration-150" title="Fit to Screen">
                        <span className="material-symbols-outlined text-[16px]">fit_screen</span>
                    </button>
                    <KeyboardShortcutModal />
                </div>

                <Stage
                    width={displayWidth}
                    height={displayHeight}
                    scaleX={zoom}
                    scaleY={zoom}
                    x={stagePos.x}
                    y={stagePos.y}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onDblClick={() => finalizePolygon(draftPolygon)}
                    onWheel={onWheel}
                >
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
                                        strokeWidth={2 / zoom}
                                        draggable={tool === "select"}
                                        onClick={() => selectAnnotation(ann.id)}
                                        onDragEnd={(evt) => {
                                            const nx = evt.target.x() / displayWidth;
                                            const ny = evt.target.y() / displayHeight;
                                            updateAnnotation(ann.id, {
                                                geometry: { ...g, x: Math.max(0, Math.min(1 - g.w, nx)), y: Math.max(0, Math.min(1 - g.h, ny)) },
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
                                        strokeWidth={2 / zoom}
                                        fill="rgba(13,223,242,0.1)"
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
                                dash={[4 / zoom, 4 / zoom]}
                                strokeWidth={2 / zoom}
                            />
                        )}
                        {draftPolygon.length > 1 && <Line points={draftPolygonPoints} stroke={DRAFT_STROKE} strokeWidth={2 / zoom} />}
                    </Layer>
                </Stage>
            </div>
            {tool === "polygon" && draftPolygon.length > 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background-dark/80 backdrop-blur px-4 py-2 rounded text-xs text-primary font-bold border border-primary/20 font-mono">
                    Click to add points. Double-click or click near first point to finish polygon.
                </div>
            )}
            {tool === "bbox" && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background-dark/80 backdrop-blur px-4 py-2 rounded text-xs text-primary font-bold border border-primary/20 font-mono">Drag to create a bounding box. Switch to select tool to reposition.</div>}
        </div>
    );
}
