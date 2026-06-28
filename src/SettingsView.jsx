import { useState } from "react";
import { COLORS, Card, SectionTitle, Label, Input, primaryBtn } from "./shared.jsx";

const LB_PER_KG = 2.2046226218;

export default function SettingsView({ settings, onSave, allData }) {
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  // Weight is entered in lbs but stored canonically in kg (everything downstream
  // — pmc.js, macro table, history — reads kg). Seed the field from stored kg.
  const [weightLb, setWeightLb] = useState(
    settings.weight ? (Number(settings.weight) * LB_PER_KG).toFixed(1) : ""
  );

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  const bwKg = Number(weightLb) ? Number(weightLb) / LB_PER_KG : (Number(form.weight) || 80);

  function save() {
    onSave({
      ...form,
      calories: Number(form.calories),
      rmr: Number(form.rmr) || null,
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      fat: Number(form.fat),
      // store kg, rounded to 2 dp; fall back to existing value if field is blank
      weight: weightLb ? Number((Number(weightLb) / LB_PER_KG).toFixed(2)) : Number(form.weight),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

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
        <Label>Bodyweight (lbs) — used for macro targets</Label>
        <Input value={weightLb} onChange={setWeightLb} placeholder="180" type="number" step="0.1" />
        <div style={{ fontSize: 11, color: COLORS.textFaint, marginTop: 4 }}>
          = {bwKg.toFixed(1)} kg (stored internally for all calculations)
        </div>
        {bwKg > 0 && (
          <div style={{ marginTop: 10, padding: "10px 12px", background: COLORS.blueLight, borderRadius: 8, fontSize: 12, color: COLORS.navy, lineHeight: 1.8 }}>
            <strong>Effort-based macro targets at {Math.round(bwKg)} kg:</strong><br />
            Protein: {Math.round(bwKg * 1.6)}–{Math.round(bwKg * 2.2)}g (1.6–2.2 g/kg by effort)<br />
            Carbs: {Math.round(bwKg * 3)}–{Math.round(bwKg * 9)}g (3–9 g/kg by effort)<br />
            Fat: {Math.round(bwKg * 0.8)}–{Math.round(bwKg * 1.4)}g (0.8–1.4 g/kg by effort)
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
