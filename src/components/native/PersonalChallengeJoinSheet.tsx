import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { ActionChip } from "@/components/native/ActionChip";
import { FieldInput } from "@/components/native/FieldInput";
import { FormSheetLayout } from "@/components/native/form-sheet/Layout";
import { SurfaceCard } from "@/components/native/SurfaceCard";
import { appPalette } from "@/theme/palette";
import type { Challenge, PersonalChallengeGoalInput } from "@/types";

function lines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

export function PersonalChallengeJoinSheet({ challenge, open, onOpenChange, onJoin }: {
  challenge: Challenge;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoin: (challenge: Challenge, goal: PersonalChallengeGoalInput) => Promise<void>;
}) {
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("0");
  const [context, setContext] = useState("");
  const [currentApproach, setCurrentApproach] = useState("");
  const [availableTime, setAvailableTime] = useState("");
  const [firstSteps, setFirstSteps] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const unit = challenge.metricUnit || "";
  const metricName = challenge.metricName || "Результат";
  const target = Number(targetValue);
  const current = Number(currentValue);
  const canSubmit = Number.isFinite(target) && target > 0 && Number.isFinite(current) && current >= 0 && context.trim().length > 0 && lines(firstSteps).length > 0;

  useEffect(() => {
    if (!open) return;
    setTargetValue("");
    setCurrentValue("0");
    setContext("");
    setCurrentApproach("");
    setAvailableTime("");
    setFirstSteps("");
    setError("");
  }, [challenge.id, open]);

  const submit = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      setError("");
      await onJoin(challenge, {
        goalTitle: `${metricName}: ${target.toLocaleString("ru-RU")} ${unit}`.trim(),
        targetValue: target,
        currentValue: current,
        unit,
        onboardingAnswers: {
          context: context.trim(),
          currentApproach: currentApproach.trim(),
          availableTime: availableTime.trim(),
        },
        plan: { firstSteps: lines(firstSteps) },
      });
      onOpenChange(false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Не удалось вступить в челлендж.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormSheetLayout
      open={open}
      onOpenChange={onOpenChange}
      title="Подготовим вашу личную цель"
      subtitle="Ответьте простыми словами. План можно менять в течение челленджа."
      footer={
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <ActionChip onPress={() => onOpenChange(false)}>Отмена</ActionChip>
          <ActionChip tone="primary" disabled={!canSubmit || submitting} onPress={() => void submit()}>
            {submitting ? "Сохраняем…" : "Вступить с личной целью"}
          </ActionChip>
        </View>
      }
    >
      <SurfaceCard>
        <Text style={{ color: appPalette.semantic.textStrong, fontFamily: "Montserrat", fontWeight: "600" }}>{metricName}</Text>
        <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>
          У каждого участника свой план, а форма отчёта и сроки общие.
        </Text>
      </SurfaceCard>
      <FieldInput label={`Какой результат хотите получить${unit ? `, ${unit}` : ""}?`} value={targetValue} onChangeText={setTargetValue} keyboardType="numeric" />
      <FieldInput label={`Какой результат уже есть${unit ? `, ${unit}` : ""}?`} value={currentValue} onChangeText={setCurrentValue} keyboardType="numeric" />
      <FieldInput label="Расскажите о своей ситуации" value={context} onChangeText={setContext} multiline numberOfLines={4} />
      <FieldInput label="Что уже делаете для результата?" value={currentApproach} onChangeText={setCurrentApproach} multiline numberOfLines={3} />
      <FieldInput label="Сколько времени готовы уделять?" value={availableTime} onChangeText={setAvailableTime} placeholder="Например: 2 часа по будням" />
      <FieldInput label="Какие первые действия хотите включить?" value={firstSteps} onChangeText={setFirstSteps} multiline numberOfLines={5} placeholder="Каждое действие — с новой строки" />
      <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>
        Позже ИИ предложит дополнительные шаги, но окончательное решение останется за вами.
      </Text>
      {!!error && <Text style={{ color: appPalette.semantic.dangerText, fontFamily: "Montserrat", fontSize: 12 }}>{error}</Text>}
    </FormSheetLayout>
  );
}
