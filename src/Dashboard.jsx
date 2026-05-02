import { COLORS, Card, SectionTitle, StatMini, RecoveryDot, MacroBar, fmt, feelColor, feelColor2 } from "./shared.jsx";

export default function Dashboard({ dayData, totals, calorieGap, dynamicTargets, projectedTargets, totalBurn, plannedBurn, settings, dayDescription, aiTargets, isToday }) {
  const activeTargets = plannedBurn > 0 ? projectedTargets : dynamicTargets;
  const calPct = Math.min((totals.calories / activeTargets.calories) * 100, 100);
  const isUnder = calorieGap >= 0;
  const gapColor = Math.abs(calorieGap) < 150 ? COLORS.green : isUnder ? COLORS.accent : COLORS.red;
  const gapLabel = isUnder ? `${fmt(calorieGap)} under` : `${fmt(Math.abs(calorieGap))} over`;

  const ringColor = calPct > 100 ? COLORS.red : calPct > 85 ? COLORS.amber : COLORS.accent;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Day description */}
      {dayDescription && (
        <Card style={{ borderLeft: `4px solid ${COLORS.accent}`, background: COLORS.blueLight }}>
          <div style={{ fontSize: 10, color: COLORS.accent, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, marginBottom: 5 }}>Today's plan</div>
          <div style={{ fontSize: 13, color: COLORS.navy, lineHeight: 1.6 }}>"{dayDescription}"</div>
        </Card>
      )}

      {/* AI targets badge */}
      {aiTargets && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: COLORS.blueLight, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
          <span style={{ fontSize: 13 }}>⚡</span>
          <span style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600 }}>AI-personalised targets active</span>
          <span style={{ fontSize: 11, color: COLORS.textFaint, marginLeft: "auto" }}>from briefing</span>
        </div>
      )}

      {/* Calorie ring + gap */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", width: 86, height: 86, flexShrink: 0 }}>
            <svg width="86" height="86" viewBox="0 0 86 86">
              <circle cx="43" cy="43" r="35" fill="none" stroke={COLORS.surfaceHigh} strokeWidth="9" />
              <circle cx="43" cy="43" r="35" fill="none"
                stroke={ringColor} strokeWidth="9"
                strokeDasharray={`${calPct * 2.199} 219.9`}
                strokeLinecap="round"
                transform="rotate(-90 43 43)"
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "monospace", lineHeight: 1, color: COLORS.navy }}>{fmt(totals.calories)}</div>
              <div style={{ fontSize: 9, color: COLORS.textFaint, letterSpacing: 0.5, fontWeight: 600 }}>EATEN</div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "monospace", color: gapColor, lineHeight: 1 }}>
                {gapLabel}
              </div>
              <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 4 }}>
                Target: <strong style={{ color: COLORS.text }}>{fmt(activeTargets.calories)}</strong> kcal
                {plannedBurn > 0 && <span style={{ color: COLORS.purple, marginLeft: 5, fontSize: 11 }}>projected</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <StatMini label="Base" val={settings.calories} unit="kcal" color={COLORS.textDim} />
              {totalBurn > 0 && <StatMini label="Burned" val={totalBurn} unit="kcal" color={COLORS.blue} />}
              {plannedBurn > 0 && <StatMini label="Planned" val={plannedBurn} unit="kcal" color={COLORS.purple} />}
            </div>
            {plannedBurn > 0 && dayData.planned?.type && (
              <div style={{ marginTop: 6, fontSize: 10, color: COLORS.textFaint }}>
                {dayData.planned.type} planned
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Macros */}
      <Card>
        <SectionTitle>
          Macros · {aiTargets ? "AI targets" : plannedBurn > 0 ? "projected full day" : "activity adjusted"}
        </SectionTitle>
        <MacroBar label="Protein" val={totals.protein} target={activeTargets.protein} color={COLORS.green} />
        <MacroBar label="Carbs" val={totals.carbs} target={activeTargets.carbs} color={COLORS.accent} />
        <MacroBar label="Fat" val={totals.fat} target={activeTargets.fat} color={COLORS.purple} />
      </Card>

      {/* WHOOP */}
      {dayData.whoop ? (
        <Card>
          <SectionTitle>Recovery · WHOOP</SectionTitle>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <RecoveryDot score={dayData.whoop.recovery} />
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <StatMini label="HRV" val={dayData.whoop.hrv} unit="ms" color={COLORS.blue} />
              <StatMini label="RHR" val={dayData.whoop.rhr} unit="bpm" color={COLORS.purple} />
              <StatMini label="Sleep" val={dayData.whoop.sleep} unit="h" color={COLORS.textDim} />
            </div>
          </div>
        </Card>
      ) : (
        <Card style={{ borderStyle: "dashed", background: COLORS.bg }}>
          <div style={{ fontSize: 12, color: COLORS.textFaint, textAlign: "center" }}>No WHOOP data · log it in the Log tab</div>
        </Card>
      )}

      {/* Workout */}
      {dayData.workout && (
        <Card>
          <SectionTitle>Workout</SectionTitle>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.navy }}>{dayData.workout.type}</div>
              <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2 }}>{dayData.workout.duration} min</div>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              {dayData.workout.tss && <StatMini label="TSS" val={dayData.workout.tss} color={COLORS.amber} />}
              <StatMini label="kcal" val={dayData.workout.calories} color={COLORS.blue} />
            </div>
          </div>
          {dayData.workout.feel && (
            <div style={{ marginTop: 8, fontSize: 12, color: COLORS.textDim }}>
              Feel: <span style={{ color: feelColor(dayData.workout.feel), fontWeight: 700, textTransform: "uppercase", fontSize: 10 }}>{dayData.workout.feel}</span>
            </div>
          )}
        </Card>
      )}

      {/* Walking */}
      {dayData.walk?.minutes > 0 && (
        <Card>
          <SectionTitle>Walking</SectionTitle>
          <div style={{ display: "flex", gap: 16 }}>
            <StatMini label="Minutes" val={dayData.walk.minutes} color={COLORS.text} />
            <StatMini label="Est. burn" val={Math.round(dayData.walk.minutes * 4.5)} unit="kcal" color={COLORS.blue} />
          </div>
        </Card>
      )}

      {/* Food log */}
      {dayData.meals?.length > 0 && (
        <Card>
          <SectionTitle>Food log · {dayData.meals.length} entries</SectionTitle>
          {dayData.meals.map((m, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              padding: "9px 0",
              borderBottom: i < dayData.meals.length - 1 ? `1px solid ${COLORS.border}` : "none",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.navy }}>{m.name}</div>
                {m.note && <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{m.note}</div>}
                <div style={{ fontSize: 10, color: COLORS.textFaint, marginTop: 2 }}>P:{m.protein}g · C:{m.carbs}g · F:{m.fat}g</div>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 14, color: COLORS.accent, fontWeight: 700, minWidth: 50, textAlign: "right" }}>
                {m.calories}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Body */}
      {dayData.body?.weight && (
        <Card>
          <SectionTitle>Body</SectionTitle>
          <div style={{ display: "flex", gap: 16 }}>
            <StatMini label="Weight" val={dayData.body.weight} unit="kg" color={COLORS.text} />
            {dayData.body.energy && <StatMini label="Energy" val={dayData.body.energy} unit="/10" color={feelColor2(dayData.body.energy)} />}
          </div>
        </Card>
      )}
    </div>
  );
}
