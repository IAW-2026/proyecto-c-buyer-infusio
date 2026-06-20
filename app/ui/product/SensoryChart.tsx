interface Props {
  tags: string[];
  accent: "terracotta" | "olive";
  productId: string;
}

const R = 70;
const CX = 100;
const CY = 100;

// Base intensities ordered most → least prominent
const BASE = [0.88, 0.63, 0.44, 0.28];

// Axis unit vectors: N, E, S, W
const AXES = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
];

const LABEL_POSITIONS = [
  { x: CX, y: CY - R - 12, anchor: "middle", baseline: "auto" },
  { x: CX + R + 10, y: CY, anchor: "start", baseline: "middle" },
  { x: CX, y: CY + R + 16, anchor: "middle", baseline: "auto" },
  { x: CX - R - 10, y: CY, anchor: "end", baseline: "middle" },
];

const PCT_OFFSETS = [
  { dx: 0, dy: 10 },
  { dx: -10, dy: -8 },
  { dx: 0, dy: -6 },
  { dx: 10, dy: -8 },
];

function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return h >>> 0;
}

function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed * 9301 + index * 49297 + 233323) * 46386.58;
  return x - Math.floor(x);
}

function buildIntensities(productId: string): number[] {
  const seed = hashStr(productId);
  return BASE.map((base, i) => {
    const r = seededRandom(seed, i);
    // ±0.18 variation, clamped so each axis stays within [0.12, 0.97]
    const delta = (r - 0.5) * 0.36;
    return Math.min(0.97, Math.max(0.12, base + delta));
  });
}

export default function SensoryChart({ tags, accent, productId }: Props) {
  const color = accent === "terracotta" ? "#b86f4c" : "#6b7056";
  const intensities = buildIntensities(productId);

  const dataPoints = intensities.map((intensity, i) => ({
    x: CX + AXES[i].dx * R * intensity,
    y: CY + AXES[i].dy * R * intensity,
  }));

  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const gridRings = [0.25, 0.5, 0.75, 1].map((f) => {
    const r = R * f;
    return [
      `${CX},${CY - r}`,
      `${CX + r},${CY}`,
      `${CX},${CY + r}`,
      `${CX - r},${CY}`,
    ].join(" ");
  });

  return (
    <svg
      viewBox="0 0 200 200"
      overflow="visible"
      className="w-full h-full"
      aria-label="Gráfico sensorial"
    >
      {/* Grid rings */}
      {gridRings.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke="#d4cfc5"
          strokeWidth="0.5"
        />
      ))}

      {/* Axis lines */}
      {AXES.map((ax, i) => (
        <line
          key={i}
          x1={CX}
          y1={CY}
          x2={CX + ax.dx * R}
          y2={CY + ax.dy * R}
          stroke="#d4cfc5"
          strokeWidth="0.5"
        />
      ))}

      {/* Data polygon */}
      <polygon
        points={dataPolygon}
        fill={color}
        fillOpacity="0.15"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Vertex dots + percentage labels */}
      {dataPoints.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill={color} />
          <text
            x={p.x + PCT_OFFSETS[i].dx}
            y={p.y + PCT_OFFSETS[i].dy}
            fontSize="7"
            fill={color}
            fillOpacity="0.7"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {Math.round(intensities[i] * 100)}%
          </text>
        </g>
      ))}

      {/* Axis labels */}
      {tags.slice(0, 4).map((tag, i) => (
        <text
          key={i}
          x={LABEL_POSITIONS[i].x}
          y={LABEL_POSITIONS[i].y}
          fontSize="9"
          fill="#2d2926"
          textAnchor={LABEL_POSITIONS[i].anchor as never}
          dominantBaseline={LABEL_POSITIONS[i].baseline as never}
          letterSpacing="0.08em"
          fontFamily="serif"
        >
          {tag}
        </text>
      ))}
    </svg>
  );
}
