import { COLORS, Card, SectionTitle, StatMini, RecoveryDot, MacroBar, fmt, feelColor, feelColor2 } from "./shared.jsx";

export default function Dashboard({ dayData, totals, calorieGap, dynamicTargets, totalBurn, settings }) {
  const calPct = Math.min((totals.calories / dynamicTargets.calories) * 100, 100);
  const isUnder = calorieGap >= 0;
  const gapColor = Math.abs(calorieGap) < 150 ? COLORS.green : isUnder ? COLORS.blue : COLORS.red;
  const gapLabel = isUnder ? `${fmt(calorieGap)} under` : `${fmt(Math.abs(calorieGap))} over`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke={COLORS.border} strokeWidth="8" />
              <circle cx="40" cy="40" r="32" fill="none"
                stroke={calPct > 100 ? COLORS.red : calPct > 85 ? COLORS.accent : COLORS.green}
                strokeWidth="8"
                strokeDasharray={`${calPct * 2.01} 201`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "monospace", lineHeight: 1 }}>{fmt(totals.calories)}</div>
              <div style={{ fontSize: 9, color: COLORS.textDim, letterSpacing: 0.5 }}>eaten</div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: gapColor, lineHeight: 1 }}>
                {gapLabel}
              </div>
              <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 3 }}>
                Target: {fmt(dynamicTargets.calories)} kcal
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <StatMini label="Base" val={settings.calories} unit="kcal" color={COLORS.textDim} />
              {totalBurn > 0 && <StatMini label="Burned" val={totalBurn} unit="kcal" color={COLORS.blue} />}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Macros · target adjusted for activity</SectionTitle>
        <MacroBar label="Protein" val={totals.protein} target={dynamicTargets.protein} color={COLORS.green} />
        <MacroBar label="Carbs" val={totals.carbs} target={dynamicTargets.carbs} color={COLORS.accent} />
        <MacroBar label="Fat" val={totals.fat} target={dynamicTargets.fat} color={COLORS.purple} />
      </Card>

      {dayData.whoop ? (
        <Card>
          <SectionTitle>Recovery · WHOOP</SectionTitle>
          <div style={{ display: "flex", gap: 12 }}>
            <RecoveryDot score={dayData.whoop.recovery} />
            <div style={{ flex: 1, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <StatMini label="HRV" val={dayData.whoop.hrv} unit="ms" color={COLORS.blue} />
              <StatMini label="RHR" val={dayData.whoop.rhr} unit="bpm" color={COLORS.purple} />
              <StatMini label="Sleep" val={dayData.whoop.sleep} unit="h" color={COLORS.textDim} />
            </div>
          </div>
        </Card>
      ) : (
        <Card style={{ borderStyle: "dashed", opacity: 0.5 }}>
          <div style={{ fontSize: 12, color: COLORS.textDim, textAlign: "center" }}>No WHOOP data — log it in the Log tab</div>
        </Card>
      )}

      {dayData.workout && (
        <Card>
          <SectionTitle>Workout</SectionTitle>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{dayData.workout.type}</div>
              <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2 }}>{dayData.workout.duration} min</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {dayData.workout.tss && <StatMini label="TSS" val={dayData.workout.tss} color={COLORS.accent} />}
              <StatMini label="kcal" val={dayData.workout.calories} color={COLORS.blue} />
            </div>
          </div>
          {dayData.workout.feel && (
            <div style={{ marginTop: 8, fontSize: 11, color: COLORS.textDim }}>
              Feel: <span style={{ color: feelColor(dayData.workout.feel), fontWeight: 600, textTransform: "uppercase", fontSize: 10 }}>{dayData.workout.feel}</span>
            </div>
          )}
        </Card>
      )}

      {dayData.walk?.minutes > 0 && (
        <Card>
          <SectionTitle>Walking</SectionTitle>
          <div style={{ display: "flex", gap: 16 }}>
            <StatMini label="Minutes" val={dayData.walk.minutes} color={COLORS.text} />
            <StatMini label="Est. burn" val={Math.round(dayData.walk.minutes * 4.5)} unit="kcal" color={COLORS.blue} />
          </div>
        </Card>
      )}

      {dayData.meals?.length > 0 && (
        <Card>
          <SectionTitle>Food log · {dayData.meals.length} entries</SectionTitle>
          {dayData.meals.map((m, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              padding: "8px 0",
              borderBottom: i < dayData.meals.length - 1 ? `1px solid ${COLORS.border}` : "none",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                {m.note && <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{m.note}</div>}
                <div style={{ fontSize: 10, color: COLORS.textFaint, marginTop: 2 }}>P:{m.protein}g · C:{m.carbs}g · F:{m.fat}g</div>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 13, color: COLORS.accent, fontWeight: 600, minWidth: 50, textAlign: "right" }}>
                {m.calories}
              </div>
            </div>
          ))}
        </Card>
      )}

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
