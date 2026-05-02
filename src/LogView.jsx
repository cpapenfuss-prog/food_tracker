import { useState, useRef } from "react";
import { COLORS, Card, SectionTitle, Label, Input, primaryBtn, ghostBtn, chipBtn, StatMini, feelColor, feelColor2 } from "./shared.jsx";

// ── API call — handles text only, image only, or both ─────────────────────────
async function estimateMeal(description, apiKey, imageBase64 = null, imageType = "image/jpeg") {
  const instructions = `You are a sports nutrition assistant helping an endurance athlete (cyclist/runner) track macros for body composition (getting leaner while fueling performance).

${imageBase64 ? "Analyze the food photo provided" : ""}${imageBase64 && description ? " along with this description: " : ""}${!imageBase64 && description ? `Estimate macros for: ` : ""}${description ? `"${description}"` : ""}

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

Be realistic about portion sizes. Restaurant portions are larger than home portions. If you can see the plate in the photo, use it to judge portion size. Round to nearest 5g for macros.`;

  const content = imageBase64
    ? [
        { type: "image", source: { type: "base64", media_type: imageType, data: imageBase64 } },
        { type: "text", text: instructions },
      ]
    : instructions;

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
      messages: [{ role: "user", content }],
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

// ── Editable meal log ─────────────────────────────────────────────────────────
function MealLog({ meals, updateDay }) {
  const [editIdx, setEditIdx] = useState(null);
  const [editForm, setEditForm] = useState({});

  function startEdit(i) { setEditIdx(i); setEditForm({ ...meals[i] }); }

  function saveEdit() {
    const updated = meals.map((m, i) => i === editIdx ? {
      ...m,
      name: editForm.name,
      calories: Number(editForm.calories),
      protein: Number(editForm.protein),
      carbs: Number(editForm.carbs),
      fat: Number(editForm.fat),
    } : m);
    updateDay({ meals: updated });
    setEditIdx(null);
  }

  function deleteEntry(i) {
    updateDay({ meals: meals.filter((_, j) => j !== i) });
    if (editIdx === i) setEditIdx(null);
  }

  return (
    <Card>
      <SectionTitle>Today's log</SectionTitle>
      {meals.map((m, i) => (
        <div key={m.id || i}>
          {editIdx === i ? (
            <div style={{ padding: "10px 0", borderBottom: i < meals.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
              <input
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                style={{
                  width: "100%", background: COLORS.surfaceHigh, border: `1px solid ${COLORS.accent}55`,
                  borderRadius: 6, color: COLORS.text, padding: "6px 8px", fontSize: 13,
                  fontFamily: "inherit", boxSizing: "border-box", marginBottom: 8, outline: "none",
                }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
                {[["calories", "kcal"], ["protein", "P(g)"], ["carbs", "C(g)"], ["fat", "F(g)"]].map(([field, label]) => (
                  <div key={field}>
                    <div style={{ fontSize: 9, color: COLORS.textFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
                    <input
                      type="number"
                      value={editForm[field]}
                      onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                      style={{
                        width: "100%", background: COLORS.surfaceHigh, border: `1px solid ${COLORS.border}`,
                        borderRadius: 5, color: COLORS.text, padding: "5px 6px", fontSize: 12,
                        fontFamily: "monospace", boxSizing: "border-box", outline: "none",
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={saveEdit} style={{ ...primaryBtn, flex: 1, padding: "7px" }}>Save</button>
                <button onClick={() => setEditIdx(null)} style={{ ...ghostBtn, padding: "7px 12px" }}>Cancel</button>
                <button onClick={() => deleteEntry(i)} style={{ background: COLORS.red + "22", border: `1px solid ${COLORS.red}44`, color: COLORS.red, borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 13 }}>Delete</button>
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0",
              borderBottom: i < meals.length - 1 ? `1px solid ${COLORS.border}` : "none",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13 }}>{m.name}</div>
                <div style={{ fontSize: 10, color: COLORS.textFaint }}>P:{m.protein}g C:{m.carbs}g F:{m.fat}g</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ fontFamily: "monospace", color: COLORS.accent, fontSize: 13 }}>{m.calories}</span>
                <button onClick={() => startEdit(i)} style={{ background: "none", border: "none", color: COLORS.textDim, cursor: "pointer", fontSize: 13, padding: "2px 4px" }}>✎</button>
                <button onClick={() => deleteEntry(i)} style={{ background: "none", border: "none", color: COLORS.textFaint, cursor: "pointer", fontSize: 14, padding: "2px 4px" }}>×</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}

// ── Food logger with photo support ────────────────────────────────────────────
function FoodLogger({ dayData, updateDay, apiKey }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const [imageType, setImageType] = useState("image/jpeg");
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const fileRef = useRef();

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

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setImagePreviewUrl(dataUrl);
      // Strip the data:image/...;base64, prefix
      setImageBase64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    setImageBase64(null);
    setImagePreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function estimate() {
    if (!input.trim() && !imageBase64) return;
    if (!apiKey) { setError("Add your Anthropic API key in Settings first."); return; }
    setLoading(true); setError(""); setPreview(null);
    try {
      const result = await estimateMeal(input, apiKey, imageBase64, imageType);
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
    setInput(""); setPreview(null); clearPhoto();
  }

  const canEstimate = (input.trim() || imageBase64) && !loading;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Card>
        <SectionTitle>Log a meal</SectionTitle>

        {/* Photo upload */}
        <div style={{ marginBottom: 10 }}>
          {imagePreviewUrl ? (
            <div style={{ position: "relative" }}>
              <img
                src={imagePreviewUrl}
                alt="Food"
                style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8, display: "block" }}
              />
              <button onClick={clearPhoto} style={{
                position: "absolute", top: 6, right: 6,
                background: "rgba(0,0,0,0.6)", border: "none", color: "#fff",
                borderRadius: "50%", width: 28, height: 28, cursor: "pointer",
                fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
              }}>×</button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} style={{
              width: "100%", background: COLORS.surfaceHigh,
              border: `1.5px dashed ${COLORS.border}`,
              borderRadius: 8, color: COLORS.textDim, padding: "16px",
              cursor: "pointer", fontSize: 13, display: "flex",
              alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <span style={{ fontSize: 20 }}>📷</span>
              <span>Tap to add a photo of your plate</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            style={{ display: "none" }}
          />
        </div>

        {/* Text description */}
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={imageBase64
            ? "Optional: add a description to help the estimate (e.g. restaurant portion, added extra sauce)"
            : "Describe your meal — e.g. Wiener Schnitzel with potato salad, medium portion"}
          rows={2}
          style={{
            width: "100%", background: COLORS.surfaceHigh, border: `1px solid ${COLORS.border}`,
            borderRadius: 8, color: COLORS.text, padding: "10px 12px", fontSize: 13,
            resize: "none", fontFamily: "inherit", boxSizing: "border-box", outline: "none",
          }}
        />

        <button onClick={estimate} disabled={!canEstimate} style={{
          ...primaryBtn, marginTop: 10, opacity: !canEstimate ? 0.5 : 1, width: "100%",
        }}>
          {loading ? "Analysing…" : imageBase64 ? "Analyse photo with AI →" : "Estimate with AI →"}
        </button>
        {error && <div style={{ fontSize: 12, color: COLORS.red, marginTop: 8 }}>{error}</div>}
      </Card>

      {/* Result preview */}
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

      {/* Quick templates */}
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
        <MealLog meals={dayData.meals} updateDay={updateDay} />
      )}
    </div>
  );
}

// ── Workout logger ────────────────────────────────────────────────────────────
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

// ── Walk logger ───────────────────────────────────────────────────────────────
function WalkLogger({ dayData, updateDay }) {
  const [minutes, setMinutes] = useState(dayData.walk?.minutes ?? "");
  const burn = Math.round((Number(minutes) || 0) * 4.5);

  function save() { updateDay({ walk: { minutes: Number(minutes) } }); }

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

// ── WHOOP logger ──────────────────────────────────────────────────────────────
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

// ── Body logger ───────────────────────────────────────────────────────────────
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

// ── Main log view ─────────────────────────────────────────────────────────────
export default function LogView({ dayData, updateDay, apiKey, isToday, dateView }) {
  const [section, setSection] = useState("food");
  const tabs = [["food", "Food"], ["workout", "Workout"], ["walk", "Walk"], ["whoop", "WHOOP"], ["body", "Body"]];

  return (
    <div>
      {!isToday && (
        <div style={{
          marginBottom: 12, padding: "8px 12px", background: COLORS.amberLight,
          border: `1px solid ${COLORS.amber}44`, borderRadius: 10,
          fontSize: 12, color: COLORS.amber, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          ✎ Editing past day — all changes save immediately
        </div>
      )}
      <div style={{ display: "flex", background: COLORS.surfaceHigh, borderRadius: 10, padding: 4, marginBottom: 14, border: `1px solid ${COLORS.border}` }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setSection(id)} style={{
            flex: 1, background: section === id ? COLORS.accent : "none",
            color: section === id ? "#fff" : COLORS.textDim,
            border: "none", borderRadius: 8, padding: "7px 4px",
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
