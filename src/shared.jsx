// ── Color Scheme C: Sporty Blue ───────────────────────────────────────────────
export const COLORS = {
  bg: "#f0f4ff",
  surface: "#ffffff",
  surfaceHigh: "#f0f4ff",
  surfaceNav: "#ffffff",
  border: "#dce4f5",
  borderStrong: "#b8caf0",
  accent: "#3b82f6",
  accentDark: "#1d4ed8",
  accentLight: "#dce4f5",
  green: "#059669",
  greenLight: "#d1fae5",
  red: "#dc2626",
  redLight: "#fee2e2",
  blue: "#3b82f6",
  blueLight: "#dbeafe",
  purple: "#7c3aed",
  purpleLight: "#ede9fe",
  amber: "#d97706",
  amberLight: "#fef3c7",
  text: "#0f172a",
  textDim: "#475569",
  textFaint: "#94a3b8",
  navy: "#1e3a5f",
};

export function feelColor(feel) {
  if (feel === "great") return COLORS.green;
  if (feel === "good") return COLORS.blue;
  if (feel === "ok") return COLORS.amber;
  return COLORS.red;
}

export function feelColor2(e) {
  if (e >= 8) return COLORS.green;
  if (e >= 6) return COLORS.blue;
  if (e >= 4) return COLORS.amber;
  return COLORS.red;
}

export function fmt(n) { return Math.round(n ?? 0); }

export function Card({ children, style }) {
  return (
    <div style={{
      background: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 14,
      padding: "16px",
      boxShadow: "0 1px 3px rgba(59,130,246,0.06)",
      ...style,
    }}>{children}</div>
  );
}

export function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
      textTransform: "uppercase", color: COLORS.textFaint, marginBottom: 12,
    }}>{children}</div>
  );
}

export function Label({ children }) {
  return (
    <div style={{
      fontSize: 11, color: COLORS.textDim, letterSpacing: 0.3,
      fontWeight: 500, marginBottom: 5,
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
        border: `1px solid ${COLORS.border}`, borderRadius: 8,
        color: COLORS.text, padding: "9px 12px", fontSize: 14,
        fontFamily: "monospace", boxSizing: "border-box", outline: "none",
        transition: "border-color 0.15s",
      }}
    />
  );
}

export function StatMini({ label, val, unit, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: COLORS.textFaint, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "monospace", color: color || COLORS.text, lineHeight: 1.2, marginTop: 2 }}>
        {val}{unit ? <span style={{ fontSize: 11, color: COLORS.textDim, marginLeft: 2 }}>{unit}</span> : null}
      </div>
    </div>
  );
}

export function RecoveryDot({ score }) {
  const color = score >= 67 ? COLORS.green : score >= 34 ? COLORS.amber : COLORS.red;
  const bg = score >= 67 ? COLORS.greenLight : score >= 34 ? COLORS.amberLight : COLORS.redLight;
  return (
    <div style={{
      width: 58, height: 58, borderRadius: "50%",
      background: bg, border: `3px solid ${color}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "monospace", color, lineHeight: 1 }}>{score}</div>
      <div style={{ fontSize: 8, color, letterSpacing: 0.5, fontWeight: 700 }}>REC</div>
    </div>
  );
}

export function MacroBar({ label, val, target, color, lightColor }) {
  const pct = Math.min((val / target) * 100, 100);
  const over = val > target;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.textDim, marginBottom: 5 }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span style={{ color: over ? COLORS.red : COLORS.text, fontFamily: "monospace", fontWeight: 600 }}>{fmt(val)} / {target}g</span>
      </div>
      <div style={{ height: 7, background: COLORS.surfaceHigh, borderRadius: 4, overflow: "hidden", border: `1px solid ${COLORS.border}` }}>
        <div style={{ height: "100%", width: `${pct}%`, background: over ? COLORS.red : color, borderRadius: 4, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

export const primaryBtn = {
  background: COLORS.accent, color: "#fff", border: "none",
  borderRadius: 10, padding: "12px 18px", fontSize: 14,
  fontWeight: 600, cursor: "pointer", letterSpacing: 0.2,
  boxShadow: "0 2px 8px rgba(59,130,246,0.25)",
};

export const ghostBtn = {
  background: COLORS.surfaceHigh, color: COLORS.textDim,
  border: `1px solid ${COLORS.border}`, borderRadius: 10,
  padding: "11px 14px", fontSize: 13, cursor: "pointer",
};

export const chipBtn = {
  background: "none", border: `1px solid`, borderRadius: 8,
  padding: "5px 10px", fontSize: 11, cursor: "pointer", transition: "all 0.15s",
};
