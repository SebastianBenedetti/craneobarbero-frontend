const COLORS = ["#ffc831", "#6c757d", "#4ea8de", "#e07a5f", "#81b29a", "#b388eb", "#d0d0d0"];
const MAX_SLICES = 6;
const SIZE = 160;
const RADIUS = 72;
const CENTER = SIZE / 2;

const groupSlices = (data) => {
  const positive = data.filter((d) => Number(d.value) > 0).sort((a, b) => Number(b.value) - Number(a.value));
  if (positive.length <= MAX_SLICES) return positive;
  const top = positive.slice(0, MAX_SLICES - 1);
  const rest = positive.slice(MAX_SLICES - 1).reduce((sum, d) => sum + Number(d.value), 0);
  return [...top, { label: "Otros", value: rest }];
};

const point = (angle) => [CENTER + RADIUS * Math.cos(angle), CENTER + RADIUS * Math.sin(angle)];

const slicePath = (start, end) => {
  const [x1, y1] = point(start);
  const [x2, y2] = point(end);
  const largeArc = end - start > Math.PI ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`;
};

const formatShare = (share) => `${share.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;

function PieChart({ title, data, format = (value) => value }) {
  const slices = groupSlices(data);
  const total = slices.reduce((sum, d) => sum + Number(d.value), 0);

  const shapes = slices.reduce((list, slice, index) => {
    const start = index === 0 ? -Math.PI / 2 : list[index - 1].end;
    const end = start + (Number(slice.value) / total) * 2 * Math.PI;
    return [...list, { ...slice, color: COLORS[index % COLORS.length], start, end, share: (Number(slice.value) / total) * 100 }];
  }, []);

  const description = shapes.map((s) => `${s.label}: ${format(s.value)} (${formatShare(s.share)})`).join(", ");

  return (
    <div className="report-pie">
      <h3 className="report-pie-title">{title}</h3>
      {total === 0 ? (
        <p className="text-secondary report-pie-empty">Sin datos en el período.</p>
      ) : (
        <div className="report-pie-body">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="report-pie-svg" role="img" aria-label={`${title}. ${description}`}>
            {shapes.length === 1 ? (
              <circle cx={CENTER} cy={CENTER} r={RADIUS} fill={shapes[0].color} />
            ) : (
              shapes.map((s) => (
                <path key={s.label} d={slicePath(s.start, s.end)} fill={s.color} stroke="var(--bg-card)" strokeWidth="1.5">
                  <title>{`${s.label}: ${format(s.value)} (${formatShare(s.share)})`}</title>
                </path>
              ))
            )}
          </svg>
          <ul className="report-pie-legend">
            {shapes.map((s) => (
              <li key={s.label}>
                <span className="report-pie-swatch" style={{ background: s.color }} aria-hidden="true" />
                <span className="report-pie-label">
                  {s.label}
                  <small>{format(s.value)}</small>
                </span>
                <span className="report-pie-share">{formatShare(s.share)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default PieChart;
