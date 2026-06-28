import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import { ActionChip } from "@/components/native/ActionChip";
import { FieldInput } from "@/components/native/FieldInput";
import { FormSheetLayout } from "@/components/native/form-sheet/Layout";
import { SurfaceCard } from "@/components/native/SurfaceCard";
import { getChallengeCheckIns, getMyChallengePlan, submitChallengeCheckIn } from "@/shared/api/client";
import { formatChallengeReportError } from "@/shared/display/challengeErrors";
import { useAppStore } from "@/stores/useAppStore";
import { appPalette } from "@/theme/palette";
import type { Challenge, ChallengeCheckIn, ChallengeParticipant } from "@/types";

function lines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function formatValue(value: number | undefined, unit: string) {
  return value == null ? "—" : `${value.toLocaleString("ru-RU")} ${unit}`.trim();
}

export function ChallengeCheckInSheet({ challenge, open, onOpenChange }: {
  challenge: Challenge;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const refreshAppData = useAppStore((state) => state.refreshAppData);
  const [plan, setPlan] = useState<ChallengeParticipant | null>(null);
  const [checkIns, setCheckIns] = useState<ChallengeCheckIn[]>([]);
  const [factValue, setFactValue] = useState("");
  const [doneToday, setDoneToday] = useState("");
  const [tasksTomorrow, setTasksTomorrow] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const unit = plan?.unit || challenge.metricUnit || "";
  const fact = Number(factValue);
  const canSubmit = Number.isFinite(fact) && fact >= 0 && lines(doneToday).length > 0 && lines(tasksTomorrow).length > 0;
  const progress = useMemo(() => !plan?.targetValue ? 0 : Math.min(100, Math.round(((fact || 0) / plan.targetValue) * 100)), [fact, plan?.targetValue]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError("");
    void Promise.all([getMyChallengePlan(challenge.id), getChallengeCheckIns(challenge.id)])
      .then(([nextPlan, nextCheckIns]) => {
        if (!active) return;
        setPlan(nextPlan);
        setFactValue(String(nextPlan.currentValue ?? 0));
        setCheckIns(nextCheckIns);
      })
      .catch(() => { if (active) setError("Не удалось загрузить личный план и отчёты."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [challenge.id, open]);

  const submit = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      setError("");
      const saved = await submitChallengeCheckIn(challenge.id, {
        factValue: fact,
        doneToday: lines(doneToday),
        tasksTomorrow: lines(tasksTomorrow),
      });
      setCheckIns((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setPlan((current) => current ? { ...current, currentValue: fact } : current);
      setDoneToday("");
      setTasksTomorrow("");
      await refreshAppData();
    } catch (nextError) {
      setError(formatChallengeReportError(nextError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormSheetLayout
      open={open}
      onOpenChange={onOpenChange}
      title={`Отчёт · ${challenge.title}`}
      subtitle={`До ${challenge.reportDeadline || "указанного времени"} (${challenge.reportTimeZone || "UTC"})`}
      footer={<ActionChip onPress={() => onOpenChange(false)}>Закрыть</ActionChip>}
    >
      {loading ? <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat" }}>Загружаем личный план…</Text> : (
        <>
          <SurfaceCard>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }}>
              <View><Text style={{ color: appPalette.semantic.textMuted, fontSize: 11, fontFamily: "Montserrat" }}>План</Text><Text style={{ color: appPalette.semantic.textStrong, fontWeight: "600", fontFamily: "Montserrat" }}>{formatValue(plan?.targetValue, unit)}</Text></View>
              <View><Text style={{ color: appPalette.semantic.textMuted, fontSize: 11, fontFamily: "Montserrat" }}>Факт</Text><Text style={{ color: appPalette.semantic.textStrong, fontWeight: "600", fontFamily: "Montserrat" }}>{formatValue(fact || 0, unit)}</Text></View>
              <View><Text style={{ color: appPalette.semantic.textMuted, fontSize: 11, fontFamily: "Montserrat" }}>Выполнено</Text><Text style={{ color: appPalette.semantic.textStrong, fontWeight: "600", fontFamily: "Montserrat" }}>{progress}%</Text></View>
            </View>
          </SurfaceCard>
          <FieldInput label={`Обновите факт${unit ? `, ${unit}` : ""}`} value={factValue} onChangeText={setFactValue} keyboardType="numeric" />
          <FieldInput label="Сделано сегодня" value={doneToday} onChangeText={setDoneToday} multiline numberOfLines={5} placeholder="Каждое действие — с новой строки" />
          <FieldInput label="Задачи на завтра" value={tasksTomorrow} onChangeText={setTasksTomorrow} multiline numberOfLines={5} placeholder="Каждая задача — с новой строки" />
          {!!error && <Text style={{ color: appPalette.semantic.dangerText, fontFamily: "Montserrat", fontSize: 12 }}>{error}</Text>}
          <ActionChip tone="primary" disabled={!canSubmit || submitting} onPress={() => void submit()}>{submitting ? "Публикуем…" : "Опубликовать отчёт в группе"}</ActionChip>

          <Text style={{ color: appPalette.semantic.textStrong, fontWeight: "600", fontFamily: "Montserrat", marginTop: 4 }}>Отчёты группы</Text>
          {checkIns.length === 0 ? <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 12 }}>Отчётов пока нет.</Text> : checkIns.map((item) => (
            <SurfaceCard key={item.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ color: appPalette.semantic.textStrong, fontWeight: "600", fontFamily: "Montserrat", flex: 1 }}>{item.user.name}</Text>
                <Text style={{ color: item.isLate ? appPalette.semantic.warningText : appPalette.semantic.successText, fontFamily: "Montserrat", fontSize: 11 }}>{item.isLate ? "Поздно" : "Вовремя"}</Text>
              </View>
              <Text style={{ color: appPalette.semantic.text, fontFamily: "Montserrat", fontSize: 12 }}>План: {formatValue(item.planValue, unit)} · Факт: {formatValue(item.factValue, unit)}</Text>
              <Text style={{ color: appPalette.semantic.textStrong, fontWeight: "600", fontFamily: "Montserrat", fontSize: 12 }}>Сделано сегодня</Text>
              {item.doneToday.map((text) => <Text key={text} style={{ color: appPalette.semantic.text, fontFamily: "Montserrat", fontSize: 12 }}>• {text}</Text>)}
              <Text style={{ color: appPalette.semantic.textStrong, fontWeight: "600", fontFamily: "Montserrat", fontSize: 12 }}>Задачи на завтра</Text>
              {item.tasksTomorrow.map((text) => <Text key={text} style={{ color: appPalette.semantic.text, fontFamily: "Montserrat", fontSize: 12 }}>• {text}</Text>)}
            </SurfaceCard>
          ))}
        </>
      )}
    </FormSheetLayout>
  );
}
