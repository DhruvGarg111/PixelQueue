export function normalizePoint(x, y, width, height) {
    return {
        x: Math.max(0, Math.min(1, x / width)),
        y: Math.max(0, Math.min(1, y / height)),
    };
}

export function denormalizeBBox(geometry, width, height) {
    return {
        x: geometry.x * width,
        y: geometry.y * height,
        w: geometry.w * width,
        h: geometry.h * height,
    };
}

export function denormalizePolygon(geometry, width, height) {
    return geometry.points.flatMap((p) => [p.x * width, p.y * height]);
}
