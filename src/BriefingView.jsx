import { useState } from "react";
import { COLORS, Card, SectionTitle, StatMini, primaryBtn, Label } from "./shared.jsx";
import { computePMC } from "./pmc.js";

// ── PMC Sparkline ─────────────────────────────────────────────────────────────
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
  const toX = i => (i / (history.length - 1)) * W;
  const toY = v => H - ((v - minV) / (maxV - minV)) * H;
  const line = (vals, color, dash = "") => {
    const pts = vals.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
    return <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeDasharray={dash} />;
  };
  const zeroY = toY(0);
  const labelIdxs = [0, Math.floor(history.length / 2), history.length - 1];
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke={COLORS.border} strokeWidth="1" strokeDasharray="3,3" />
        {line(tsbVals, COLORS.purple, "4,2")}
        {line(atlVals, COLORS.red)}
        {line(ctlVals, COLORS.blue)}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: COLORS.textFaint, marginTop: 4 }}>
        {labelIdxs.map(i => <span key={i}>{history[i]?.date.slice(5)}</span>)}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
        {[[COLORS.blue, "CTL (Fitness)", false], [COLORS.red, "ATL (Fatigue)", false], [COLORS.purple, "TSB (Form)", true]].map(([color, label, dashed]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="18" height="8"><line x1="0" y1="4" x2="18" y2="4" stroke={color} strokeWidth="2" strokeDasharray={dashed ? "4,2" : ""} /></svg>
            <span style={{ fontSize: 10, color: COLORS.textDim }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function tsbStatusLabel(tsb) {
  if (tsb > 10) return "Fresh";
  if (tsb > 0) return "Optimal";
  if (tsb > -10) return "Tired";
  if (tsb > -25) return "Fatigued";
  return "Overreached";
}

function tsbColor(tsb) {
  if (tsb > 10) return COLORS.green;
  if (tsb > 0) return COLORS.blue;
  if (tsb > -10) return COLORS.accent;
  if (tsb > -25) return "#f97316";
  return COLORS.red;
}

// Compute dynamic macro targets.
// Only carbs scale with activity — protein is anchored to body weight,
// fat stays moderate. Extra burn calories come almost entirely from carbs.
function dynamicMacros(settings, totalBurn) {
  const extraCarbsG = Math.round(totalBurn / 4); // 4 kcal per gram of carbs
  return {
    calories: settings.calories + totalBurn,
    protein: settings.protein,                    // fixed — body weight based
    carbs: settings.carbs + extraCarbsG,          // scales with burn
    fat: settings.fat,                            // stays moderate
  };
}

// Estimate kJ from normalized power + duration.
// Sports science convention: 1 kJ of mechanical work ≈ 1 kcal of food energy
// (cycling efficiency ~25%, so metabolic cost is ~4x mechanical, but
// kJ output and kcal fuel requirement are numerically equivalent for fueling).
// Alternatively accept a direct kJ entry.
function estimateKJ(watts, durationMin) {
  return Math.round(watts * durationMin * 60 / 1000);
}

// ── Briefing renderer ─────────────────────────────────────────────────────────
function renderInline(text) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} style={{ color: COLORS.text, fontWeight: 700 }}>{part}</strong> : part
  );
}

function BriefingText({ text }) {
  const lines = text.split("\n").filter(l => l.trim());
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {lines.map((line, i) => {
        if (line.startsWith("## ") || (line.startsWith("**") && line.endsWith("**"))) {
          const title = line.replace(/^##\s*/, "").replace(/\*\*/g, "");
          return (
            <div key={i} style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
              color: COLORS.accent, marginTop: i > 0 ? 6 : 0, paddingTop: i > 0 ? 10 : 0,
              borderTop: i > 0 ? `1px solid ${COLORS.border}` : "none",
            }}>{title}</div>
          );
        }
        if (/^\d+\.\s+\*\*/.test(line)) {
          const title = line.replace(/^\d+\.\s+\*\*/, "").replace(/\*\*.*/, "");
          const rest = line.replace(/^\d+\.\s+\*\*[^*]+\*\*\s*—?\s*/, "");
          return (
            <div key={i}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
                color: COLORS.accent, marginTop: i > 0 ? 6 : 0, paddingTop: i > 0 ? 10 : 0,
                borderTop: i > 0 ? `1px solid ${COLORS.border}` : "none", marginBottom: 4,
              }}>{title}</div>
              {rest && <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6 }}>{renderInline(rest)}</div>}
            </div>
          );
        }
        return <div key={i} style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6 }}>{renderInline(line)}</div>;
      })}
    </div>
  );
}

// ── AI call ───────────────────────────────────────────────────────────────────
async function generateBriefing({ yesterday, todayData, dayDescription, plannedRide, pmc, settings, apiKey, last7 }) {

  // Dynamic macro targets based on yesterday's actual total burn
  const yestTargets = dynamicMacros(settings, yesterday.totalBurn);

  // Planned ride kJ if watts + duration provided
  const plannedKJ = plannedRide.watts && plannedRide.duration
    ? estimateKJ(Number(plannedRide.watts), Number(plannedRide.duration))
    : null;

  // Today's dynamic targets based on planned burn
  const todayTargets = dynamicMacros(settings, todayData.burn + (plannedKJ || 0));

  // Rest day detection
  const isRestDay = !plannedRide.duration && !todayData.workout;

  const prompt = `You are an expert sports nutritionist and performance coach advising an experienced endurance athlete. Cyclist and runner, ~25 years experience. Goal: body composition improvement (leaner) while maintaining and building endurance performance. Currently using WHOOP, power meter, TrainingPeaks-style PMC tracking.

Be direct, specific, and use numbers. No generic advice. Write like a coach who knows this athlete well.

---

## ATHLETE BASELINE TARGETS
- Baseline calories (sedentary): ${settings.calories} kcal
- Baseline macros: Protein ${settings.protein}g / Carbs ${settings.carbs}g / Fat ${settings.fat}g
- Note: These are baselines. All recommendations must use ACTIVITY-ADJUSTED targets.

---

## YESTERDAY'S FULL PICTURE
Training:
- Workout: ${yesterday.workout ? `${yesterday.workout.type}, ${yesterday.workout.duration} min, TSS ${yesterday.workout.tss || "not logged"}, ${yesterday.workout.calories || 0} kcal burned` : "Rest day / no workout logged"}
- Walking: ${yesterday.walkMinutes > 0 ? `${yesterday.walkMinutes} min (~${Math.round(yesterday.walkMinutes * 4.5)} kcal)` : "none logged"}
- Total burn above baseline: ${yesterday.totalBurn} kcal
- Adjusted targets for yesterday: ${yestTargets.calories} kcal / P:${yestTargets.protein}g / C:${yestTargets.carbs}g / F:${yestTargets.fat}g

Nutrition consumed:
- Calories: ${yesterday.calories} kcal (${yesterday.calories > yestTargets.calories ? `OVER by ${yesterday.calories - yestTargets.calories}` : `UNDER by ${yestTargets.calories - yesterday.calories}`} vs adjusted target)
- Protein: ${yesterday.protein}g (target ${yestTargets.protein}g, ${yesterday.protein >= yestTargets.protein ? "✓ hit" : `short by ${yestTargets.protein - yesterday.protein}g`})
- Carbs: ${yesterday.carbs}g (target ${yestTargets.carbs}g, ${yesterday.carbs >= yestTargets.carbs ? "✓ hit" : `short by ${yestTargets.carbs - yesterday.carbs}g`})
- Fat: ${yesterday.fat}g (target ${yestTargets.fat}g)

---

## LAST 7 DAYS TRAINING SUMMARY
${last7.map(d => `- ${d.date}: ${d.workout ? `${d.workout.type} TSS:${d.workout.tss || "?"} ${d.workout.calories || 0}kcal` : "rest"} | ate ${d.calories}kcal`).join("\n")}

---

## TODAY'S WHOOP / RECOVERY
- Recovery score: ${todayData.whoop?.recovery ?? "not logged"}%
- HRV: ${todayData.whoop?.hrv ?? "not logged"} ms
- RHR: ${todayData.whoop?.rhr ?? "not logged"} bpm
- Sleep: ${todayData.whoop?.sleep ?? "not logged"} hours

---

## PERFORMANCE MANAGEMENT CHART
- CTL (Fitness, 42d): ${pmc.ctl}
- ATL (Fatigue, 7d): ${pmc.atl}
- TSB (Form): ${pmc.tsb > 0 ? "+" : ""}${pmc.tsb} → ${tsbStatusLabel(pmc.tsb)}
- 7-day ramp rate: ${pmc.rampRate > 0 ? "+" : ""}${pmc.rampRate} CTL/week

---

## TODAY'S PLAN (athlete's own words)
"${dayDescription || "No description provided"}"

${plannedRide.duration ? `
## PLANNED RIDE DETAILS
- Duration: ${plannedRide.duration} min
- Normalized power target: ${plannedRide.watts || "not specified"} W
- Estimated kJ: ${plannedKJ || "calculate from above"}
- Ride type/zone: ${plannedRide.type || "not specified"}
` : ""}

${isRestDay ? "## TODAY IS A REST DAY" : ""}

---

Write a structured briefing with these sections:

**1. Recovery & Readiness**
Interpret WHOOP data in the context of yesterday's load and current TSB. What does the HRV/RHR tell us specifically? Is the recovery score consistent with the training stress? What should the athlete be aware of physically today?

**2. Yesterday's Fueling Analysis**
Evaluate nutrition against the ACTIVITY-ADJUSTED targets (not baseline). Was the protein/carb intake appropriate for the actual training done? If there was a deficit in carbs on a hard training day, what's the likely glycogen status now? If they over-ate on a rest day, what's the impact? Be specific about consequences.

**3. Today's Fueling Strategy**
${isRestDay ? `
This is a rest/recovery day. Recommend:
- Adjusted calorie target (should be BELOW baseline given body comp goal, but account for CTL/ATL — high fitness base still needs fueling)
- Macro split optimised for recovery: prioritise protein for muscle repair, moderate carbs to top up glycogen, keep fat moderate
- Meal timing for recovery
- Specific gram targets for protein, carbs, fat
` : `
Provide specific targets based on today's plan:
- Total calorie target (baseline + estimated burn)
- Macro breakdown: Protein ${todayTargets.protein}g / Carbs ${todayTargets.carbs}g / Fat ${todayTargets.fat}g (adjust if needed based on context)
- Pre-workout meal: timing, composition, specific grams
- Meal timing around any nap or recovery mentioned in the plan
`}

${plannedRide.duration && Number(plannedRide.duration) >= 60 ? `
**4. On-Bike Fueling Protocol**
Based on ${plannedRide.duration} min at ${plannedRide.watts || "estimated"} W (~${plannedKJ || "?"} kJ):
- Carbohydrate target per hour (use 60-90g/hr range depending on intensity and gut tolerance)
- Start fueling timing (first 20-30 min rule)
- Hydration targets (ml/hr based on typical conditions)
- Specific product suggestions (gels, bars, bottles — keep practical)
- Post-ride recovery window: exact timing and what to eat within 30 min

**5. Training Load Insight**
` : `
**4. Training Load Insight**
`}
Comment on CTL/ATL/TSB trend. Is the current ramp rate sustainable? Any overreaching risk signals? What does TSB of ${pmc.tsb} mean for performance this week? Recommendations for the next 3-5 days of training structure.

**${plannedRide.duration && Number(plannedRide.duration) >= 60 ? "6" : "5"}. Priority Action**
One single most important thing for today. Be specific.

Write as a knowledgeable coach. Use numbers throughout. Be direct.`;

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
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.find(b => b.type === "text")?.text || "";
}

// ── Main View ─────────────────────────────────────────────────────────────────
export default function BriefingView({ allData, settings, updateDay, todayKey }) {
  const [briefing, setBriefing] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState(null);

  // Planned ride inputs
  const [plannedDuration, setPlannedDuration] = useState("");
  const [plannedWatts, setPlannedWatts] = useState("");
  const [plannedType, setPlannedType] = useState("");
  const [plannedKJDirect, setPlannedKJDirect] = useState("");

  // kJ resolution: direct entry takes priority over calculated
  const calculatedKJ = plannedWatts && plannedDuration
    ? estimateKJ(Number(plannedWatts), Number(plannedDuration))
    : null;
  const plannedKJ = plannedKJDirect ? Number(plannedKJDirect) : calculatedKJ;

  const pmc = computePMC(allData);
  const { ctl, atl, tsb, history, rampRate } = pmc;
  const status = tsbStatusLabel(tsb);
  const statusCol = tsbColor(tsb);

  // Day description — stored in today's data so Dashboard can show it
  const todayRaw = allData[todayKey] || {};
  const dayDescription = todayRaw.dayDescription || "";

  function saveDayDescription(val) {
    updateDay({ dayDescription: val });
  }

  // Yesterday
  const yesterday = (() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    const key = d.toISOString().slice(0, 10);
    const day = allData[key] || {};
    const workoutBurn = day.workout?.calories || 0;
    const walkBurn = Math.round((day.walk?.minutes || 0) * 4.5);
    const totalBurn = workoutBurn + walkBurn;
    const meals = day.meals || [];
    return {
      calories: meals.reduce((s, m) => s + (m.calories || 0), 0),
      protein: meals.reduce((s, m) => s + (m.protein || 0), 0),
      carbs: meals.reduce((s, m) => s + (m.carbs || 0), 0),
      fat: meals.reduce((s, m) => s + (m.fat || 0), 0),
      totalBurn, workout: day.workout || null,
      walkMinutes: day.walk?.minutes || 0,
    };
  })();

  // Today
  const todayBurn = (todayRaw.workout?.calories || 0) + Math.round((todayRaw.walk?.minutes || 0) * 4.5);
  const todayData = {
    whoop: todayRaw.whoop || null,
    workout: todayRaw.workout || null,
    calories: (todayRaw.meals || []).reduce((s, m) => s + (m.calories || 0), 0),
    burn: todayBurn,
  };

  // Yesterday's adjusted targets for display
  const yestTargets = dynamicMacros(settings, yesterday.totalBurn);

  // Last 7 days summary
  const last7 = (() => {
    const result = [];
    for (let i = 6; i >= 1; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const day = allData[key] || {};
      const meals = day.meals || [];
      result.push({
        date: key.slice(5),
        workout: day.workout || null,
        calories: meals.reduce((s, m) => s + (m.calories || 0), 0),
      });
    }
    return result;
  })();

  async function generate() {
    if (!settings.apiKey) { setError("Add your Anthropic API key in Settings first."); return; }
    setLoading(true); setError(""); setBriefing("");
    try {
      const text = await generateBriefing({
        yesterday, todayData, dayDescription,
        plannedRide: { duration: plannedDuration, watts: plannedWatts, type: plannedType },
        pmc, settings, apiKey: settings.apiKey, last7,
      });
      setBriefing(text);
      setGeneratedAt(new Date().toLocaleTimeString("en-DE", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      setError("Could not generate briefing: " + e.message);
    }
    setLoading(false);
  }

  const RIDE_TYPES = ["Z1 Recovery", "Z2 Endurance", "Tempo", "Sweet Spot", "VO2max", "Race"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* PMC */}
      <Card>
        <SectionTitle>Training load · PMC</SectionTitle>
        <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <StatMini label="CTL · Fitness" val={ctl} color={COLORS.blue} />
          <StatMini label="ATL · Fatigue" val={atl} color={COLORS.red} />
          <div>
            <div style={{ fontSize: 11, color: COLORS.textFaint, letterSpacing: 0.5, textTransform: "uppercase" }}>TSB · Form</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: statusCol, lineHeight: 1.2, marginTop: 2 }}>
              {tsb > 0 ? "+" : ""}{tsb}
              <span style={{ fontSize: 10, color: statusCol, marginLeft: 6, fontFamily: "sans-serif", fontWeight: 600 }}>{status}</span>
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

      {/* Yesterday snapshot with adjusted targets */}
      <Card>
        <SectionTitle>Yesterday · adjusted targets</SectionTitle>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
          {[
            ["Eaten", yesterday.calories || "—", COLORS.accent],
            ["Target", yestTargets.calories, COLORS.textDim],
            ["Gap", yesterday.calories > 0
              ? (yesterday.calories > yestTargets.calories
                ? `+${yesterday.calories - yestTargets.calories}`
                : `-${yestTargets.calories - yesterday.calories}`)
              : "—",
              yesterday.calories > yestTargets.calories ? COLORS.red : COLORS.green],
          ].map(([label, val, color]) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: COLORS.textFaint, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
              <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700, color, marginTop: 2 }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[["P", yesterday.protein, yestTargets.protein, COLORS.green], ["C", yesterday.carbs, yestTargets.carbs, COLORS.accent], ["F", yesterday.fat, yestTargets.fat, COLORS.purple]].map(([label, val, target, color]) => (
            <div key={label} style={{ fontSize: 11, color: COLORS.textDim }}>
              <span style={{ color }}>{label}:</span> {val}g <span style={{ color: COLORS.textFaint }}>/ {target}g</span>
            </div>
          ))}
        </div>
        {yesterday.workout && (
          <div style={{ marginTop: 6, fontSize: 11, color: COLORS.textFaint }}>
            {yesterday.workout.type} · {yesterday.workout.duration}min · TSS {yesterday.workout.tss || "?"} · {yesterday.totalBurn} kcal burned
          </div>
        )}
      </Card>

      {/* Day description */}
      <Card>
        <SectionTitle>How are you feeling today? What's the plan?</SectionTitle>
        <textarea
          value={dayDescription}
          onChange={e => saveDayDescription(e.target.value)}
          placeholder="e.g. Feeling a bit tired, legs heavy. Planning a 2hr Z2 ride this afternoon, then afternoon nap. Important meeting tonight so no evening training."
          rows={3}
          style={{
            width: "100%", background: COLORS.surfaceHigh, border: `1px solid ${COLORS.border}`,
            borderRadius: 8, color: COLORS.text, padding: "10px 12px", fontSize: 13,
            resize: "none", fontFamily: "inherit", boxSizing: "border-box", outline: "none",
          }}
        />
      </Card>

      {/* Planned ride inputs */}
      <Card>
        <SectionTitle>Planned ride (optional)</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <Label>Duration (min)</Label>
            <input type="number" value={plannedDuration} onChange={e => setPlannedDuration(e.target.value)}
              placeholder="120"
              style={{ width: "100%", background: COLORS.surfaceHigh, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, padding: "8px 10px", fontSize: 14, fontFamily: "monospace", boxSizing: "border-box", outline: "none" }} />
          </div>
          <div>
            <Label>Norm. power (W)</Label>
            <input type="number" value={plannedWatts} onChange={e => setPlannedWatts(e.target.value)}
              placeholder="200"
              style={{ width: "100%", background: COLORS.surfaceHigh, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, padding: "8px 10px", fontSize: 14, fontFamily: "monospace", boxSizing: "border-box", outline: "none" }} />
          </div>
          <div>
            <Label>Or enter kJ directly</Label>
            <input type="number" value={plannedKJDirect} onChange={e => setPlannedKJDirect(e.target.value)}
              placeholder="1500"
              style={{ width: "100%", background: COLORS.surfaceHigh, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, padding: "8px 10px", fontSize: 14, fontFamily: "monospace", boxSizing: "border-box", outline: "none" }} />
          </div>
        </div>

        {/* Ride type */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {RIDE_TYPES.map(t => (
            <button key={t} onClick={() => setPlannedType(t === plannedType ? "" : t)} style={{
              background: plannedType === t ? COLORS.accent + "22" : COLORS.surfaceHigh,
              border: `1px solid ${plannedType === t ? COLORS.accent : COLORS.border}`,
              color: plannedType === t ? COLORS.accent : COLORS.textDim,
              borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer",
            }}>{t}</button>
          ))}
        </div>

        {plannedKJ && (
          <div style={{ display: "flex", gap: 16, padding: "8px 10px", background: COLORS.surfaceHigh, borderRadius: 8 }}>
            <StatMini label="Est. kJ" val={plannedKJ} color={COLORS.blue} />
            <StatMini label="≈ kcal" val={plannedKJ} color={COLORS.accent} />
            <StatMini label="Carbs/hr" val={Math.min(90, Math.round(plannedKJ / (Number(plannedDuration) || 60) * 60 * 0.25))} unit="g" color={COLORS.green} />
          </div>
        )}
      </Card>

      {/* Generate */}
      <button onClick={generate} disabled={loading} style={{
        ...primaryBtn, width: "100%", opacity: loading ? 0.6 : 1, fontSize: 14, padding: "13px",
      }}>
        {loading ? "Generating briefing…" : "↻ Generate today's briefing"}
      </button>

      {error && <div style={{ fontSize: 12, color: COLORS.red, textAlign: "center" }}>{error}</div>}

      {/* Output */}
      {briefing && (
        <Card style={{ borderColor: COLORS.accent + "44" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <SectionTitle style={{ margin: 0 }}>Daily briefing</SectionTitle>
            {generatedAt && <div style={{ fontSize: 10, color: COLORS.textFaint }}>Generated {generatedAt}</div>}
          </div>
          <BriefingText text={briefing} />
        </Card>
      )}
    </div>
  );
}
