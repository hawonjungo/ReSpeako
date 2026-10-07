// Draws Describe Image charts as inline SVG so no image files are needed.
const WIDTH = 480;
const HEIGHT = 280;
const PADDING = { top: 20, right: 16, bottom: 40, left: 44 };
const PIE_COLORS = ['#0891b2', '#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'];

function niceMax(value) {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

function Axes({ max, unit }) {
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    y: PADDING.top + plotHeight * (1 - ratio),
    label: Math.round(max * ratio),
  }));

  return (
    <g fontSize="11" fill="currentColor">
      {ticks.map((tick) => (
        <g key={tick.label}>
          <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={tick.y} y2={tick.y} stroke="currentColor" strokeOpacity="0.15" />
          <text x={PADDING.left - 6} y={tick.y + 4} textAnchor="end" opacity="0.7">{tick.label}</text>
        </g>
      ))}
      <text x={PADDING.left - 6} y={PADDING.top - 8} textAnchor="end" opacity="0.7">{unit}</text>
    </g>
  );
}

function BarChart({ data, unit }) {
  const max = niceMax(Math.max(...data.map((item) => item.value)));
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const slot = plotWidth / data.length;
  const barWidth = slot * 0.6;

  return (
    <>
      <Axes max={max} unit={unit} />
      {data.map((item, index) => {
        const height = (item.value / max) * plotHeight;
        const x = PADDING.left + slot * index + (slot - barWidth) / 2;
        const y = PADDING.top + plotHeight - height;
        return (
          <g key={item.label} fontSize="11" fill="currentColor">
            <rect x={x} y={y} width={barWidth} height={height} rx="3" fill="#0891b2" />
            <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fontWeight="600">{item.value}</text>
            <text x={x + barWidth / 2} y={HEIGHT - PADDING.bottom + 16} textAnchor="middle">{item.label}</text>
          </g>
        );
      })}
    </>
  );
}

function LineChart({ data, unit }) {
  const max = niceMax(Math.max(...data.map((item) => item.value)));
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const points = data.map((item, index) => ({
    ...item,
    x: PADDING.left + (plotWidth * index) / Math.max(1, data.length - 1),
    y: PADDING.top + plotHeight - (item.value / max) * plotHeight,
  }));

  return (
    <>
      <Axes max={max} unit={unit} />
      <polyline
        points={points.map((point) => `${point.x},${point.y}`).join(' ')}
        fill="none"
        stroke="#6366f1"
        strokeWidth="2.5"
      />
      {points.map((point) => (
        <g key={point.label} fontSize="11" fill="currentColor">
          <circle cx={point.x} cy={point.y} r="4" fill="#6366f1" />
          <text x={point.x} y={point.y - 9} textAnchor="middle" fontWeight="600">{point.value}</text>
          <text x={point.x} y={HEIGHT - PADDING.bottom + 16} textAnchor="middle">{point.label}</text>
        </g>
      ))}
    </>
  );
}

function PieChart({ data, unit }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const cx = 140;
  const cy = HEIGHT / 2;
  const radius = 110;
  let angle = -Math.PI / 2;

  return (
    <>
      {data.map((item, index) => {
        const sweep = (item.value / total) * Math.PI * 2;
        const start = angle;
        angle += sweep;
        const x1 = cx + radius * Math.cos(start);
        const y1 = cy + radius * Math.sin(start);
        const x2 = cx + radius * Math.cos(angle);
        const y2 = cy + radius * Math.sin(angle);
        const largeArc = sweep > Math.PI ? 1 : 0;
        return (
          <path
            key={item.label}
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={PIE_COLORS[index % PIE_COLORS.length]}
            stroke="white"
            strokeWidth="1.5"
          />
        );
      })}
      {data.map((item, index) => (
        <g key={item.label} fontSize="12" fill="currentColor" transform={`translate(290, ${50 + index * 34})`}>
          <rect width="14" height="14" rx="3" fill={PIE_COLORS[index % PIE_COLORS.length]} />
          <text x="22" y="12">{item.label}: <tspan fontWeight="600">{item.value}{unit}</tspan></text>
        </g>
      ))}
    </>
  );
}

export default function ChartImage({ chart }) {
  const description = `${chart.title}: ${chart.data.map((item) => `${item.label} ${item.value}${chart.unit === '%' ? '%' : ''}`).join(', ')}`;
  const Chart = { bar: BarChart, line: LineChart, pie: PieChart }[chart.type];

  return (
    <figure className="space-y-2">
      <figcaption className="text-center font-semibold">{chart.title}</figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={description}
        className="h-auto w-full max-w-xl text-gray-800 dark:text-gray-100"
        style={{ margin: '0 auto', display: 'block' }}
      >
        <Chart data={chart.data} unit={chart.unit} />
      </svg>
    </figure>
  );
}
