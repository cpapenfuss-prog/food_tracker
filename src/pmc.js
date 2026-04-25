// Performance Management Chart calculations
// CTL: chronic training load (~42 day decay), fitness
// ATL: acute training load (~7 day decay), fatigue  
// TSB: training stress balance = CTL - ATL, form

const CTL_DECAY = 1 - Math.exp(-1 / 42);
const ATL_DECAY = 1 - Math.exp(-1 / 7);

export function computePMC(allData) {
  // Get all days with TSS, sorted ascending
  const days = Object.keys(allData)
    .filter(k => !k.startsWith("__") && k.match(/^\d{4}-\d{2}-\d{2}$/))
    .sort((a, b) => a.localeCompare(b));

  if (days.length === 0) return { ctl: 0, atl: 0, tsb: 0, history: [], rampRate: 0 };

  let ctl = 0;
  let atl = 0;
  const history = [];

  // Fill gaps between days with zero TSS days
  const first = new Date(days[0] + "T12:00:00");
  const last = new Date(days[days.length - 1] + "T12:00:00");
  const allDays = [];
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    allDays.push(d.toISOString().slice(0, 10));
  }

  for (const d of allDays) {
    const dayData = allData[d] || {};
    const tss = dayData.workout?.tss || 0;

    // Exponential weighted moving average
    ctl = ctl + CTL_DECAY * (tss - ctl);
    atl = atl + ATL_DECAY * (tss - atl);
    const tsb = ctl - atl;

    history.push({ date: d, tss, ctl: Math.round(ctl * 10) / 10, atl: Math.round(atl * 10) / 10, tsb: Math.round(tsb * 10) / 10 });
  }

  // Ramp rate: CTL change over last 7 days
  const recent = history.slice(-7);
  const rampRate = recent.length > 1
    ? Math.round((recent[recent.length - 1].ctl - recent[0].ctl) * 10) / 10
    : 0;

  return {
    ctl: Math.round(ctl * 10) / 10,
    atl: Math.round(atl * 10) / 10,
    tsb: Math.round((ctl - atl) * 10) / 10,
    history: history.slice(-30),
    rampRate,
  };
}

export function tsbStatus(tsb) {
  if (tsb > 10) return { label: "Fresh", color: "#10b981" };
  if (tsb > 0) return { label: "Optimal", color: "#60a5fa" };
  if (tsb > -10) return { label: "Tired", color: "#f59e0b" };
  if (tsb > -25) return { label: "Fatigued", color: "#f97316" };
  return { label: "Overreached", color: "#ef4444" };
}
