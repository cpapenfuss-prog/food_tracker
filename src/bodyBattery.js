// bodyBattery.js — Garmin morning Body Battery: validation, banding, status.
//
// Body Battery is a 0-100 recovery/energy metric. The MORNING (on-waking) value
// is the meaningful recovery signal — it peaks overnight after good sleep and
// drains through the day. Bands below are tunable; adjust to your own baseline.

export const BODY_BATTERY_BANDS = [
  { key: 'low',      label: 'Low',      min: 0,  max: 24,  color: 'var(--bb-low, #e5484d)' },
  { key: 'moderate', label: 'Moderate', min: 25, max: 49,  color: 'var(--bb-moderate, #f5a623)' },
  { key: 'good',     label: 'Good',     min: 50, max: 74,  color: 'var(--bb-good, #30a46c)' },
  { key: 'charged',  label: 'Charged',  min: 75, max: 100, color: 'var(--bb-charged, #1f8f5f)' },
];

export function isValidBodyBattery(v) {
  return Number.isFinite(v) && v >= 0 && v <= 100;
}

// Coerce raw field input (string) to an int 0-100, or null if blank/invalid.
export function parseBodyBattery(raw) {
  if (raw === '' || raw == null) return null;
  const n = Math.round(Number(raw));
  return isValidBodyBattery(n) ? n : null;
}

export function bodyBatteryBand(v) {
  if (!isValidBodyBattery(v)) return null;
  return BODY_BATTERY_BANDS.find(b => v >= b.min && v <= b.max) || null;
}

// Status object for badges/pills, mirroring your HRV/HRCV pattern.
export function bodyBatteryStatus(v) {
  const band = bodyBatteryBand(v);
  return band
    ? { value: v, ...band }
    : { value: null, key: 'none', label: '\u2014', color: 'var(--text-muted, #888)' };
}
