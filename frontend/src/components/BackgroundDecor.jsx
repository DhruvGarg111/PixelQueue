/**
 * BackgroundDecor — Pixel-themed SVG decorations for AI infrastructure aesthetic.
 * Fixed layer at z-index:1, pointer-events:none. Purely decorative.
 * 
 * IMPROVED: Uses corner-anchored responsive relative SVGs rather than 
 * a static 1920x1080 viewBox stretching, avoiding any clipping on ultrawide 
 * or tall displays. Opacities increased and textual decals added.
 */

const BLUE = "#3B82F6";
const CYAN = "#06B6D4";
const VIOLET = "#8B5CF6";

/* ── Pixel Square Cluster ───────────────────────────── */
function PixelCluster({ x, y, color, opacity = 0.2, size = 8, gap = 2 }) {
    const cells = [
        [0, 0], [1, 0], [2, 0],
        [0, 1], [2, 1],
        [0, 2], [1, 2],
    ];
    return (
        <g transform={`translate(${x},${y})`} opacity={opacity}>
            {cells.map(([cx, cy], i) => (
                <rect key={i} x={cx * (size + gap)} y={cy * (size + gap)} width={size} height={size} fill={color} />
            ))}
        </g>
    );
}

/* ── L-shaped pixel block ───────────────────────────── */
function PixelL({ x, y, color, opacity = 0.18, size = 6, gap = 2 }) {
    const cells = [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]];
    return (
        <g transform={`translate(${x},${y})`} opacity={opacity}>
            {cells.map(([cx, cy], i) => (
                <rect key={i} x={cx * (size + gap)} y={cy * (size + gap)} width={size} height={size} fill={color} />
            ))}
        </g>
    );
}

/* ── Single scattered pixels ────────────────────────── */
function ScatteredPixels({ x, y, color, opacity = 0.15, size = 5 }) {
    const dots = [[0, 0], [12, 5], [6, 18], [20, 10], [25, 22], [8, 30], [18, 28], [32, 4], [30, 18]];
    return (
        <g transform={`translate(${x},${y})`} opacity={opacity}>
            {dots.map(([dx, dy], i) => (
                <rect key={i} x={dx} y={dy} width={size} height={size} fill={color} />
            ))}
        </g>
    );
}

/* ── Bounding Box Outline (annotation style) ────────── */
function BBoxOutline({ x, y, w, h, color, opacity = 0.15 }) {
    return (
        <g opacity={opacity}>
            <rect x={x} y={y} width={w} height={h} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="5 3" />
            {[[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([cx, cy], i) => (
                <rect key={i} x={cx - 3} y={cy - 3} width={6} height={6} fill={color} />
            ))}
        </g>
    );
}

/* ── Large Square Frame ─────────────────────────────── */
function SquareFrame({ x, y, size, color, opacity = 0.12 }) {
    return <rect x={x} y={y} width={size} height={size} fill="none" stroke={color} strokeWidth="1.2" opacity={opacity} />;
}

/* ── Bracket corners (like selection handles) ───────── */
function BracketCorners({ x, y, size = 60, color, opacity = 0.15 }) {
    const L = 14;
    return (
        <g transform={`translate(${x},${y})`} opacity={opacity}>
            <polyline points={`0,${L} 0,0 ${L},0`} fill="none" stroke={color} strokeWidth="1.5" />
            <polyline points={`${size - L},0 ${size},0 ${size},${L}`} fill="none" stroke={color} strokeWidth="1.5" />
            <polyline points={`0,${size - L} 0,${size} ${L},${size}`} fill="none" stroke={color} strokeWidth="1.5" />
            <polyline points={`${size - L},${size} ${size},${size} ${size},${size - L}`} fill="none" stroke={color} strokeWidth="1.5" />
        </g>
    );
}

/* ── Node / Dot Cluster ─────────────────────────────── */
function NodeCluster({ x, y, color, opacity = 0.18 }) {
    const nodes = [{ dx: 0, dy: 0 }, { dx: 30, dy: -16 }, { dx: 56, dy: 4 }, { dx: 22, dy: 32 }, { dx: 50, dy: 40 }];
    const edges = [[0, 1], [1, 2], [0, 3], [3, 4], [2, 4]];
    return (
        <g transform={`translate(${x},${y})`} opacity={opacity}>
            {edges.map(([a, b], i) => (
                <line key={`e${i}`} x1={nodes[a].dx} y1={nodes[a].dy} x2={nodes[b].dx} y2={nodes[b].dy} stroke={color} strokeWidth="1.2" />
            ))}
            {nodes.map((n, i) => <circle key={`n${i}`} cx={n.dx} cy={n.dy} r={3} fill={color} />)}
        </g>
    );
}

/* ── Larger graph network ───────────────────────────── */
function GraphNetwork({ x, y, color, opacity = 0.15 }) {
    const nodes = [{ dx: 0, dy: 20 }, { dx: 35, dy: 0 }, { dx: 70, dy: 15 }, { dx: 50, dy: 45 }, { dx: 90, dy: 40 }, { dx: 20, dy: 50 }, { dx: 80, dy: 65 }];
    const edges = [[0, 1], [1, 2], [2, 4], [0, 5], [5, 3], [3, 4], [3, 6], [4, 6]];
    return (
        <g transform={`translate(${x},${y})`} opacity={opacity}>
            {edges.map(([a, b], i) => (
                <line key={`e${i}`} x1={nodes[a].dx} y1={nodes[a].dy} x2={nodes[b].dx} y2={nodes[b].dy} stroke={color} strokeWidth="1" />
            ))}
            {nodes.map((n, i) => <circle key={`n${i}`} cx={n.dx} cy={n.dy} r={2.5} fill={color} />)}
        </g>
    );
}

/* ── Crosshair Marker ───────────────────────────────── */
function Crosshair({ x, y, size = 22, color, opacity = 0.15 }) {
    const h = size / 2;
    return (
        <g transform={`translate(${x},${y})`} opacity={opacity}>
            <line x1={-h} y1={0} x2={h} y2={0} stroke={color} strokeWidth="1.2" />
            <line x1={0} y1={-h} x2={0} y2={h} stroke={color} strokeWidth="1.2" />
            <circle cx={0} cy={0} r={h * 0.6} fill="none" stroke={color} strokeWidth="1" />
        </g>
    );
}

/* ── Technical Monospace Text ───────────────────────── */
function TechText({ x, y, text, color, opacity = 0.25 }) {
    return (
        <text
            x={x} y={y}
            fill={color}
            opacity={opacity}
            fontSize="10"
            fontFamily="'JetBrains Mono', monospace"
            letterSpacing="0.05em"
            fontWeight="bold"
        >
            {text}
        </text>
    );
}

/* ── Dashed horizontal scan line ────────────────────── */
function ScanLine({ y, color, opacity = 0.1 }) {
    return <line x1="0" y1={y} x2="100%" y2={y} stroke={color} strokeWidth="0.8" strokeDasharray="8 12" opacity={opacity} />;
}

/* ═══════════════════════════════════════════════════════
   Main Export
   ═══════════════════════════════════════════════════════ */
export function BackgroundDecor() {
    return (
        <div
            aria-hidden="true"
            className="fixed inset-0 overflow-hidden"
            style={{ pointerEvents: "none", zIndex: 1 }}
        >
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>

                {/* ═══ GLOBALS ═══ */}
                {/* 
                  Shift scanlines 280px to the right to clear the sidebar nicely,
                  but letting them span to the dynamic right edge (`100%`) 
                */}
                <g transform="translate(280, 0)">
                    <ScanLine y={180} color={BLUE} opacity={0.05} />
                    <ScanLine y={500} color={CYAN} opacity={0.05} />
                    <ScanLine y={820} color={VIOLET} opacity={0.05} />
                </g>

                {/* ═══ TOP-LEFT RESPONSIVE ZONE (relative to 0,0) ═══ */}
                <svg x="0" y="0" overflow="visible">
                    <PixelCluster x={320} y={45} color={BLUE} opacity={0.2} size={8} />
                    <BBoxOutline x={300} y={130} w={110} h={75} color={CYAN} opacity={0.16} />
                    <Crosshair x={440} y={55} color={VIOLET} opacity={0.2} />
                    <PixelL x={310} y={240} color={BLUE} opacity={0.15} size={5} />
                    <ScatteredPixels x={440} y={140} color={VIOLET} opacity={0.18} />
                    <TechText x={310} y={110} text="[SYS.RDY] // AWAITING" color={BLUE} opacity={0.2} />
                    <TechText x={320} y={225} text="COORD.X: 18.2" color={CYAN} opacity={0.25} />

                    {/* Left edge anchors */}
                    <PixelCluster x={320} y={460} color={VIOLET} opacity={0.15} size={6} />
                    <BracketCorners x={300} y={540} size={50} color={BLUE} opacity={0.15} />
                    <Crosshair x={380} y={620} color={CYAN} opacity={0.18} />
                    <PixelL x={310} y={700} color={VIOLET} opacity={0.15} size={5} />
                    <TechText x={310} y={530} text="LAYER: AUTO" color={VIOLET} opacity={0.2} />

                    <g>
                        <animateTransform attributeName="transform" type="translate" values="0 0; 5 -3; 0 0" dur="24s" repeatCount="indefinite" />
                        <GraphNetwork x={350} y={400} color={VIOLET} opacity={0.12} />
                        <Crosshair x={370} y={330} color={CYAN} opacity={0.12} />
                    </g>
                </svg>

                {/* ═══ TOP-RIGHT RESPONSIVE ZONE (anchored to x=100%, translated by fixed width width) ═══ */}
                {/* 1920 is a safe anchoring width coordinate mapping from previous hardcoded design */}
                <svg x="100%" y="0" overflow="visible">
                    <g transform="translate(-1920, 0)">
                        <SquareFrame x={1730} y={25} size={120} color={BLUE} opacity={0.15} />
                        <SquareFrame x={1755} y={50} size={70} color={BLUE} opacity={0.1} />
                        <BracketCorners x={1600} y={30} size={80} color={CYAN} opacity={0.18} />
                        <NodeCluster x={1610} y={140} color={CYAN} opacity={0.2} />
                        <PixelCluster x={1800} y={190} color={VIOLET} opacity={0.18} size={7} />
                        <Crosshair x={1720} y={200} color={BLUE} opacity={0.15} />
                        <TechText x={1755} y={42} text="NET.TX: 59ms" color={CYAN} />

                        {/* Right edge anchors */}
                        <BBoxOutline x={1760} y={420} w={90} h={60} color={VIOLET} opacity={0.15} />
                        <ScatteredPixels x={1830} y={350} color={BLUE} opacity={0.15} />
                        <GraphNetwork x={1700} y={530} color={CYAN} opacity={0.15} />
                        <Crosshair x={1850} y={620} color={VIOLET} opacity={0.18} />
                        <TechText x={1760} y={410} text="ZONE: B" color={BLUE} />

                        <g>
                            <animateTransform attributeName="transform" type="translate" values="0 0; -6 4; 0 0" dur="28s" repeatCount="indefinite" />
                            <PixelCluster x={1650} y={250} color={VIOLET} opacity={0.15} size={7} />
                            <SquareFrame x={1730} y={660} size={65} color={CYAN} opacity={0.12} />
                        </g>
                    </g>
                </svg>

                {/* ═══ BOTTOM-LEFT RESPONSIVE ZONE (anchored to y=100%) ═══ */}
                <svg x="0" y="100%" overflow="visible">
                    <g transform="translate(0, -1080)">
                        <NodeCluster x={320} y={920} color={BLUE} opacity={0.2} />
                        <SquareFrame x={300} y={840} size={90} color={VIOLET} opacity={0.15} />
                        <Crosshair x={440} y={1000} color={CYAN} opacity={0.2} />
                        <ScatteredPixels x={380} y={870} color={BLUE} opacity={0.15} />
                        <BracketCorners x={310} y={960} size={60} color={BLUE} opacity={0.15} />
                        <TechText x={310} y={950} text="ID: A9-FR" color={CYAN} />

                        <PixelCluster x={900} y={1020} color={BLUE} opacity={0.12} size={5} />
                        <Crosshair x={1100} y={1040} color={CYAN} opacity={0.12} />

                        <g>
                            <animateTransform attributeName="transform" type="translate" values="0 0; 4 -6; 0 0" dur="24s" repeatCount="indefinite" />
                            <NodeCluster x={350} y={750} color={BLUE} opacity={0.18} />
                        </g>
                    </g>
                </svg>

                {/* ═══ BOTTOM-RIGHT RESPONSIVE ZONE (anchored to x=100%, y=100%) ═══ */}
                <svg x="100%" y="100%" overflow="visible">
                    <g transform="translate(-1920, -1080)">
                        <BBoxOutline x={1690} y={880} w={140} h={95} color={BLUE} opacity={0.18} />
                        <PixelCluster x={1780} y={810} color={CYAN} opacity={0.2} size={10} />
                        <Crosshair x={1670} y={980} color={VIOLET} opacity={0.2} />
                        <GraphNetwork x={1750} y={950} color={BLUE} opacity={0.15} />
                        <PixelL x={1840} y={780} color={VIOLET} opacity={0.15} size={6} />
                        <TechText x={1690} y={870} text="MEM: 32% // VOL" color={VIOLET} />

                        <g>
                            <animateTransform attributeName="transform" type="translate" values="0 0; -5 3; 0 0" dur="30s" repeatCount="indefinite" />
                            <BracketCorners x={1600} y={700} size={55} color={CYAN} opacity={0.1} />
                            <ScatteredPixels x={1800} y={500} color={VIOLET} opacity={0.1} />
                        </g>
                        <g>
                            <animateTransform attributeName="transform" type="translate" values="0 0; 6 4; 0 0" dur="22s" repeatCount="indefinite" />
                            <PixelL x={1820} y={300} color={BLUE} opacity={0.12} size={5} />
                        </g>
                    </g>
                </svg>

            </svg>
        </div>
    );
}

