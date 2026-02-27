import { describe, expect, it } from "vitest";
import { denormalizeBBox, denormalizePolygon, normalizePoint } from "../components/geometry";

describe("geometry transforms", () => {
    it("normalizes and clamps points", () => {
        const point = normalizePoint(200, -50, 1000, 500);
        expect(point.x).toBe(0.2);
        expect(point.y).toBe(0);
    });

    it("denormalizes bbox correctly", () => {
        const b = denormalizeBBox({ type: "bbox", x: 0.1, y: 0.1, w: 0.2, h: 0.3 }, 1000, 500);
        expect(b).toEqual({ x: 100, y: 50, w: 200, h: 150 });
    });

    it("denormalizes polygon points", () => {
        const points = denormalizePolygon(
            {
                type: "polygon",
                points: [
                    { x: 0.1, y: 0.2 },
                    { x: 0.2, y: 0.3 },
                    { x: 0.3, y: 0.4 },
                ],
            },
            1000,
            500,
        );
        expect(points).toEqual([100, 100, 200, 150, 300, 200]);
    });
});
