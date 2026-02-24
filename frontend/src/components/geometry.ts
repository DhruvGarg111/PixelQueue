import type { BBoxGeometry, Point, PolygonGeometry } from "../types/domain";

export function normalizePoint(x: number, y: number, width: number, height: number): Point {
  return {
    x: Math.max(0, Math.min(1, x / width)),
    y: Math.max(0, Math.min(1, y / height)),
  };
}

export function denormalizeBBox(geometry: BBoxGeometry, width: number, height: number) {
  return {
    x: geometry.x * width,
    y: geometry.y * height,
    w: geometry.w * width,
    h: geometry.h * height,
  };
}

export function denormalizePolygon(geometry: PolygonGeometry, width: number, height: number): number[] {
  return geometry.points.flatMap((p) => [p.x * width, p.y * height]);
}

