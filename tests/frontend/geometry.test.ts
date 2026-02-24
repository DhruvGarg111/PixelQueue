import { describe, expect, it } from "vitest";
import { denormalizeBBox, denormalizePolygon, normalizePoint } from "../../frontend/src/components/geometry";

describe("geometry transforms", () => {
  it("normalizes and clamps points", () => {
    const point = normalizePoint(500, -10, 1000, 500);
    expect(point.x).toBe(0.5);
    expect(point.y).toBe(0);
  });

  it("denormalizes bbox", () => {
    const b = denormalizeBBox({ type: "bbox", x: 0.1, y: 0.2, w: 0.3, h: 0.4 }, 1000, 500);
    expect(b.x).toBe(100);
    expect(b.y).toBe(100);
    expect(b.w).toBe(300);
    expect(b.h).toBe(200);
  });

  it("denormalizes polygon", () => {
    const points = denormalizePolygon(
      {
        type: "polygon",
        points: [
          { x: 0.1, y: 0.2 },
          { x: 0.3, y: 0.4 },
          { x: 0.5, y: 0.6 },
        ],
      },
      1000,
      500,
    );
    expect(points).toEqual([100, 100, 300, 200, 500, 300]);
  });
});

