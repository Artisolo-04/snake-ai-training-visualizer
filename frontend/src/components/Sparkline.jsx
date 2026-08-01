function downsample(arr, targetLen) {
  if (arr.length <= targetLen) return arr;
  const step = arr.length / targetLen;
  const result = [];
  for (let i = 0; i < targetLen; i++) {
    result.push(arr[Math.floor(i * step)]);
  }
  return result;
}

function movingAverage(arr, window) {
  return arr.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = arr.slice(start, i + 1);
    return slice.reduce((sum, v) => sum + v, 0) / slice.length;
  });
}

export default function Sparkline({ data, label, valueLabel, color = '#5ccfe6', smooth = false }) {
  
  const width = 320;
  const height = 70;
  const padding = 4;

  const series = smooth ? movingAverage(data, Math.max(5, Math.floor(data.length / 40))) : data;
  const points = downsample(series, 150);

  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;

  const coords = points
    .map((v, i) => {
      const x = padding + (i / (points.length - 1 || 1)) * (width - padding * 2);
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted">
        <span>{label}</span>
        <span className="text-amber">{valueLabel}</span>
      </div>
      <svg width={width} height={height} className="border border-line rounded-sm bg-panel">
        <polyline points={coords} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    </div>
  );
}
