// macros.js — effort-based macronutrient targets for FUEL
// Implements the g/kg P/C/F table, periodized by daily training effort.
//
// Model: duration sets a base tier (0..3); a high-intensity day bumps it up
// one. This reproduces the source table exactly and extends it gracefully to
// the corners the table doesn't name (e.g. a 2-3 hr ride WITH intensity -> Extra hard).

export const EFFORT_TIERS = [
  { key: 'easy',       label: 'Easy',       protein: 1.6, carb: 3, fat: 0.8, desc: 'Rest or \u226460 min easy' },
  { key: 'moderate',   label: 'Moderate',   protein: 1.8, carb: 5, fat: 1.0, desc: '61\u2013120 min easy, or \u226460 min hard' },
  { key: 'hard',       label: 'Hard',       protein: 2.0, carb: 7, fat: 1.2, desc: '2\u20133 hr, or 61\u2013120 min hard' },
  { key: 'extra_hard', label: 'Extra hard', protein: 2.2, carb: 9, fat: 1.4, desc: '>3 hr' },
];

const LB_TO_KG = 1 / 2.2046226218;
export const toKg = (weight, unit = 'lb') => (unit === 'kg' ? weight : weight * LB_TO_KG);

// --- Effort classification ---------------------------------------------------

export function durationTierIndex(minutes) {
  if (minutes <= 60) return 0;   // includes rest (0 min)
  if (minutes <= 120) return 1;
  if (minutes <= 180) return 2;
  return 3;
}

export function classifyEffort({ workoutMinutes = 0, isHighIntensity = false }) {
  const idx = Math.min(3, durationTierIndex(workoutMinutes) + (isHighIntensity ? 1 : 0));
  return EFFORT_TIERS[idx];
}

// --- Intensity assessment ----------------------------------------------------
// Primary: TSS/hour (duration-normalised, already in your PMC ecosystem).
// Fallbacks, in order: avg HR vs LTHR, then kcal/min, then manual override.
// Tune these to your own zones.

export const INTENSITY_THRESHOLDS = {
  tssPerHour: 70,     // endurance ~50-60, threshold/VO2 ~80-100+
  hrPctOfLthr: 0.88,  // session avg HR / lactate-threshold HR
  kcalPerMin: 13,     // crude proxy for an ~80 kg athlete
};

// session may carry any subset of: { tss, durationMin, avgHr, lthr, kcal, type }
export function assessIntensity(session, t = INTENSITY_THRESHOLDS) {
  const mins = session.durationMin || 0;
  if (session.tss != null && mins > 0) return session.tss / (mins / 60) >= t.tssPerHour;
  if (session.avgHr != null && session.lthr) return session.avgHr / session.lthr >= t.hrPctOfLthr;
  if (session.kcal != null && mins > 0) return session.kcal / mins >= t.kcalPerMin;
  return false; // no signal -> treat as easy; rely on manual override
}

// Roll a day's sessions into classifier inputs. Easy walks excluded by default.
export function dayEffortInputs(sessions = [], { includeWalks = false } = {}) {
  const work = sessions.filter(s => includeWalks || s.type !== 'walk');
  return {
    workoutMinutes: work.reduce((m, s) => m + (s.durationMin || 0), 0),
    isHighIntensity: work.some(s => assessIntensity(s)),
  };
}

// --- Targets -----------------------------------------------------------------
// Precedence: manualEffort > effortKey > auto-classify from sessions.

export function macroTargets({ weight, unit = 'lb', effortKey, sessions, manualEffort }) {
  const kg = toKg(weight, unit);
  const tier =
    (manualEffort && EFFORT_TIERS.find(t => t.key === manualEffort)) ||
    (effortKey && EFFORT_TIERS.find(t => t.key === effortKey)) ||
    classifyEffort(dayEffortInputs(sessions || []));

  const protein = Math.round(tier.protein * kg);
  const carb    = Math.round(tier.carb    * kg);
  const fat     = Math.round(tier.fat     * kg);

  return { tier, grams: { protein, carb, fat }, kcal: protein * 4 + carb * 4 + fat * 9 };
}
