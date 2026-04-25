import { COLORS, Card, SectionTitle, RecoveryDot } from "./shared.jsx";

function MiniChart({ values, labels, color, unit }) {
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const h = 60, w = 280;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        {values.map((v, i) => {
          const x = (i / (values.length - 1)) * w;
          const y = h - ((v - min) / (max - min)) * h;
          return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: COLORS.textFaint, marginTop: 4 }}>
        <span>{labels[0]}</span>
        <span style={{ fontFamily: "monospace", color: COLORS.text, fontSize: 11 }}>
          {values[values.length - 1]}{unit}{" "}
          <span style={{ color: values[values.length - 1] < values[0] ? COLORS.green : COLORS.red }}>
            ({values[values.length - 1] > values[0] ? "+" : ""}{(values[values.length - 1] - values[0]).toFixed(1)})
          </span>
        </span>
        <span>{labels[labels.length - 1]}</span>
      </div>
    </div>
  );
}

export default function HistoryView({ allData, settings }) {
  const days = Object.keys(allData)
    .filter(k => !k.startsWith("__") && k.match(/^\d{4}-\d{2}-\d{2}$/))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 30);

  if (days.length === 0) return (
    <div style={{ textAlign: "center", color: COLORS.textDim, paddingTop: 60, fontSize: 14 }}>
      No history yet. Start logging!
    </div>
  );

  const weightDays = days.filter(d => allData[d]?.body?.weight).slice(0, 14).reverse();
  const weights = weightDays.map(d => allData[d].body.weight);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {weightDays.length > 1 && (
        <Card>
          <SectionTitle>Weight trend</SectionTitle>
          <MiniChart values={weights} labels={weightDays.map(d => d.slice(5))} color={COLORS.blue} unit="kg" />
        </Card>
      )}
      {days.map(d => {
        const day = allData[d];
        const cals = (day.meals || []).reduce((s, m) => s + (m.calories || 0), 0);
        const burned = day.workout?.calories || 0;
        const rec = day.whoop?.recovery;
        return (
          <Card key={d}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, color: COLORS.textDim }}>
                  {new Date(d + "T12:00:00").toLocaleDateString("en-DE", { weekday: "short", day: "numeric", month: "short" })}
                </div>
                {day.workout && (
                  <div style={{ fontSize: 11, color: COLORS.textFaint, marginTop: 2 }}>
                    {day.workout.type} · {day.workout.duration}min
                    {day.workout.tss ? ` · TSS ${day.workout.tss}` : ""}
                  </div>
                )}
                {day.body?.weight && (
                  <div style={{ fontSize: 11, color: COLORS.textFaint, marginTop: 2 }}>
                    {day.body.weight} kg
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {rec != null && <RecoveryDot score={rec} />}
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "monospace", color: cals > settings.calories ? COLORS.red : COLORS.accent, fontSize: 15, fontWeight: 700 }}>{cals || "—"}</div>
                  <div style={{ fontSize: 10, color: COLORS.textFaint }}>kcal in</div>
                  {burned > 0 && <div style={{ fontSize: 10, color: COLORS.blue }}>−{burned} burned</div>}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
