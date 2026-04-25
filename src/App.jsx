import { useState, useEffect } from "react";
import { COLORS, fmt } from "./shared.jsx";
import Dashboard from "./Dashboard.jsx";
import LogView from "./LogView.jsx";
import HistoryView from "./HistoryView.jsx";
import SettingsView from "./SettingsView.jsx";

const NAV = [
  { id: "dashboard", icon: "◈", label: "Today" },
  { id: "log", icon: "＋", label: "Log" },
  { id: "history", icon: "◷", label: "History" },
  { id: "settings", icon: "◎", label: "Settings" },
];

const STORE_KEY = "fueltracker_v2";
const today = () => new Date().toISOString().slice(0, 10);

function loadData() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch { return {}; }
}
function saveData(d) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch {}
}

const arrowBtn = {
  background: COLORS.surfaceHigh, border: `1px solid ${COLORS.border}`,
  color: COLORS.text, borderRadius: 6, padding: "4px 10px",
  cursor: "pointer", fontSize: 16, lineHeight: 1,
};

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [allData, setAllData] = useState(loadData);
  const [dateView, setDateView] = useState(today());

  const settings = allData.__settings || { calories: 2200, protein: 180, carbs: 200, fat: 70, weight: 82, apiKey: "" };
  const dayData = allData[dateView] || { meals: [], workout: null, whoop: null, body: null };

  function updateDay(patch) {
    const updated = { ...allData, [dateView]: { ...dayData, ...patch } };
    setAllData(updated);
    saveData(updated);
  }

  const totals = dayData.meals.reduce((acc, m) => ({
    calories: acc.calories + (m.calories || 0),
    protein: acc.protein + (m.protein || 0),
    carbs: acc.carbs + (m.carbs || 0),
    fat: acc.fat + (m.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Total expenditure = workout + walking
  const workoutBurn = dayData.workout?.calories || 0;
  const walkBurn = Math.round((dayData.walk?.minutes || 0) * 4.5);
  const totalBurn = workoutBurn + walkBurn;

  // Dynamic targets scale with expenditure
  const scaleFactor = (settings.calories + totalBurn) / settings.calories;
  const dynamicTargets = {
    calories: settings.calories + totalBurn,
    protein: Math.round(settings.protein * scaleFactor),
    carbs: Math.round(settings.carbs * scaleFactor),
    fat: Math.round(settings.fat * scaleFactor),
  };

  // Gap: positive = under target (good for body comp), negative = over
  const calorieGap = dynamicTargets.calories - totals.calories;

  function shiftDate(delta) {
    const d = new Date(dateView + "T12:00:00");
    d.setDate(d.getDate() + delta);
    const n = d.toISOString().slice(0, 10);
    if (n <= today()) setDateView(n);
  }

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg, color: COLORS.text,
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      maxWidth: 480, margin: "0 auto", paddingBottom: 80,
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 16px 12px", borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, background: COLORS.bg, zIndex: 10,
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>
            FUEL<span style={{ color: COLORS.accent }}>.</span>
          </div>
          <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 1 }}>
            {new Date(dateView + "T12:00:00").toLocaleDateString("en-DE", { weekday: "long", day: "numeric", month: "short" })}
          </div>
        </div>
        {(tab === "dashboard" || tab === "log") && (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => shiftDate(-1)} style={arrowBtn}>‹</button>
            <button onClick={() => setDateView(today())} style={{
              ...arrowBtn, fontSize: 10, padding: "4px 8px",
              color: dateView === today() ? COLORS.accent : COLORS.textDim,
            }}>TODAY</button>
            <button onClick={() => shiftDate(1)} style={arrowBtn}>›</button>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "16px" }}>
        {tab === "dashboard" && <Dashboard dayData={dayData} totals={totals} calorieGap={calorieGap} dynamicTargets={dynamicTargets} totalBurn={totalBurn} settings={settings} />}
        {tab === "log" && <LogView dayData={dayData} updateDay={updateDay} apiKey={settings.apiKey} walkBurn={walkBurn} />}
        {tab === "history" && <HistoryView allData={allData} settings={settings} />}
        {tab === "settings" && (
          <SettingsView settings={settings} onSave={s => {
            const updated = { ...allData, __settings: s };
            setAllData(updated);
            saveData(updated);
          }} />
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, background: COLORS.surface,
        borderTop: `1px solid ${COLORS.border}`, display: "flex", zIndex: 20,
      }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{
            flex: 1, background: "none", border: "none",
            color: tab === n.id ? COLORS.accent : COLORS.textFaint,
            padding: "12px 0 14px", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            transition: "color 0.2s",
          }}>
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            <span style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
