// ── Performance Management Chart (PMC) calculator ─────────────────────────────
// Implements exponentially-weighted moving averages:
//   CTL (Chronic Training Load / Fitness)  — 42-day time constant
//   ATL (Acute Training Load / Fatigue)    — 7-day time constant
//   TSB (Training Stress Balance / Form)   = CTL - ATL

const CTL_TC = 42; // days
const ATL_TC = 7;  // days
const CTL_DECAY = 1 - 1 / CTL_TC;
const ATL_DECAY = 1 - 1 / ATL_TC;

export function computePMC(allData) {
  // Collect all date-keyed days that have TSS data, sorted oldest → newest
  const days = Object.keys(allData)
    .filter(k => !k.startsWith("__") && k.match(/^\d{4}-\d{2}-\d{2}$/))
    .sort((a, b) => a.localeCompare(b));

  let ctl = 0;
  let atl = 0;
  const history = [];

  // Fill gaps: build a continuous date range from first day to today
  if (days.length === 0) {
    return { ctl: 0, atl: 0, tsb: 0, history: [], rampRate: 0 };
  }

  const first = days[0];
  const today = new Date().toISOString().slice(0, 10);

  // Iterate every calendar day from first logged day to today
  let cursor = new Date(first + "T12:00:00");
  const end = new Date(today + "T12:00:00");

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    const day = allData[key] || {};
    const tss = day.workout?.tss || 0;

    ctl = CTL_DECAY * ctl + (1 - CTL_DECAY) * tss;
    atl = ATL_DECAY * atl + (1 - ATL_DECAY) * tss;

    history.push({
      date: key,
      tss,
      ctl: Math.round(ctl * 10) / 10,
      atl: Math.round(atl * 10) / 10,
      tsb: Math.round((ctl - atl) * 10) / 10,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  const tsb = Math.round(ctl - atl);

  // 7-day ramp rate: change in CTL over the last 7 days
  const rampRate = history.length >= 7
    ? Math.round((history[history.length - 1].ctl - history[history.length - 7].ctl) * 10) / 10
    : 0;

  return {
    ctl: Math.round(ctl),
    atl: Math.round(atl),
    tsb,
    history,
    rampRate,
  };
}
