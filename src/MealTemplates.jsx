import { useState } from "react";
import { COLORS, Card, SectionTitle, StatMini, primaryBtn, ghostBtn } from "./shared.jsx";

const TEMPLATES_KEY = "fueltracker_meal_templates_v1";

// ── Persistence helpers ───────────────────────────────────────────────────────
export function loadTemplates() {
  try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]"); } catch { return []; }
}

export function saveTemplates(templates) {
  try { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates)); } catch {}
}

export function addTemplate(meal) {
  const existing = loadTemplates();
  const template = {
    id: Date.now(),
    name: meal.name,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    savedAt: new Date().toISOString(),
    useCount: 0,
  };
  const updated = [template, ...existing];
  saveTemplates(updated);
  return updated;
}

// ── Category tag chip ─────────────────────────────────────────────────────────
function MacroPill({ label, val, color }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
      color, background: color + "18",
      border: `1px solid ${color}33`,
      borderRadius: 4, padding: "2px 7px",
    }}>
      {label} {val}g
    </span>
  );
}

// ── Single template card ──────────────────────────────────────────────────────
function TemplateCard({ tpl, onLog, onDelete, onEdit }) {
  const [confirm, setConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: tpl.name, calories: tpl.calories, protein: tpl.protein, carbs: tpl.carbs, fat: tpl.fat });

  if (editing) {
    return (
      <div style={{
        background: COLORS.surface, border: `1.5px solid ${COLORS.accent}55`,
        borderRadius: 12, padding: "14px",
      }}>
        <input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          style={{
            width: "100%", background: COLORS.surfaceHigh, border: `1px solid ${COLORS.accent}55`,
            borderRadius: 6, color: COLORS.text, padding: "7px 10px", fontSize: 13,
            fontFamily: "inherit", boxSizing: "border-box", marginBottom: 10, outline: "none",
          }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
          {[["calories", "kcal"], ["protein", "P (g)"], ["carbs", "C (g)"], ["fat", "F (g)"]].map(([field, label]) => (
            <div key={field}>
              <div style={{ fontSize: 9, color: COLORS.textFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
              <input
                type="number"
                value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: Number(e.target.value) }))}
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
          <button onClick={() => { onEdit(tpl.id, form); setEditing(false); }} style={{ ...primaryBtn, flex: 1, padding: "8px" }}>Save</button>
          <button onClick={() => setEditing(false)} style={{ ...ghostBtn, padding: "8px 12px" }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
      borderRadius: 12, padding: "12px 14px",
      transition: "border-color 0.15s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.navy, marginBottom: 4 }}>{tpl.name}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            <MacroPill label="P" val={tpl.protein} color={COLORS.green} />
            <MacroPill label="C" val={tpl.carbs} color={COLORS.accent} />
            <MacroPill label="F" val={tpl.fat} color={COLORS.purple} />
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 800, color: COLORS.accent, lineHeight: 1 }}>{tpl.calories}</div>
          <div style={{ fontSize: 9, color: COLORS.textFaint, letterSpacing: 0.5 }}>KCAL</div>
          {tpl.useCount > 0 && (
            <div style={{ fontSize: 10, color: COLORS.textFaint, marginTop: 3 }}>used {tpl.useCount}×</div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => onLog(tpl)}
          style={{
            flex: 1, background: COLORS.accent, color: "#fff", border: "none",
            borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700,
            cursor: "pointer", letterSpacing: 0.3,
          }}
        >
          + Add to log
        </button>
        <button
          onClick={() => setEditing(true)}
          style={{
            background: COLORS.surfaceHigh, border: `1px solid ${COLORS.border}`,
            color: COLORS.textDim, borderRadius: 8, padding: "8px 10px",
            fontSize: 13, cursor: "pointer",
          }}
          title="Edit"
        >
          ✎
        </button>
        {confirm ? (
          <>
            <button
              onClick={() => onDelete(tpl.id)}
              style={{
                background: COLORS.red + "22", border: `1px solid ${COLORS.red}55`,
                color: COLORS.red, borderRadius: 8, padding: "8px 10px",
                fontSize: 11, cursor: "pointer", fontWeight: 700,
              }}
            >
              Delete?
            </button>
            <button
              onClick={() => setConfirm(false)}
              style={{
                background: COLORS.surfaceHigh, border: `1px solid ${COLORS.border}`,
                color: COLORS.textDim, borderRadius: 8, padding: "8px 10px",
                fontSize: 11, cursor: "pointer",
              }}
            >
              ✕
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirm(true)}
            style={{
              background: COLORS.surfaceHigh, border: `1px solid ${COLORS.border}`,
              color: COLORS.textFaint, borderRadius: 8, padding: "8px 10px",
              fontSize: 13, cursor: "pointer",
            }}
            title="Delete"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// ── Manual "add new template" form ────────────────────────────────────────────
function NewTemplateForm({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const valid = form.name.trim() && form.calories;

  function submit() {
    if (!valid) return;
    onAdd({
      name: form.name.trim(),
      calories: Number(form.calories),
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
    });
    onClose();
  }

  return (
    <div style={{
      background: COLORS.surface, border: `1.5px solid ${COLORS.accent}44`,
      borderRadius: 14, padding: "16px",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: COLORS.accent, marginBottom: 12 }}>
        New template
      </div>
      <div style={{ marginBottom: 10 }}>
        <input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Meal name (e.g. Greek yogurt with berries)"
          style={{
            width: "100%", background: COLORS.surfaceHigh, border: `1px solid ${COLORS.border}`,
            borderRadius: 8, color: COLORS.text, padding: "9px 12px", fontSize: 13,
            fontFamily: "inherit", boxSizing: "border-box", outline: "none",
          }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
        {[["calories", "kcal"], ["protein", "P (g)"], ["carbs", "C (g)"], ["fat", "F (g)"]].map(([field, label]) => (
          <div key={field}>
            <div style={{ fontSize: 9, color: COLORS.textFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
            <input
              type="number"
              value={form[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              placeholder={field === "calories" ? "450" : "30"}
              style={{
                width: "100%", background: COLORS.surfaceHigh, border: `1px solid ${COLORS.border}`,
                borderRadius: 5, color: COLORS.text, padding: "6px 8px", fontSize: 12,
                fontFamily: "monospace", boxSizing: "border-box", outline: "none",
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={submit} disabled={!valid} style={{ ...primaryBtn, flex: 1, opacity: valid ? 1 : 0.5 }}>Save template</button>
        <button onClick={onClose} style={{ ...ghostBtn, padding: "12px 14px" }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Search/filter bar ─────────────────────────────────────────────────────────
function SearchBar({ value, onChange }) {
  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <span style={{
        position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
        fontSize: 14, color: COLORS.textFaint, pointerEvents: "none",
      }}>⌕</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search favourites…"
        style={{
          width: "100%", background: COLORS.surfaceHigh, border: `1px solid ${COLORS.border}`,
          borderRadius: 9, color: COLORS.text, padding: "8px 12px 8px 32px",
          fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: COLORS.textFaint, cursor: "pointer", fontSize: 16,
          }}
        >×</button>
      )}
    </div>
  );
}

// ── Sort controls ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: "recent", label: "Recent" },
  { id: "most_used", label: "Most used" },
  { id: "calories_asc", label: "Cal ↑" },
  { id: "calories_desc", label: "Cal ↓" },
  { id: "protein", label: "Protein" },
];

// ── Main export ───────────────────────────────────────────────────────────────
export default function MealTemplates({ dayData, updateDay }) {
  const [templates, setTemplates] = useState(loadTemplates);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [showNew, setShowNew] = useState(false);
  const [flashId, setFlashId] = useState(null);

  function flash(id) {
    setFlashId(id);
    setTimeout(() => setFlashId(null), 1200);
  }

  function handleAdd(meal) {
    const updated = addTemplate(meal);
    setTemplates(updated);
  }

  function handleLog(tpl) {
    const meals = [...(dayData.meals || []), {
      id: Date.now(),
      name: tpl.name,
      calories: tpl.calories,
      protein: tpl.protein,
      carbs: tpl.carbs,
      fat: tpl.fat,
    }];
    updateDay({ meals });
    // bump use count
    const updated = templates.map(t => t.id === tpl.id ? { ...t, useCount: (t.useCount || 0) + 1 } : t);
    setTemplates(updated);
    saveTemplates(updated);
    flash(tpl.id);
  }

  function handleDelete(id) {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  }

  function handleEdit(id, patch) {
    const updated = templates.map(t => t.id === id ? { ...t, ...patch } : t);
    setTemplates(updated);
    saveTemplates(updated);
  }

  // Filter
  const filtered = templates.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase())
  );

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "most_used") return (b.useCount || 0) - (a.useCount || 0);
    if (sort === "calories_asc") return a.calories - b.calories;
    if (sort === "calories_desc") return b.calories - a.calories;
    if (sort === "protein") return b.protein - a.protein;
    return b.id - a.id; // recent
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: COLORS.textFaint }}>
          {templates.length} saved {templates.length === 1 ? "meal" : "meals"}
        </div>
        <button
          onClick={() => setShowNew(v => !v)}
          style={{
            background: showNew ? COLORS.surfaceHigh : COLORS.accent,
            color: showNew ? COLORS.textDim : "#fff",
            border: showNew ? `1px solid ${COLORS.border}` : "none",
            borderRadius: 8, padding: "6px 12px", fontSize: 11,
            fontWeight: 700, cursor: "pointer", letterSpacing: 0.3,
          }}
        >
          {showNew ? "Cancel" : "+ New template"}
        </button>
      </div>

      {/* New template form */}
      {showNew && <NewTemplateForm onAdd={handleAdd} onClose={() => setShowNew(false)} />}

      {/* Empty state */}
      {templates.length === 0 && !showNew && (
        <Card style={{ textAlign: "center", padding: "32px 16px" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>⭐</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy, marginBottom: 6 }}>No favourites yet</div>
          <div style={{ fontSize: 12, color: COLORS.textDim, lineHeight: 1.6, marginBottom: 16 }}>
            Save meals you eat regularly so you can log them in one tap. You can create templates manually or save any AI-estimated meal.
          </div>
          <button onClick={() => setShowNew(true)} style={{ ...primaryBtn, fontSize: 13 }}>Create your first template</button>
        </Card>
      )}

      {/* Search + sort — only when there's something to filter */}
      {templates.length > 0 && (
        <>
          <SearchBar value={search} onChange={setSearch} />

          {/* Sort chips */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 2 }}>
            {SORT_OPTIONS.map(o => (
              <button key={o.id} onClick={() => setSort(o.id)} style={{
                background: sort === o.id ? COLORS.accent : COLORS.surfaceHigh,
                color: sort === o.id ? "#fff" : COLORS.textDim,
                border: `1px solid ${sort === o.id ? COLORS.accent : COLORS.border}`,
                borderRadius: 6, padding: "4px 10px", fontSize: 10, fontWeight: 600,
                cursor: "pointer", letterSpacing: 0.3, transition: "all 0.15s",
              }}>{o.label}</button>
            ))}
          </div>
        </>
      )}

      {/* No search results */}
      {templates.length > 0 && sorted.length === 0 && (
        <div style={{ textAlign: "center", color: COLORS.textFaint, fontSize: 13, padding: "24px 0" }}>
          No matches for "{search}"
        </div>
      )}

      {/* Template list */}
      {sorted.map(tpl => (
        <div key={tpl.id} style={{
          transition: "opacity 0.3s",
          opacity: flashId === tpl.id ? 0.5 : 1,
        }}>
          {flashId === tpl.id && (
            <div style={{
              fontSize: 11, color: COLORS.green, fontWeight: 700, textAlign: "center",
              marginBottom: 4, letterSpacing: 0.5,
            }}>
              ✓ Added to log
            </div>
          )}
          <TemplateCard
            tpl={tpl}
            onLog={handleLog}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        </div>
      ))}

      {/* Tip */}
      {templates.length > 0 && (
        <div style={{ fontSize: 11, color: COLORS.textFaint, textAlign: "center", paddingTop: 4 }}>
          Tip: after estimating a meal with AI, tap <strong style={{ color: COLORS.textDim }}>Save as favourite</strong> to add it here.
        </div>
      )}
    </div>
  );
}
