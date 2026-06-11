import { useState } from "react";
import { COLORS, Card, SectionTitle, Label, Input, primaryBtn } from "./shared.jsx";

export default function SettingsView({ settings, onSave, allData }) {
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  function save() {
    onSave({
      ...form,
      calories: Number(form.calories),
      rmr: Number(form.rmr) || null,
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      fat: Number(form.fat),
      weight: Number(form.weight),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const bw = Number(form.weight) || 80;
  // RMR display: measured value takes priority, otherwise back-calculate
  const rmrDisplay = form.rmr
    ? Number(form.rmr)
    : Math.round(Number(form.calories) / 1.55);
  const baseTarget = Math.round(rmrDisplay * 1.15);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      <Card>
        <SectionTitle>Resting Metabolic Rate (RMR)</SectionTitle>
        <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 14, lineHeight: 1.6 }}>
          Enter your <strong>measured RMR</strong> if you have it (metabolic test or Withings scale).
          This is the anchor for all daily calorie targets. If left blank, the app
          back-calculates from your sedentary baseline below.
        </div>
        <Label>Measured RMR (kcal/day)</Label>
        <Input value={form.rmr || ""} onChange={v => set("rmr", v)} placeholder="e.g. 2150" type="number" />
        <div style={{ fontSize: 11, color: COLORS.textFaint, marginTop: 4 }}>
          Base daily target (RMR × 1.15): <strong>{baseTarget.toLocaleString()} kcal</strong>
        </div>
      </Card>

      <Card>
        <SectionTitle>Sedentary baseline (fallback)</SectionTitle>
        <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 14, lineHeight: 1.6 }}>
          Only used to back-calculate RMR if no measured value is entered above (RMR = baseline ÷ 1.55).
        </div>
        <Label>Daily calories — sedentary baseline</Label>
        <Input value={form.calories} onChange={v => set("calories", v)} placeholder="2200" type="number" />
        {!form.rmr && (
          <div style={{ fontSize: 11, color: COLORS.textFaint, marginTop: 4 }}>
            Implied RMR: {Math.round(Number(form.calories) / 1.55).toLocaleString()} kcal/day
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 4 }}>
            <div><Label>Protein (g)</Label><Input value={form.protein} onChange={v => set("protein", v)} placeholder="180" type="number" /></div>
            <div><Label>Carbs (g)</Label><Input value={form.carbs} onChange={v => set("carbs", v)} placeholder="200" type="number" /></div>
            <div><Label>Fat (g)</Label><Input value={form.fat} onChange={v => set("fat", v)} placeholder="70" type="number" /></div>
          </div>
          <div style={{ fontSize: 11, color: COLORS.textFaint, marginTop: 4 }}>
            Fallback macros — only used if dynamic calculation fails.
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Body</SectionTitle>
        <Label>Bodyweight (kg) — used for macro targets</Label>
        <Input value={form.weight} onChange={v => set("weight", v)} placeholder="82" type="number" step="0.1" />
        {bw > 0 && (
          <div style={{ marginTop: 10, padding: "10px 12px", background: COLORS.blueLight, borderRadius: 8, fontSize: 12, color: COLORS.navy, lineHeight: 1.8 }}>
            <strong>Dynamic macro targets at {bw} kg:</strong><br />
            Protein: {Math.round(bw * 1.85)}g (1.85g/kg — fixed)<br />
            Carbs: {Math.round(bw * 3)}–{Math.round(bw * 7)}g (3–7g/kg — scales with load)<br />
            Fat floor: {Math.round(bw * 0.8)}g (0.8g/kg minimum)
          </div>
        )}
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
    </div>
  );
}
