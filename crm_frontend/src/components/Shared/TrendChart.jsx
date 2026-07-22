import React from 'react';

const TrendChart = ({ trends }) => {
  if (!trends || trends.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-xs font-semibold">
        No trend data available.
      </div>
    );
  }

  const width = 500;
  const height = 160;
  const pL = 36;
  const pR = 16;
  const pT = 16;
  const pB = 28;

  const cW = width - pL - pR;
  const cH = height - pT - pB;

  const maxVal = Math.max(...trends.map((t) => Math.max(t.total || 0, t.qualified || 0, 5)));

  const pts = trends.map((item, i) => ({
    x: pL + (i / (trends.length - 1)) * cW,
    y: pT + cH - ((item.total || 0) / maxVal) * cH,
    ...item,
  }));

  const qPts = trends.map((item, i) => ({
    x: pL + (i / (trends.length - 1)) * cW,
    y: pT + cH - ((item.qualified || 0) / maxVal) * cH,
  }));

  const pathStr = (points) =>
    points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cx = prev.x + (p.x - prev.x) / 2;
      return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
    }, '');

  const linePath = pathStr(pts);
  const qualPath = pathStr(qPts);
  const areaPath = linePath
    ? `${linePath} L ${pts[pts.length - 1].x} ${pT + cH} L ${pts[0].x} ${pT + cH} Z`
    : '';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <defs>
        <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((r) => (
        <line
          key={r}
          x1={pL}
          y1={pT + r * cH}
          x2={width - pR}
          y2={pT + r * cH}
          className="stroke-slate-100 dark:stroke-slate-800"
          strokeWidth={1}
        />
      ))}
      {areaPath && <path d={areaPath} fill="url(#ag2)" />}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          className="stroke-indigo-600 dark:stroke-indigo-400"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      )}
      {qualPath && (
        <path
          d={qualPath}
          fill="none"
          className="stroke-emerald-500"
          strokeWidth={2}
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
      )}
      {pts.map((pt, i) => (
        <g key={i}>
          <circle
            cx={pt.x}
            cy={pt.y}
            r={3.5}
            className="fill-indigo-600 dark:fill-indigo-400"
            stroke="white"
            strokeWidth={1.5}
          />
          <title>{`${pt.month || pt.date || ''}: ${pt.total || 0} total, ${pt.qualified || 0} qualified`}</title>
        </g>
      ))}
      {pts.map((pt, i) => (
        <text
          key={i}
          x={pt.x}
          y={height - 6}
          className="fill-slate-400 dark:fill-slate-500"
          fontSize="9"
          textAnchor="middle"
          fontWeight="600"
        >
          {pt.month || pt.date || ''}
        </text>
      ))}
    </svg>
  );
};

export default TrendChart;
