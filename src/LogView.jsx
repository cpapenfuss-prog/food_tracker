import { useState } from "react";
import { COLORS, Card, SectionTitle, Label, Input, primaryBtn, ghostBtn, chipBtn, StatMini, feelColor, feelColor2 } from "./shared.jsx";

async function estimateMeal(description, apiKey) {
  const prompt = `You are a sports nutrition assistant helping an endurance athlete (cyclist/runner) track macros for body composition (getting leaner while fueling performance).

Estimate the macros for this meal: "${description}"

Return ONLY valid JSON, no markdown, no explanation:
{
  "name": "short meal name",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "confidence": "high" | "medium" | "low",
  "note": "one brief note about the estimate"
}

Be realistic. Restaurant portions are typically larger than home portions. Round to nearest 5g for macros.`;

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
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.content?.find(b => b.type === "text")?.text || "{}";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

function Tag({ label, color }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600,
      letterSpacing: 0.5, textTransform: "uppercase",
    }}>{label}</span>
  );
}

function FoodLogger({ dayData, updateDay, apiKey }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  const QUICK = [
    "Scrambled eggs with toast",
    "Greek yogurt with berries",
    "Chicken breast with rice and salad",
    "Protein shake with milk",
    "Pasta with tomato sauce",
    "Salmon with vegetables",
    "Overnight oats",
    "Avocado toast with egg",
  ];

  async function estimate() {
    if (!input.trim()) return;
    if (!apiKey) { setError("Add your Anthropic API key in Settings first."); return; }
    setLoading(true); setError(""); setPreview(null);
    try {
      const result = await estimateMeal(input, apiKey);
      setPreview(result);
    } catch (e) {
      setError("Could not estimate: " + e.message);
    }
    setLoading(false);
  }

  function add() {
    if (!preview) return;
    const meals = [...(dayData.meals || []), { ...preview, id: Date.now() }];
    updateDay({ meals });
    setInput(""); setPreview(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Card>
        <SectionTitle>Describe your meal</SectionTitle>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="e.g. Wiener Schnitzel with potato salad at a Munich restaurant, medium portion"
          rows={3}
          style={{
            width: "100%", background: COLORS.surfaceHigh, border: `1px solid ${COLORS.border}`,
            borderRadius: 8, color: COLORS.text, padding: "10px 12px", fontSize: 13,
            resize: "none", fontFamily: "inherit", boxSizing: "border-box", outline: "none",
          }}
        />
        <button onClick={estimate} disabled={loading || !input.trim()} style={{
          ...primaryBtn, marginTop: 10, opacity: loading || !input.trim() ? 0.5 : 1, width: "100%",
        }}>
          {loading ? "Estimating…" : "Estimate with AI →"}
        </button>
        {error && <div style={{ fontSize: 12, color: COLORS.red, marginTop: 8 }}>{error}</div>}
      </Card>

      {preview && (
        <Card style={{ borderColor: COLORS.accent + "66" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{preview.name}</div>
              <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{preview.note}</div>
            </div>
            <Tag label={preview.confidence}
              color={preview.confidence === "high" ? COLORS.green : preview.confidence === "medium" ? COLORS.accent : COLORS.red} />
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <StatMini label="Cal" val={preview.calories} color={COLORS.accent} />
            <StatMini label="Protein" val={preview.protein + "g"} color={COLORS.green} />
            <StatMini label="Carbs" val={preview.carbs + "g"} color={COLORS.blue} />
            <StatMini label="Fat" val={preview.fat + "g"} color={COLORS.purple} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={add} style={{ ...primaryBtn, flex: 1 }}>Add to log</button>
            <button onClick={() => setPreview(null)} style={ghostBtn}>✕</button>
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>Quick templates</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {QUICK.map(q => (
            <button key={q} onClick={() => setInput(q)} style={{
              background: COLORS.surfaceHigh, border: `1px solid ${COLORS.border}`,
              color: COLORS.textDim, borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer",
            }}>{q}</button>
          ))}
        </div>
      </Card>

      {dayData.meals?.length > 0 && (
        <Card>
          <SectionTitle>Today's log</SectionTitle>
          {dayData.meals.map((m, i) => (
            <div key={m.id || i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0",
              borderBottom: i < dayData.meals.length - 1 ? `1px solid ${COLORS.border}` : "none",
            }}>
              <div>
                <div style={{ fontSize: 13 }}>{m.name}</div>
                <div style={{ fontSize: 10, color: COLORS.textFaint }}>P:{m.protein}g C:{m.carbs}g F:{m.fat}g</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "monospace", color: COLORS.accent, fontSize: 13 }}>{m.calories}</span>
                <button onClick={() => updateDay({ meals: dayData.meals.filter((_, j) => j !== i) })}
                  style={{ background: "none", border: "none", color: COLORS.textFaint, cursor: "pointer", fontSize: 14, padding: "2px 4px" }}>×</button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function WorkoutLogger({ dayData, updateDay }) {
  const w = dayData.workout || {};
  const [form, setForm] = useState({
    type: w.type || "", duration: w.duration || "",
    tss: w.tss || "", calories: w.calories || "", feel: w.feel || "",
  });
  const TYPES = ["Road Cycling", "Running", "Trail Run", "Strength", "Swim", "Recovery Ride", "Zwift"];
  const FEELS = ["great", "good", "ok", "bad"];

  function save() {
    updateDay({ workout: { ...form, duration: Number(form.duration), tss: Number(form.tss), calories: Number(form.calories) } });
  }

  return (
    <Card>
      <SectionTitle>Log workout</SectionTitle>
      <div style={{ marginBottom: 12 }}>
        <Label>Type</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {TYPES.map(t => (
            <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{
              ...chipBtn, borderColor: form.type === t ? COLORS.accent : COLORS.border,
              color: form.type === t ? COLORS.accent : COLORS.textDim,
            }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div><Label>Duration (min)</Label><Input value={form.duration} onChange={v => setForm(f => ({ ...f, duration: v }))} placeholder="90" type="number" /></div>
        <div><Label>TSS</Label><Input value={form.tss} onChange={v => setForm(f => ({ ...f, tss: v }))} placeholder="120" type="number" /></div>
        <div><Label>Calories</Label><Input value={form.calories} onChange={v => setForm(f => ({ ...f, calories: v }))} placeholder="800" type="number" /></div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Label>How did it feel?</Label>
        <div style={{ display: "flex", gap: 6 }}>
          {FEELS.map(f => (
            <button key={f} onClick={() => setForm(frm => ({ ...frm, feel: f }))} style={{
              ...chipBtn, flex: 1, borderColor: form.feel === f ? feelColor(f) : COLORS.border,
              color: form.feel === f ? feelColor(f) : COLORS.textDim,
            }}>{f}</button>
          ))}
        </div>
      </div>
      <button onClick={save} style={{ ...primaryBtn, width: "100%" }}>Save workout</button>
    </Card>
  );
}

function WalkLogger({ dayData, updateDay }) {
  const [minutes, setMinutes] = useState(dayData.walk?.minutes ?? "");
  const burn = Math.round((Number(minutes) || 0) * 4.5);

  function save() {
    updateDay({ walk: { minutes: Number(minutes) } });
  }

  return (
    <Card>
      <SectionTitle>Walking</SectionTitle>
      <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 12, lineHeight: 1.5 }}>
        Enter total walking time for the day. Estimated burn uses 4.5 kcal/min (~80 kg). This adds to your calorie target.
      </div>
      <Label>Minutes walked</Label>
      <Input value={minutes} onChange={setMinutes} placeholder="e.g. 45" type="number" />
      {minutes > 0 && (
        <div style={{ marginTop: 10, padding: "10px 12px", background: COLORS.surfaceHigh, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: COLORS.textDim }}>{minutes} min walking</span>
          <span style={{ fontFamily: "monospace", color: COLORS.blue, fontWeight: 700 }}>~{burn} kcal</span>
        </div>
      )}
      <button onClick={save} style={{ ...primaryBtn, width: "100%", marginTop: 12 }}>Save</button>
    </Card>
  );
}

function WhoopLogger({ dayData, updateDay }) {
  const wh = dayData.whoop || {};
  const [form, setForm] = useState({ recovery: wh.recovery ?? "", hrv: wh.hrv ?? "", rhr: wh.rhr ?? "", sleep: wh.sleep ?? "" });

  function save() {
    updateDay({ whoop: { recovery: Number(form.recovery), hrv: Number(form.hrv), rhr: Number(form.rhr), sleep: Number(form.sleep) } });
  }

  return (
    <Card>
      <SectionTitle>WHOOP Recovery</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div><Label>Recovery % (0–100)</Label><Input value={form.recovery} onChange={v => setForm(f => ({ ...f, recovery: v }))} placeholder="72" type="number" /></div>
        <div><Label>HRV (ms)</Label><Input value={form.hrv} onChange={v => setForm(f => ({ ...f, hrv: v }))} placeholder="68" type="number" /></div>
        <div><Label>RHR (bpm)</Label><Input value={form.rhr} onChange={v => setForm(f => ({ ...f, rhr: v }))} placeholder="48" type="number" /></div>
        <div><Label>Sleep (h)</Label><Input value={form.sleep} onChange={v => setForm(f => ({ ...f, sleep: v }))} placeholder="7.5" type="number" step="0.1" /></div>
      </div>
      <button onClick={save} style={{ ...primaryBtn, width: "100%" }}>Save WHOOP data</button>
    </Card>
  );
}

function BodyLogger({ dayData, updateDay }) {
  const b = dayData.body || {};
  const [form, setForm] = useState({ weight: b.weight ?? "", energy: b.energy ?? "" });

  function save() {
    updateDay({ body: { weight: Number(form.weight), energy: Number(form.energy) } });
  }

  return (
    <Card>
      <SectionTitle>Body & Energy</SectionTitle>
      <div style={{ marginBottom: 12 }}>
        <Label>Weight (kg)</Label>
        <Input value={form.weight} onChange={v => setForm(f => ({ ...f, weight: v }))} placeholder="82.0" type="number" step="0.1" />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Label>Subjective energy (1–10)</Label>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {[1,2,3,4,5,6,7,8,9,10].map(e => (
            <button key={e} onClick={() => setForm(f => ({ ...f, energy: e }))} style={{
              width: 36, height: 36,
              background: form.energy === e ? feelColor2(e) : COLORS.surfaceHigh,
              border: `1px solid ${form.energy === e ? feelColor2(e) : COLORS.border}`,
              color: form.energy === e ? "#000" : COLORS.textDim,
              borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>{e}</button>
          ))}
        </div>
      </div>
      <button onClick={save} style={{ ...primaryBtn, width: "100%" }}>Save</button>
    </Card>
  );
}

export default function LogView({ dayData, updateDay, apiKey }) {
  const [section, setSection] = useState("food");
  const tabs = [["food", "Food"], ["workout", "Workout"], ["walk", "Walk"], ["whoop", "WHOOP"], ["body", "Body"]];

  return (
    <div>
      <div style={{ display: "flex", background: COLORS.surfaceHigh, borderRadius: 8, padding: 3, marginBottom: 16, overflowX: "auto" }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setSection(id)} style={{
            flex: 1, background: section === id ? COLORS.accent : "none",
            color: section === id ? "#000" : COLORS.textDim,
            border: "none", borderRadius: 6, padding: "7px 6px",
            fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}>{label}</button>
        ))}
      </div>
      {section === "food" && <FoodLogger dayData={dayData} updateDay={updateDay} apiKey={apiKey} />}
      {section === "workout" && <WorkoutLogger dayData={dayData} updateDay={updateDay} />}
      {section === "walk" && <WalkLogger dayData={dayData} updateDay={updateDay} />}
      {section === "whoop" && <WhoopLogger dayData={dayData} updateDay={updateDay} />}
      {section === "body" && <BodyLogger dayData={dayData} updateDay={updateDay} />}
    </div>
  );
}
