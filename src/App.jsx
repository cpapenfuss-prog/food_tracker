import { useState } from "react";
import { COLORS, fmt } from "./shared.jsx";
import Dashboard from "./Dashboard.jsx";
import LogView from "./LogView.jsx";
import HistoryView from "./HistoryView.jsx";
import SettingsView from "./SettingsView.jsx";
import BriefingView from "./BriefingView.jsx";

const NAV = [
  { id: "dashboard", icon: "◈", label: "Today" },
  { id: "log", icon: "＋", label: "Log" },
  { id: "briefing", icon: "⚡", label: "Brief" },
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

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [allData, setAllData] = useState(loadData);
  const [dateView, setDateView] = useState(today());

  const settings = allData.__settings || { calories: 2200, protein: 180, carbs: 200, fat: 70, weight: 82, apiKey: "" };
  const dayData = allData[dateView] || { meals: [], workout: null, whoop: null, body: null };
  const isToday = dateView === today();

  function updateDay(patch) {
    const updated = { ...allData, [dateView]: { ...dayData, ...patch } };
    setAllData(updated);
    saveData(updated);
  }

  const totals = (dayData.meals || []).reduce((acc, m) => ({
    calories: acc.calories + (m.calories || 0),
    protein: acc.protein + (m.protein || 0),
    carbs: acc.carbs + (m.carbs || 0),
    fat: acc.fat + (m.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const workoutBurn = dayData.workout?.calories || 0;
  const walkBurn = Math.round((dayData.walk?.minutes || 0) * 4.5);
  const plannedBurn = dayData.planned?.burn || 0;
  const totalBurn = workoutBurn + walkBurn;
  const projectedBurn = totalBurn + plannedBurn;

  // AI targets take priority when set; otherwise fall back to formula
  const aiTargets = dayData.aiTargets || null;
  const dynamicTargets = aiTargets || {
    calories: settings.calories + totalBurn,
    protein: settings.protein,
    carbs: settings.carbs + Math.round(totalBurn / 4),
    fat: settings.fat,
  };
  const projectedTargets = aiTargets || {
    calories: settings.calories + projectedBurn,
    protein: settings.protein,
    carbs: settings.carbs + Math.round(projectedBurn / 4),
    fat: settings.fat,
  };

  const calorieGap = (plannedBurn > 0 ? projectedTargets.calories : dynamicTargets.calories) - totals.calories;

  function shiftDate(delta) {
    const d = new Date(dateView + "T12:00:00");
    d.setDate(d.getDate() + delta);
    const n = d.toISOString().slice(0, 10);
    if (n <= today()) setDateView(n);
  }

  const arrowBtn = {
    background: COLORS.surface, border: `1px solid ${COLORS.border}`,
    color: COLORS.text, borderRadius: 8, padding: "5px 12px",
    cursor: "pointer", fontSize: 16, lineHeight: 1,
    boxShadow: "0 1px 2px rgba(59,130,246,0.08)",
  };

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg, color: COLORS.text,
      fontFamily: "'DM Sans', 'Inter', 'Segoe UI', sans-serif",
      maxWidth: 480, margin: "0 auto", paddingBottom: 84,
    }}>
      {/* Header */}
      <div style={{
        padding: "18px 16px 12px", borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, background: COLORS.bg, zIndex: 10,
        boxShadow: "0 1px 0 rgba(59,130,246,0.08)",
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, color: COLORS.navy }}>
            FUEL<span style={{ color: COLORS.accent }}>.</span>
          </div>
          <div style={{ fontSize: 11, color: COLORS.textFaint, marginTop: 1, fontWeight: 500 }}>
            {new Date(dateView + "T12:00:00").toLocaleDateString("en-DE", { weekday: "long", day: "numeric", month: "short" })}
            {!isToday && <span style={{ color: COLORS.accent, marginLeft: 6, fontWeight: 700 }}>← past day</span>}
          </div>
        </div>
        {(tab === "dashboard" || tab === "log") && (
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <button onClick={() => shiftDate(-1)} style={arrowBtn}>‹</button>
            <button onClick={() => setDateView(today())} style={{
              ...arrowBtn, fontSize: 10, padding: "5px 10px", fontWeight: 700, letterSpacing: 0.5,
              color: isToday ? COLORS.accent : COLORS.textDim,
              borderColor: isToday ? COLORS.accent : COLORS.border,
            }}>TODAY</button>
            <button onClick={() => shiftDate(1)} style={{
              ...arrowBtn, opacity: isToday ? 0.3 : 1,
            }}>›</button>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px" }}>
        {tab === "dashboard" && (
          <Dashboard
            dayData={dayData} totals={totals} calorieGap={calorieGap}
            dynamicTargets={dynamicTargets} projectedTargets={projectedTargets}
            totalBurn={totalBurn} plannedBurn={plannedBurn}
            settings={settings} dayDescription={dayData.dayDescription}
            aiTargets={aiTargets} isToday={isToday}
          />
        )}
        {tab === "log" && (
          <LogView dayData={dayData} updateDay={updateDay} apiKey={settings.apiKey} isToday={isToday} dateView={dateView} />
        )}
        {tab === "briefing" && (
          <BriefingView allData={allData} settings={settings} updateDay={updateDay} todayKey={dateView} />
        )}
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
        width: "100%", maxWidth: 480, background: COLORS.surfaceNav,
        borderTop: `1px solid ${COLORS.border}`, display: "flex", zIndex: 20,
        boxShadow: "0 -2px 12px rgba(59,130,246,0.08)",
      }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{
            flex: 1, background: "none", border: "none",
            color: tab === n.id ? COLORS.accent : COLORS.textFaint,
            padding: "11px 0 13px", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            transition: "color 0.2s",
            borderTop: tab === n.id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
          }}>
            <span style={{ fontSize: 17 }}>{n.icon}</span>
            <span style={{ fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase", fontWeight: 700 }}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
