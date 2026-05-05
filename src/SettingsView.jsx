import { useState } from "react";
import { COLORS, Card, SectionTitle, Label, Input, primaryBtn } from "./shared.jsx";

export default function SettingsView({ settings, onSave }) {
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  function save() {
    onSave({
      ...form,
      calories: Number(form.calories),
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      fat: Number(form.fat),
      weight: Number(form.weight),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      <Card>
        <SectionTitle>Baseline nutrition targets</SectionTitle>
        <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 14, lineHeight: 1.6 }}>
          These are your sedentary baselines. The app automatically adjusts targets upward based on workouts and walking.
        </div>
        <div style={{ marginBottom: 12 }}>
          <Label>Daily calories (sedentary baseline)</Label>
          <Input value={form.calories} onChange={v => set("calories", v)} placeholder="2200" type="number" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 4 }}>
          <div><Label>Protein (g)</Label><Input value={form.protein} onChange={v => set("protein", v)} placeholder="180" type="number" /></div>
          <div><Label>Carbs (g)</Label><Input value={form.carbs} onChange={v => set("carbs", v)} placeholder="200" type="number" /></div>
          <div><Label>Fat (g)</Label><Input value={form.fat} onChange={v => set("fat", v)} placeholder="70" type="number" /></div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Body</SectionTitle>
        <Label>Weight (kg) — used for burn estimates</Label>
        <Input value={form.weight} onChange={v => set("weight", v)} placeholder="82" type="number" step="0.1" />
      </Card>

      <Card>
        <SectionTitle>AI features</SectionTitle>
        <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 12, lineHeight: 1.6 }}>
          Your Anthropic API key is stored locally on your device only and never sent anywhere except directly to Anthropic's API.
        </div>
        <Label>Anthropic API key</Label>
        <input
          type="password"
          value={form.apiKey}
          onChange={e => set("apiKey", e.target.value)}
          placeholder="sk-ant-..."
          style={{
            width: "100%", background: COLORS.surfaceHigh,
            border: `1px solid ${COLORS.border}`, borderRadius: 8,
            color: COLORS.text, padding: "9px 12px", fontSize: 13,
            fontFamily: "monospace", boxSizing: "border-box", outline: "none",
          }}
        />
        {form.apiKey && (
          <div style={{ marginTop: 8, fontSize: 11, color: COLORS.green }}>
            ✓ API key entered — AI meal estimation and daily briefings are enabled
          </div>
        )}
      </Card>

      <button onClick={save} style={{ ...primaryBtn, width: "100%", fontSize: 15, padding: "14px" }}>
        {saved ? "✓ Saved!" : "Save settings"}
      </button>

      {/* Macro calculator hint */}
      <Card style={{ borderStyle: "dashed", background: COLORS.bg }}>
        <SectionTitle>Macro guide</SectionTitle>
        <div style={{ fontSize: 12, color: COLORS.textDim, lineHeight: 1.8 }}>
          <div>Protein: <strong style={{ color: COLORS.text }}>2.0–2.2 g/kg</strong> body weight</div>
          <div>Carbs: <strong style={{ color: COLORS.text }}>3–5 g/kg</strong> on base days, scales with training</div>
          <div>Fat: <strong style={{ color: COLORS.text }}>0.8–1.0 g/kg</strong> for hormonal health</div>
          {form.weight > 0 && (
            <div style={{ marginTop: 10, padding: "8px 12px", background: COLORS.blueLight, borderRadius: 8 }}>
              <div style={{ fontWeight: 600, color: COLORS.navy, marginBottom: 4 }}>Suggested for {form.weight} kg:</div>
              <div>Protein: {Math.round(form.weight * 2.1)}g</div>
              <div>Carbs: {Math.round(form.weight * 4)}g (rest day)</div>
              <div>Fat: {Math.round(form.weight * 0.9)}g</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
