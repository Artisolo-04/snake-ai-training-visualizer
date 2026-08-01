export default function NeuralNetLoader({ progress = 0 }) {
  const CX = 200;
  const CY = 200;
  const R = 90;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC - (Math.min(100, Math.max(0, progress)) / 100) * CIRC;

  return (
    <svg viewBox="0 0 400 400" className="w-full h-full">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1c2530" strokeWidth="6" />

      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke="#5ccfe6"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${CX} ${CY})`}
        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
      />

      <g style={{ transformOrigin: `${CX}px ${CY}px` }} className="core-ring">
        <circle cx={CX} cy={CY} r="34" fill="none" stroke="#ffb454" strokeWidth="2" />
      </g>

      <circle cx={CX} cy={CY} r="34" fill="#ffb454" className="core-pulse" style={{ transformOrigin: `${CX}px ${CY}px` }} />

      <text x={CX} y={CY + 6} textAnchor="middle" fill="#0d1117" fontSize="18" fontWeight="700" fontFamily="monospace">
        {Math.round(progress)}%
      </text>

      <text x="200" y="330" textAnchor="middle" fill="#5b6570" fontSize="12" fontFamily="monospace">
        TRAINING AGENT
      </text>
    </svg>
  );
}
