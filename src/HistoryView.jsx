import { COLORS, Card, SectionTitle, RecoveryDot } from "./shared.jsx";
import { bodyBatteryBand } from "./bodyBattery.js";

// ── HRCV colour scale ─────────────────────────────────────────────────────────
function hrcvColor(pct) {
  if (pct === null) return COLORS.textFaint;
  if (pct < 10) return COLORS.green;
  if (pct <= 20) return COLORS.amber;
  return COLORS.red;
}
function hrcvLabel(pct) {
  if (pct === null) return "—";
  if (pct < 10) return "Elite";
  if (pct <= 20) return "Solid";
  return "Be careful";
}

// ── Body Battery colour scale ─────────────────────────────────────────────────
// Thresholds live in bodyBattery.js (band keys); palette mapped to app COLORS
// here so the chart matches the HRV/HRCV panels.
const BB_PALETTE = {
  low: COLORS.red, moderate: COLORS.amber, good: COLORS.green, charged: COLORS.accent,
};
function bbColor(v) {
  const b = bodyBatteryBand(v);
  return b ? BB_PALETTE[b.key] : COLORS.textFaint;
}
function bbLabel(v) {
  const b = bodyBatteryBand(v);
  return b ? b.label : "—";
}

// ── Stats helpers ─────────────────────────────────────────────────────────────
function mean(arr) { return arr.reduce((s, v) => s + v, 0) / arr.length; }
function stddev(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

// Rolling 7-day HRCV for each day in a chronologically-sorted array
function computeRollingHRCV(hrvDays) {
  return hrvDays.map((_, i) => {
    const window = hrvDays.slice(Math.max(0, i - 6), i + 1).map(d => d.hrv);
    if (window.length < 3) return null;
    const m = mean(window);
    if (m === 0) return null;
    return (stddev(window) / m) * 100;
  });
}

// ── Dual-panel HRV + HRCV% chart ─────────────────────────────────────────────
function HRVChart({ hrvDays, hrcvSeries }) {
  const W = 320, HRV_H = 80, HRCV_H = 60, GAP = 6;
  const n = hrvDays.length;
  const toX = i => n === 1 ? W / 2 : (i / (n - 1)) * W;

  // HRV panel
  const hrvVals = hrvDays.map(d => d.hrv);
  const hrvMin = Math.min(...hrvVals) - 3;
  const hrvMax = Math.max(...hrvVals) + 3;
  const toHRVy = v => HRV_H - ((v - hrvMin) / (hrvMax - hrvMin)) * HRV_H;
  const hrvPts = hrvVals.map((v, i) => `${toX(i)},${toHRVy(v)}`).join(" ");

  // HRCV panel
  const hrcvPoints = hrcvSeries.map((v, i) => ({ v, i })).filter(p => p.v !== null);
  const hrcvVals = hrcvPoints.map(p => p.v);
  const hrcvMax = Math.max(25, ...(hrcvVals.length ? hrcvVals : [25])) + 2;
  const toHRCVy = v => HRCV_H - ((v / hrcvMax) * HRCV_H);
  let hrcvPath = "";
  hrcvPoints.forEach((p, j) => {
    hrcvPath += j === 0 ? `M ${toX(p.i)} ${toHRCVy(p.v)}` : ` L ${toX(p.i)} ${toHRCVy(p.v)}`;
  });
  const y10 = toHRCVy(10);
  const y20 = toHRCVy(20);

  const labelIdxs = n <= 4 ? hrvDays.map((_, i) => i) : [0, Math.floor(n / 2), n - 1];

  return (
    <div>
      {/* HRV line chart */}
      <div style={{ fontSize: 9, color: COLORS.blue, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4, opacity: 0.8 }}>HRV (ms)</div>
      <svg width="100%" viewBox={`0 0 ${W} ${HRV_H}`} style={{ overflow: "visible", display: "block" }}>
        <defs>
          <linearGradient id="hrvGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.blue} stopOpacity="0.2" />
            <stop offset="100%" stopColor={COLORS.blue} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`${toX(0)},${HRV_H} ${hrvPts} ${toX(n - 1)},${HRV_H}`} fill="url(#hrvGrad)" />
        <polyline points={hrvPts} fill="none" stroke={COLORS.blue} strokeWidth="2" strokeLinejoin="round" />
        {hrvVals.map((v, i) => (
          <circle key={i} cx={toX(i)} cy={toHRVy(v)} r="3" fill={COLORS.blue} />
        ))}
        <text x={toX(n - 1)} y={Math.max(10, toHRVy(hrvVals[n - 1]) - 7)}
          textAnchor={n === 1 ? "middle" : "end"} fontSize="9" fill={COLORS.blue} fontWeight="700" fontFamily="monospace">
          {hrvVals[n - 1]}ms
        </text>
      </svg>

      {/* HRCV % chart */}
      <div style={{ fontSize: 9, color: COLORS.purple, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginTop: GAP + 4, marginBottom: 4, opacity: 0.8 }}>7-day HRCV (%)</div>
      <svg width="100%" viewBox={`0 0 ${W} ${HRCV_H}`} style={{ overflow: "visible", display: "block" }}>
        {/* Zone bands */}
        <rect x="0" y={0} width={W} height={y10} fill={COLORS.green} opacity="0.07" />
        <rect x="0" y={y10} width={W} height={y20 - y10} fill={COLORS.amber} opacity="0.09" />
        <rect x="0" y={y20} width={W} height={HRCV_H - y20} fill={COLORS.red} opacity="0.08" />
        {/* Zone lines */}
        <line x1="0" y1={y10} x2={W} y2={y10} stroke={COLORS.green} strokeWidth="0.8" strokeDasharray="3,3" opacity="0.7" />
        <line x1="0" y1={y20} x2={W} y2={y20} stroke={COLORS.red} strokeWidth="0.8" strokeDasharray="3,3" opacity="0.7" />
        <text x={W - 2} y={Math.max(9, y10 - 3)} textAnchor="end" fontSize="8" fill={COLORS.green} opacity="0.9">10%</text>
        <text x={W - 2} y={Math.max(9, y20 - 3)} textAnchor="end" fontSize="8" fill={COLORS.red} opacity="0.9">20%</text>
        {/* HRCV line */}
        {hrcvPath && <path d={hrcvPath} fill="none" stroke={COLORS.purple} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {/* Coloured dots */}
        {hrcvPoints.map((p, j) => (
          <circle key={j} cx={toX(p.i)} cy={toHRCVy(p.v)} r="3.5" fill={hrcvColor(p.v)} stroke="#fff" strokeWidth="1" />
        ))}
        {/* Latest label */}
        {hrcvPoints.length > 0 && (() => {
          const last = hrcvPoints[hrcvPoints.length - 1];
          return (
            <text x={toX(last.i)} y={Math.max(10, toHRCVy(last.v) - 7)}
              textAnchor={n === 1 ? "middle" : "end"} fontSize="9" fill={hrcvColor(last.v)} fontWeight="700" fontFamily="monospace">
              {last.v.toFixed(1)}%
            </text>
          );
        })()}
      </svg>

      {/* X-axis labels */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: COLORS.textFaint, marginTop: 5 }}>
        {labelIdxs.map(i => <span key={i}>{hrvDays[i].date.slice(5)}</span>)}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
        {[[COLORS.blue, "HRV"], [COLORS.purple, "HRCV 7-day"]].map(([color, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke={color} strokeWidth="2" /></svg>
            <span style={{ fontSize: 10, color: COLORS.textDim }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HRCV status badge ─────────────────────────────────────────────────────────
function HRCVBadge({ pct }) {
  const color = hrcvColor(pct);
  const label = hrcvLabel(pct);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px", borderRadius: 10,
      background: color + "14", border: `1.5px solid ${color}33`,
    }}>
      <div style={{
        width: 10, height: 10, borderRadius: "50%",
        background: color, boxShadow: `0 0 6px ${color}88`, flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 2 }}>Current 7-day HRCV</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color, lineHeight: 1 }}>
            {pct !== null ? pct.toFixed(1) + "%" : "—"}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
        </div>
      </div>
      <div style={{ fontSize: 9, color: COLORS.textFaint, textAlign: "right", lineHeight: 1.8 }}>
        <div style={{ color: COLORS.green }}>{"<"}10% · Elite</div>
        <div style={{ color: COLORS.amber }}>10–20% · Solid</div>
        <div style={{ color: COLORS.red }}>{">"}20% · Careful</div>
      </div>
    </div>
  );
}

// ── Body Battery chart (fixed 0–100 axis) ─────────────────────────────────────
function BodyBatteryChart({ bbDays }) {
  const W = 320, H = 80;
  const n = bbDays.length;
  const toX = i => n === 1 ? W / 2 : (i / (n - 1)) * W;
  const toY = v => H - (v / 100) * H; // fixed 0–100 scale, no autoscaling
  const vals = bbDays.map(d => d.bb);
  const pts = vals.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const y25 = toY(25), y50 = toY(50), y75 = toY(75);

  const labelIdxs = n <= 4 ? bbDays.map((_, i) => i) : [0, Math.floor(n / 2), n - 1];
  const last = vals[n - 1];

  return (
    <div>
      <div style={{ fontSize: 9, color: COLORS.accent, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4, opacity: 0.8 }}>Morning Body Battery (0–100)</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", display: "block" }}>
        <defs>
          <linearGradient id="bbGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.accent} stopOpacity="0.2" />
            <stop offset="100%" stopColor={COLORS.accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Zone bands: 75–100 charged, 50–75 good, 25–50 moderate, 0–25 low */}
        <rect x="0" y={0}    width={W} height={y75}      fill={COLORS.accent} opacity="0.06" />
        <rect x="0" y={y75}  width={W} height={y50 - y75} fill={COLORS.green}  opacity="0.06" />
        <rect x="0" y={y50}  width={W} height={y25 - y50} fill={COLORS.amber}  opacity="0.08" />
        <rect x="0" y={y25}  width={W} height={H - y25}    fill={COLORS.red}    opacity="0.07" />
        {/* Zone lines */}
        <line x1="0" y1={y50} x2={W} y2={y50} stroke={COLORS.green} strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />
        <line x1="0" y1={y25} x2={W} y2={y25} stroke={COLORS.red} strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />
        <text x={W - 2} y={Math.max(9, y50 - 3)} textAnchor="end" fontSize="8" fill={COLORS.green} opacity="0.9">50</text>
        <text x={W - 2} y={Math.max(9, y25 - 3)} textAnchor="end" fontSize="8" fill={COLORS.red} opacity="0.9">25</text>
        {/* Area + line */}
        <polygon points={`${toX(0)},${H} ${pts} ${toX(n - 1)},${H}`} fill="url(#bbGrad)" />
        <polyline points={pts} fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinejoin="round" />
        {/* Coloured dots by band */}
        {vals.map((v, i) => (
          <circle key={i} cx={toX(i)} cy={toY(v)} r="3.5" fill={bbColor(v)} stroke="#fff" strokeWidth="1" />
        ))}
        {/* Latest label */}
        <text x={toX(n - 1)} y={Math.max(10, toY(last) - 7)}
          textAnchor={n === 1 ? "middle" : "end"} fontSize="9" fill={bbColor(last)} fontWeight="700" fontFamily="monospace">
          {last}
        </text>
      </svg>

      {/* X-axis labels */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: COLORS.textFaint, marginTop: 5 }}>
        {labelIdxs.map(i => <span key={i}>{bbDays[i].date.slice(5)}</span>)}
      </div>
    </div>
  );
}

// ── Body Battery status badge ─────────────────────────────────────────────────
function BodyBatteryBadge({ value }) {
  const color = bbColor(value);
  const label = bbLabel(value);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px", borderRadius: 10,
      background: color + "14", border: `1.5px solid ${color}33`,
    }}>
      <div style={{
        width: 10, height: 10, borderRadius: "50%",
        background: color, boxShadow: `0 0 6px ${color}88`, flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 2 }}>Latest morning Body Battery</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color, lineHeight: 1 }}>
            {value != null ? value : "—"}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
        </div>
      </div>
      <div style={{ fontSize: 9, color: COLORS.textFaint, textAlign: "right", lineHeight: 1.7 }}>
        <div style={{ color: COLORS.accent }}>75+ · Charged</div>
        <div style={{ color: COLORS.green }}>50–74 · Good</div>
        <div style={{ color: COLORS.amber }}>25–49 · Moderate</div>
        <div style={{ color: COLORS.red }}>{"<"}25 · Low</div>
      </div>
    </div>
  );
}

// ── Weight mini-chart (unchanged) ─────────────────────────────────────────────
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

// ── Main view ─────────────────────────────────────────────────────────────────
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

  // Weight (stored kg, displayed in lbs)
  const weightDays = days.filter(d => allData[d]?.body?.weight).slice(0, 14).reverse();
  const weights = weightDays.map(d => +(allData[d].body.weight * 2.2046).toFixed(1));

  // HRV — chronological (oldest first), up to 30 logged days
  const hrvDays = days
    .filter(d => allData[d]?.whoop?.hrv > 0)
    .slice(0, 30)
    .reverse()
    .map(d => ({ date: d, hrv: allData[d].whoop.hrv }));

  const hrcvSeries = computeRollingHRCV(hrvDays);
  const latestHRCV = hrcvSeries.length > 0 ? hrcvSeries[hrcvSeries.length - 1] : null;

  // Build a lookup: date → HRCV value (for inline day cards)
  const hrcvByDate = {};
  hrvDays.forEach((h, i) => { hrcvByDate[h.date] = hrcvSeries[i]; });

  // Body Battery — chronological, up to 30 logged days
  const bbDays = days
    .filter(d => allData[d]?.whoop?.bodyBattery != null)
    .slice(0, 30)
    .reverse()
    .map(d => ({ date: d, bb: allData[d].whoop.bodyBattery }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* HRV + HRCV panel */}
      {hrvDays.length >= 2 && (
        <Card>
          <SectionTitle>HRV · HRCV · {hrvDays.length} days logged</SectionTitle>
          <HRVChart hrvDays={hrvDays} hrcvSeries={hrcvSeries} />
          <div style={{ marginTop: 14 }}>
            <HRCVBadge pct={latestHRCV} />
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: COLORS.textFaint, lineHeight: 1.6 }}>
            HRCV = (7-day HRV SD ÷ 7-day mean) × 100. Needs ≥ 3 days of HRV data. Lower = more consistent autonomic recovery.
          </div>
        </Card>
      )}

      {/* Single HRV day — not enough for rolling */}
      {hrvDays.length === 1 && (
        <Card style={{ borderStyle: "dashed" }}>
          <div style={{ fontSize: 12, color: COLORS.textFaint, textAlign: "center" }}>
            Log HRV for 3+ days to see rolling HRCV trend.
          </div>
        </Card>
      )}

      {/* Body Battery panel */}
      {bbDays.length >= 1 && (
        <Card>
          <SectionTitle>Body Battery · {bbDays.length} day{bbDays.length === 1 ? "" : "s"} logged</SectionTitle>
          {bbDays.length >= 2 && <BodyBatteryChart bbDays={bbDays} />}
          <div style={{ marginTop: bbDays.length >= 2 ? 14 : 0 }}>
            <BodyBatteryBadge value={bbDays[bbDays.length - 1].bb} />
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: COLORS.textFaint, lineHeight: 1.6 }}>
            Morning Garmin Body Battery (0–100). Higher = more recovered and charged for the day.
          </div>
        </Card>
      )}

      {/* Weight */}
      {weightDays.length > 1 && (
        <Card>
          <SectionTitle>Weight trend</SectionTitle>
          <MiniChart values={weights} labels={weightDays.map(d => d.slice(5))} color={COLORS.blue} unit="lb" />
        </Card>
      )}

      {/* Daily cards */}
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
        const hrv = day.whoop?.hrv;
        const dayHRCV = hrcvByDate[d] ?? null;
        const dayBB = day.whoop?.bodyBattery;

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
                  <div style={{ fontSize: 11, color: COLORS.textFaint }}>{(day.body.weight * 2.2046).toFixed(1)} lb</div>
                )}
                {/* HRV + inline HRCV badge */}
                {hrv > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: COLORS.blue, fontFamily: "monospace", fontWeight: 700 }}>
                      HRV {hrv}ms
                    </span>
                    {dayHRCV !== null && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, fontFamily: "monospace",
                        color: hrcvColor(dayHRCV),
                        background: hrcvColor(dayHRCV) + "18",
                        border: `1px solid ${hrcvColor(dayHRCV)}33`,
                        borderRadius: 3, padding: "1px 5px",
                      }}>
                        CV {dayHRCV.toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
                {/* Body Battery pill */}
                {dayBB != null && (
                  <div style={{ marginTop: 3 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, fontFamily: "monospace",
                      color: bbColor(dayBB),
                      background: bbColor(dayBB) + "18",
                      border: `1px solid ${bbColor(dayBB)}33`,
                      borderRadius: 3, padding: "1px 5px",
                    }}>
                      Body Batt {dayBB}
                    </span>
                  </div>
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
