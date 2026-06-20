"use client";

interface Props {
  score: number;
  label: string;
}

export default function HealthScoreGauge({ score, label }: Props) {
  const r = 58;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color =
    score >= 70 ? "#7a9068" : score >= 45 ? "#c8902a" : "#904545";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 160" className="w-36 h-36">
        <circle
          cx="80" cy="80" r={r}
          fill="none" stroke="#ede9e3" strokeWidth="14"
        />
        <circle
          cx="80" cy="80" r={r}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
        />
        <text
          x="80" y="76"
          textAnchor="middle"
          fontSize="28"
          fontFamily="Georgia, serif"
          fill="#2d2926"
        >
          {score}
        </text>
        <text
          x="80" y="96"
          textAnchor="middle"
          fontSize="9"
          fill="#8a8278"
          letterSpacing="2"
        >
          {label.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
