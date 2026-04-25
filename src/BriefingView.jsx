import { useState } from "react";
import { COLORS, Card, SectionTitle, StatMini, primaryBtn } from "./shared.jsx";
import { computePMC, tsbStatus } from "./pmc.js";

// ── PMC Sparkline Chart ────────────────────────────────────────────────────────
function PMCChart({ history }) {
  if (history.length < 2) return (
    <div style={{ fontSize: 12, color: COLORS.textDim, textAlign: "center", padding: "20px 0" }}>
      Log at least 2 days of TSS to see your load chart.
    </div>
  );

  const W = 320, H = 100;
  const ctlVals = history.map(h => h.ctl);
  const atlVals = history.map(h => h.atl);
  const tsbVals = history.map(h => h.tsb);
  const allVals = [...ctlVals, ...atlVals, ...tsbVals];
  const minV = Math.min(...allVals) - 5;
  const maxV = Math.max(...allVals) + 5;

  function toX(i) { return (i / (history.length - 1)) * W; }
  function toY(v) { return H - ((v - minV) / (maxV - minV)) * H; }

  function line(vals, color, dash = "") {
    const pts = vals.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
    return <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeDasharray={dash} />;
  }

  // Zero line for TSB
  const zeroY = toY(0);

  // X-axis labels: first, middle, last
  const labelIdxs = [0, Math.floor(history.length / 2), history.length - 1];

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        {/* Zero line */}
        <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke={COLORS.border} strokeWidth="1" strokeDasharray="3,3" />
        {line(tsbVals, COLORS.purple, "4,2")}
        {line(atlVals, COLORS.red)}
        {line(ctlVals, COLORS.blue)}
      </svg>
      {/* X labels */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: COLORS.textFaint, marginTop: 4 }}>
        {labelIdxs.map(i => (
          <span key={i}>{history[i]?.date.slice(5)}</span>
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
        {[
          [COLORS.blue, "CTL (Fitness)", false],
          [COLORS.red, "ATL (Fatigue)", false],
          [COLORS.purple, "TSB (Form)", true],
        ].map(([color, label, dashed]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="18" height="8">
              <line x1="0" y1="4" x2="18" y2="4" stroke={color} strokeWidth="2" strokeDasharray={dashed ? "4,2" : ""} />
            </svg>
            <span style={{ fontSize: 10, color: COLORS.textDim }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AI Briefing ────────────────────────────────────────────────────────────────
async function generateBriefing({ yesterday, todayData, pmc, settings, apiKey }) {
  const yesterdayDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  const prompt = `You are a sports nutritionist and performance coach advising an experienced endurance athlete (road cyclist and runner, ~25 years experience, body composition goal: getting leaner while maintaining performance).

Here is their current data. Give a detailed, direct daily briefing. Be specific with numbers. No fluff.

## Yesterday's nutrition (${yesterdayDate})
- Calories eaten: ${yesterday.calories} kcal (target was ${yesterday.target} kcal, ${yesterday.calories > yesterday.target ? `OVER by ${yesterday.calories - yesterday.target}` : `UNDER by ${yesterday.target - yesterday.calories}`})
- Protein: ${yesterday.protein}g (target ${settings.protein}g)
- Carbs: ${yesterday.carbs}g (target ${settings.carbs}g)  
- Fat: ${yesterday.fat}g (target ${settings.fat}g)
- Workout: ${yesterday.workout ? `${yesterday.workout.type}, ${yesterday.workout.duration} min, TSS ${yesterday.workout.tss || "not logged"}, ${yesterday.workout.calories || 0} kcal burned` : "Rest day"}

## Today's WHOOP data
- Recovery: ${todayData.whoop?.recovery ?? "not logged"}%
- HRV: ${todayData.whoop?.hrv ?? "not logged"} ms
- RHR: ${todayData.whoop?.rhr ?? "not logged"} bpm
- Sleep: ${todayData.whoop?.sleep ?? "not logged"} hours

## Training load (Performance Management Chart)
- CTL / Fitness: ${pmc.ctl} (chronic 42-day load)
- ATL / Fatigue: ${pmc.atl} (acute 7-day load)
- TSB / Form: ${pmc.tsb} (positive = fresh, negative = fatigued)
- 7-day ramp rate: ${pmc.rampRate > 0 ? "+" : ""}${pmc.rampRate} CTL points
- Status: ${tsbStatusLabel(pmc.tsb)}

## Today so far
- Calories eaten: ${todayData.calories} kcal
- Workout: ${todayData.workout ? `${todayData.workout.type}, ${todayData.workout.duration} min` : "not yet logged"}
- Calorie target today: ${todayData.target} kcal (baseline ${settings.calories} + ${todayData.burn} burned)

## Athlete targets
- Baseline calories: ${settings.calories} kcal
- Protein: ${settings.protein}g, Carbs: ${settings.carbs}g, Fat: ${settings.fat}g

---

Write a detailed briefing covering:

1. **Recovery assessment** — interpret today's WHOOP data in context of yesterday's training and TSB. Be specific about what the numbers mean.

2. **Yesterday's fueling analysis** — was it appropriate given the training load? What was the impact of any over/under consumption? How does it connect to today's recovery numbers?

3. **Today's fueling strategy** — specific calorie and macro targets for today based on recovery, TSB, and what's planned. Include timing: pre-workout, during (if >90 min), and post-workout windows with specific gram targets.

4. **Training load insight** — comment on CTL, ATL, TSB trend. Is the ramp rate sustainable? Any risk of overreaching? What does this mean for the next few days?

5. **One priority action** — the single most important thing to do today from a nutrition/recovery standpoint.

Be direct. Use numbers. Write as a knowledgeable coach who understands both the science and the athlete's goals.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.find(b => b.type === "text")?.text || "";
}

function tsbStatusLabel(tsb) {
  if (tsb > 10) return "Fresh";
  if (tsb > 0) return "Optimal";
  if (tsb > -10) return "Tired";
  if (tsb > -25) return "Fatigued";
  return "Overreached";
}

function BriefingText({ text }) {
  // Render markdown-ish bold and sections cleanly
  const lines = text.split("\n").filter(l => l.trim());
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {lines.map((line, i) => {
        // Section headers: ## or **Title**
        if (line.startsWith("## ") || (line.startsWith("**") && line.endsWith("**"))) {
          const title = line.replace(/^##\s*/, "").replace(/\*\*/g, "");
          return (
            <div key={i} style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
              textTransform: "uppercase", color: COLORS.accent,
              marginTop: i > 0 ? 6 : 0, paddingTop: i > 0 ? 10 : 0,
              borderTop: i > 0 ? `1px solid ${COLORS.border}` : "none",
            }}>{title}</div>
          );
        }
        // Numbered sections like "1. **Recovery assessment**"
        if (/^\d+\.\s+\*\*/.test(line)) {
          const title = line.replace(/^\d+\.\s+\*\*/, "").replace(/\*\*.*/, "");
          const rest = line.replace(/^\d+\.\s+\*\*[^*]+\*\*\s*—?\s*/, "");
          return (
            <div key={i}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
                textTransform: "uppercase", color: COLORS.accent,
                marginTop: i > 0 ? 6 : 0, paddingTop: i > 0 ? 10 : 0,
                borderTop: i > 0 ? `1px solid ${COLORS.border}` : "none",
                marginBottom: 4,
              }}>{title}</div>
              {rest && <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6 }}>{renderInline(rest)}</div>}
            </div>
          );
        }
        // Regular paragraph
        return (
          <div key={i} style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6 }}>
            {renderInline(line)}
          </div>
        );
      })}
    </div>
  );
}

function renderInline(text) {
  // Bold **text**
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: COLORS.text, fontWeight: 700 }}>{part}</strong>
      : part
  );
}

// ── Main Briefing View ─────────────────────────────────────────────────────────
export default function BriefingView({ allData, settings }) {
  const [briefing, setBriefing] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState(null);

  const pmc = computePMC(allData);
  const { ctl, atl, tsb, history, rampRate } = pmc;
  const status = tsbStatusLabel(tsb);
  const statusColor = (() => {
    if (tsb > 10) return COLORS.green;
    if (tsb > 0) return COLORS.blue;
    if (tsb > -10) return COLORS.accent;
    if (tsb > -25) return "#f97316";
    return COLORS.red;
  })();

  // Yesterday's data
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const key = d.toISOString().slice(0, 10);
    const day = allData[key] || {};
    const workoutBurn = day.workout?.calories || 0;
    const walkBurn = Math.round((day.walk?.minutes || 0) * 4.5);
    const totalBurn = workoutBurn + walkBurn;
    const target = settings.calories + totalBurn;
    const meals = day.meals || [];
    return {
      calories: meals.reduce((s, m) => s + (m.calories || 0), 0),
      protein: meals.reduce((s, m) => s + (m.protein || 0), 0),
      carbs: meals.reduce((s, m) => s + (m.carbs || 0), 0),
      fat: meals.reduce((s, m) => s + (m.fat || 0), 0),
      target,
      workout: day.workout || null,
    };
  })();

  // Today's data
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayRaw = allData[todayKey] || {};
  const todayBurn = (todayRaw.workout?.calories || 0) + Math.round((todayRaw.walk?.minutes || 0) * 4.5);
  const todayData = {
    whoop: todayRaw.whoop || null,
    workout: todayRaw.workout || null,
    calories: (todayRaw.meals || []).reduce((s, m) => s + (m.calories || 0), 0),
    target: settings.calories + todayBurn,
    burn: todayBurn,
  };

  async function generate() {
    if (!settings.apiKey) { setError("Add your Anthropic API key in Settings first."); return; }
    setLoading(true); setError(""); setBriefing("");
    try {
      const text = await generateBriefing({ yesterday, todayData, pmc, settings, apiKey: settings.apiKey });
      setBriefing(text);
      setGeneratedAt(new Date().toLocaleTimeString("en-DE", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      setError("Could not generate briefing: " + e.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* PMC Summary */}
      <Card>
        <SectionTitle>Training load · PMC</SectionTitle>
        <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <StatMini label="CTL · Fitness" val={ctl} color={COLORS.blue} />
          <StatMini label="ATL · Fatigue" val={atl} color={COLORS.red} />
          <div>
            <div style={{ fontSize: 11, color: COLORS.textFaint, letterSpacing: 0.5, textTransform: "uppercase" }}>TSB · Form</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: statusColor, lineHeight: 1.2, marginTop: 2 }}>
              {tsb > 0 ? "+" : ""}{tsb}
              <span style={{ fontSize: 10, color: statusColor, marginLeft: 6, fontFamily: "sans-serif", fontWeight: 600 }}>{status}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: COLORS.textFaint, letterSpacing: 0.5, textTransform: "uppercase" }}>7d Ramp</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: rampRate > 5 ? COLORS.red : rampRate > 0 ? COLORS.accent : COLORS.green, lineHeight: 1.2, marginTop: 2 }}>
              {rampRate > 0 ? "+" : ""}{rampRate}
            </div>
          </div>
        </div>
        <PMCChart history={history} />
      </Card>

      {/* Yesterday snapshot */}
      <Card>
        <SectionTitle>Yesterday's fueling</SectionTitle>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: COLORS.textFaint, textTransform: "uppercase", letterSpacing: 0.5 }}>Eaten</div>
            <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: COLORS.accent, marginTop: 2 }}>
              {yesterday.calories || "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: COLORS.textFaint, textTransform: "uppercase", letterSpacing: 0.5 }}>Target</div>
            <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: COLORS.textDim, marginTop: 2 }}>
              {yesterday.target}
            </div>
          </div>
          {yesterday.calories > 0 && (
            <div>
              <div style={{ fontSize: 11, color: COLORS.textFaint, textTransform: "uppercase", letterSpacing: 0.5 }}>Gap</div>
              <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, marginTop: 2,
                color: yesterday.calories > yesterday.target ? COLORS.red : COLORS.green }}>
                {yesterday.calories > yesterday.target
                  ? `+${yesterday.calories - yesterday.target}`
                  : `-${yesterday.target - yesterday.calories}`}
              </div>
            </div>
          )}
        </div>
        {yesterday.workout && (
          <div style={{ marginTop: 8, fontSize: 11, color: COLORS.textDim }}>
            {yesterday.workout.type} · {yesterday.workout.duration} min
            {yesterday.workout.tss ? ` · TSS ${yesterday.workout.tss}` : ""}
          </div>
        )}
      </Card>

      {/* Generate button */}
      <button onClick={generate} disabled={loading} style={{
        ...primaryBtn, width: "100%", opacity: loading ? 0.6 : 1,
        fontSize: 14, padding: "13px",
      }}>
        {loading ? "Generating briefing…" : "↻ Generate today's briefing"}
      </button>

      {error && (
        <div style={{ fontSize: 12, color: COLORS.red, textAlign: "center" }}>{error}</div>
      )}

      {/* Briefing output */}
      {briefing && (
        <Card style={{ borderColor: COLORS.accent + "44" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <SectionTitle style={{ margin: 0 }}>Daily briefing</SectionTitle>
            {generatedAt && (
              <div style={{ fontSize: 10, color: COLORS.textFaint }}>Generated {generatedAt}</div>
            )}
          </div>
          <BriefingText text={briefing} />
        </Card>
      )}
    </div>
  );
}
