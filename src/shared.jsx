export const COLORS = {
  bg: "#0f1117",
  surface: "#1a1d27",
  surfaceHigh: "#22263a",
  border: "#2d3148",
  accent: "#f59e0b",
  accentDim: "#92400e",
  green: "#10b981",
  red: "#ef4444",
  blue: "#60a5fa",
  purple: "#a78bfa",
  text: "#e8eaf0",
  textDim: "#8b90a8",
  textFaint: "#4b5168",
};

export function feelColor(feel) {
  if (feel === "great") return COLORS.green;
  if (feel === "good") return COLORS.blue;
  if (feel === "ok") return COLORS.accent;
  return COLORS.red;
}

export function feelColor2(e) {
  if (e >= 8) return COLORS.green;
  if (e >= 6) return COLORS.blue;
  if (e >= 4) return COLORS.accent;
  return COLORS.red;
}

export function fmt(n) { return Math.round(n ?? 0); }

export function Card({ children, style }) {
  return (
    <div style={{
      background: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 12,
      padding: "16px",
      ...style,
    }}>{children}</div>
  );
}

export function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 2,
      textTransform: "uppercase", color: COLORS.textFaint, marginBottom: 12,
    }}>{children}</div>
  );
}

export function Label({ children }) {
  return (
    <div style={{
      fontSize: 10, color: COLORS.textFaint, letterSpacing: 1,
      textTransform: "uppercase", marginBottom: 4,
    }}>{children}</div>
  );
}

export function Input({ value, onChange, placeholder, type = "text", step }) {
  return (
    <input
      type={type} step={step} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", background: COLORS.surfaceHigh,
        border: `1px solid ${COLORS.border}`, borderRadius: 6,
        color: COLORS.text, padding: "8px 10px", fontSize: 14,
        fontFamily: "monospace", boxSizing: "border-box", outline: "none",
      }}
    />
  );
}

export function StatMini({ label, val, unit, color }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: COLORS.textFaint, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: color || COLORS.text, lineHeight: 1.2, marginTop: 2 }}>
        {val}{unit ? <span style={{ fontSize: 10, color: COLORS.textDim, marginLeft: 2 }}>{unit}</span> : null}
      </div>
    </div>
  );
}

export function RecoveryDot({ score }) {
  const color = score >= 67 ? COLORS.green : score >= 34 ? COLORS.accent : COLORS.red;
  return (
    <div style={{
      width: 56, height: 56, borderRadius: "50%",
      background: color + "22", border: `3px solid ${color}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "monospace", color, lineHeight: 1 }}>{score}</div>
      <div style={{ fontSize: 8, color, letterSpacing: 0.5 }}>REC</div>
    </div>
  );
}

export function MacroBar({ label, val, target, color }) {
  const pct = Math.min((val / target) * 100, 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>
        <span style={{ textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
        <span style={{ color: COLORS.text, fontFamily: "monospace" }}>{fmt(val)} / {target}g</span>
      </div>
      <div style={{ height: 6, background: COLORS.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

export const primaryBtn = {
  background: COLORS.accent, color: "#000", border: "none",
  borderRadius: 8, padding: "11px 16px", fontSize: 13,
  fontWeight: 700, cursor: "pointer", letterSpacing: 0.3,
};

export const ghostBtn = {
  background: COLORS.surfaceHigh, color: COLORS.textDim,
  border: `1px solid ${COLORS.border}`, borderRadius: 8,
  padding: "11px 14px", fontSize: 13, cursor: "pointer",
};

export const chipBtn = {
  background: "none", border: `1px solid`, borderRadius: 6,
  padding: "5px 10px", fontSize: 11, cursor: "pointer", transition: "all 0.15s",
};
