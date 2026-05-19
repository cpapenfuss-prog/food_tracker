// ── Performance Management Chart (PMC) calculator ─────────────────────────────
// Implements exponentially-weighted moving averages:
//   CTL (Chronic Training Load / Fitness)  — 42-day time constant
//   ATL (Acute Training Load / Fatigue)    — 7-day time constant
//   TSB (Training Stress Balance / Form)   = CTL - ATL

const CTL_TC = 42;
const ATL_TC = 7;
const CTL_DECAY = 1 - 1 / CTL_TC;
const ATL_DECAY = 1 - 1 / ATL_TC;

export function computePMC(allData) {
  const days = Object.keys(allData)
    .filter(k => !k.startsWith("__") && k.match(/^\d{4}-\d{2}-\d{2}$/))
    .sort((a, b) => a.localeCompare(b));

  let ctl = 0;
  let atl = 0;
  const history = [];

  if (days.length === 0) {
    return { ctl: 0, atl: 0, tsb: 0, history: [], rampRate: 0 };
  }

  const first = days[0];
  const today = new Date().toISOString().slice(0, 10);

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

  const rampRate = history.length >= 7
    ? Math.round((history[history.length - 1].ctl - history[history.length - 7].ctl) * 10) / 10
    : 0;

  return { ctl: Math.round(ctl), atl: Math.round(atl), tsb, history, rampRate };
}

// ── Dynamic Baseline Engine ───────────────────────────────────────────────────
// Derives RMR from the static baseline (settings.calories / 1.55),
// then multiplies by a PAL factor from rolling 7-day training hours.
//
// Sources:
//   PAL scale:  WHO/FAO/UNU (2001)
//   Protein:    Thomas et al., Academy of Nutrition and Dietetics (2016) — 1.85 g/kg fixed
//   Carbs:      Jeukendrup & Burke, Sports Nutrition (2011) — 3–7 g/kg scaled with load
//   Fat:        fills remainder, floor 0.8 g/kg for hormonal health

export function computeDynamicBaseline(allData, settings, referenceKey) {
  // 1. RMR anchor
  const rmr = settings.calories / 1.55;

  // 2. Rolling 7-day training hours (days before referenceKey)
  let totalHours = 0;
  let totalTSS = 0;
  const dailyBreakdown = [];

  for (let i = 1; i <= 7; i++) {
    const d = new Date(referenceKey + "T12:00:00");
    d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    const day = allData[k] || {};
    const wo = day.workout;
    const durH = wo ? (wo.duration || 0) / 60 : 0;
    const walkH = day.walk ? (day.walk.minutes || 0) / 60 : 0;
    totalHours += durH + walkH;
    totalTSS += wo?.tss || 0;
    dailyBreakdown.push({ key: k, durH, walkH, tss: wo?.tss || 0 });
  }

  const avgHoursPerWeek = totalHours; // 7-day total = weekly average

  // 3. PAL lookup (WHO/FAO/UNU 2001)
  let pal, palLabel;
  if (avgHoursPerWeek < 3)       { pal = 1.40; palLabel = "Sedentary / Light"; }
  else if (avgHoursPerWeek < 6)  { pal = 1.55; palLabel = "Moderately Active"; }
  else if (avgHoursPerWeek < 8)  { pal = 1.65; palLabel = "Active"; }
  else if (avgHoursPerWeek < 10) { pal = 1.725; palLabel = "Very Active"; }
  else if (avgHoursPerWeek < 14) { pal = 1.80; palLabel = "Extremely Active"; }
  else                           { pal = 1.90; palLabel = "Elite Load"; }

  // 4. Dynamic TDEE
  const dynamicBaseline = Math.round(rmr * pal);
  const delta = dynamicBaseline - settings.calories;

  // 5. Macro targets
  const bw = settings.weight || 80;
  const protein = Math.round(bw * 1.85);

  let carbsPerKg;
  if (avgHoursPerWeek < 3)       carbsPerKg = 3.0;
  else if (avgHoursPerWeek < 6)  carbsPerKg = 4.5;
  else if (avgHoursPerWeek < 8)  carbsPerKg = 5.5;
  else if (avgHoursPerWeek < 10) carbsPerKg = 6.0;
  else if (avgHoursPerWeek < 14) carbsPerKg = 6.5;
  else                           carbsPerKg = 7.0;
  const carbs = Math.round(bw * carbsPerKg);

  const remainingKcal = dynamicBaseline - (protein * 4) - (carbs * 4);
  const fat = Math.max(Math.round(remainingKcal / 9), Math.round(bw * 0.8));

  return {
    rmr: Math.round(rmr), pal, palLabel,
    avgHoursPerWeek: Math.round(avgHoursPerWeek * 10) / 10,
    totalTSS, dynamicBaseline,
    staticBaseline: settings.calories, delta,
    protein, carbs, fat,
    carbsPerKg: Math.round(carbsPerKg * 10) / 10,
    dailyBreakdown,
  };
}
