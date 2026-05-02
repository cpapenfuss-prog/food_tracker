import { COLORS, Card, SectionTitle, RecoveryDot } from "./shared.jsx";

function MiniChart({ values, labels, color, unit }) {
  if (values.length < 2) return null;
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const h = 60, w = 300;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(" ");
  const delta = values[values.length - 1] - values[0];
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
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: COLORS.textFaint, marginTop: 6 }}>
        <span>{labels[0]}</span>
        <span style={{ fontFamily: "monospace", color: COLORS.text, fontWeight: 700 }}>
          {values[values.length - 1]}{unit}{" "}
          <span style={{ color: delta < 0 ? COLORS.green : COLORS.red }}>
            ({delta > 0 ? "+" : ""}{delta.toFixed(1)})
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
    <div style={{ textAlign: "center", color: COLORS.textFaint, paddingTop: 60, fontSize: 14 }}>
      No history yet. Start logging!
    </div>
  );

  const weightDays = days.filter(d => allData[d]?.body?.weight).slice(0, 14).reverse();
  const weights = weightDays.map(d => allData[d].body.weight);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {weightDays.length > 1 && (
        <Card>
          <SectionTitle>Weight trend</SectionTitle>
          <MiniChart values={weights} labels={weightDays.map(d => d.slice(5))} color={COLORS.blue} unit="kg" />
        </Card>
      )}

      {days.map(d => {
        const day = allData[d];
        const eaten = (day.meals || []).reduce((s, m) => s + (m.calories || 0), 0);
        const workoutBurn = day.workout?.calories || 0;
        const walkBurn = Math.round((day.walk?.minutes || 0) * 4.5);
        const totalBurn = workoutBurn + walkBurn;
        const aiTargets = day.aiTargets;
        const totalTarget = aiTargets?.calories || (settings.calories + totalBurn);
        const gap = totalTarget - eaten;
        const isUnder = gap >= 0;
        const gapColor = Math.abs(gap) < 150 ? COLORS.green : isUnder ? COLORS.accent : COLORS.red;
        const rec = day.whoop?.recovery;

        return (
          <Card key={d} style={{ padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.navy, marginBottom: 2 }}>
                  {new Date(d + "T12:00:00").toLocaleDateString("en-DE", { weekday: "short", day: "numeric", month: "short" })}
                </div>
                {day.workout && (
                  <div style={{ fontSize: 11, color: COLORS.textDim }}>
                    {day.workout.type} · {day.workout.duration}min
                    {day.workout.tss ? ` · TSS ${day.workout.tss}` : ""}
                  </div>
                )}
                {day.walk?.minutes > 0 && (
                  <div style={{ fontSize: 11, color: COLORS.textFaint }}>Walk {day.walk.minutes} min</div>
                )}
                {day.body?.weight && (
                  <div style={{ fontSize: 11, color: COLORS.textFaint }}>{day.body.weight} kg</div>
                )}
                {aiTargets && (
                  <div style={{ fontSize: 10, color: COLORS.accent, marginTop: 2 }}>⚡ AI targets</div>
                )}
              </div>

              {rec != null && <RecoveryDot score={rec} />}

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "monospace", color: COLORS.accent, fontSize: 16, fontWeight: 800 }}>
                  {eaten || "—"}
                </div>
                <div style={{ fontSize: 10, color: COLORS.textFaint }}>eaten</div>
                <div style={{ fontSize: 10, color: COLORS.textDim }}>/ {totalTarget} target</div>
                {eaten > 0 && (
                  <div style={{ fontSize: 11, color: gapColor, fontWeight: 700, marginTop: 1 }}>
                    {isUnder ? `${gap} under` : `${Math.abs(gap)} over`}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
