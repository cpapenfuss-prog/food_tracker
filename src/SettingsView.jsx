import { useState } from "react";
import { COLORS, primaryBtn, Label, Input, Card, SectionTitle } from "./shared.jsx";

export default function SettingsView({ settings, onSave }) {
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

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
        <SectionTitle>Daily targets</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><Label>Calories</Label><Input value={form.calories} onChange={v => setForm(f => ({ ...f, calories: v }))} placeholder="2200" type="number" /></div>
          <div><Label>Protein (g)</Label><Input value={form.protein} onChange={v => setForm(f => ({ ...f, protein: v }))} placeholder="180" type="number" /></div>
          <div><Label>Carbs (g)</Label><Input value={form.carbs} onChange={v => setForm(f => ({ ...f, carbs: v }))} placeholder="200" type="number" /></div>
          <div><Label>Fat (g)</Label><Input value={form.fat} onChange={v => setForm(f => ({ ...f, fat: v }))} placeholder="70" type="number" /></div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Personal</SectionTitle>
        <Label>Current weight (kg)</Label>
        <Input value={form.weight} onChange={v => setForm(f => ({ ...f, weight: v }))} placeholder="82" type="number" step="0.1" />
      </Card>

      <Card>
        <SectionTitle>Anthropic API Key</SectionTitle>
        <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 10, lineHeight: 1.5 }}>
          Required for AI meal estimation. Get yours at{" "}
          <a href="https://console.anthropic.com" target="_blank" rel="noreferrer"
            style={{ color: COLORS.accent }}>console.anthropic.com</a>.
          Stored only on this device.
        </div>
        <div style={{ position: "relative" }}>
          <Input
            value={form.apiKey || ""}
            onChange={v => setForm(f => ({ ...f, apiKey: v }))}
            placeholder="sk-ant-..."
            type={showKey ? "text" : "password"}
          />
          <button onClick={() => setShowKey(s => !s)} style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: COLORS.textDim, cursor: "pointer", fontSize: 11,
          }}>{showKey ? "hide" : "show"}</button>
        </div>
      </Card>

      <button onClick={save} style={{ ...primaryBtn, width: "100%" }}>
        {saved ? "✓ Saved" : "Save settings"}
      </button>
      <div style={{ fontSize: 11, color: COLORS.textFaint, textAlign: "center" }}>
        All data stored locally on this device
      </div>
    </div>
  );
}
