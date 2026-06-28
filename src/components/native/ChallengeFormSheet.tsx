import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { ChallengeInput } from "@/types";
import { ActionChip } from "@/components/native/ActionChip";
import { FormSheetLayout } from "@/components/native/form-sheet/Layout";
import {
  ChallengeFieldsSection,
  ChallengeFoundationSection,
  ChallengeGoalsSection,
  ChallengeReportsSection,
  ChallengeVisibilitySection,
} from "@/components/native/challenge-form-sheet/Sections";
import type { Challenge, Goal } from "@/types";
import { appPalette } from "@/theme/palette";

export function ChallengeFormSheet({
  open,
  challenge,
  goals,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  challenge?: Challenge;
  goals: Goal[];
  onOpenChange: (open: boolean) => void;
  onSave: (data: ChallengeInput) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [link, setLink] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [requiresReport, setRequiresReport] = useState(true);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [personalGoalsEnabled, setPersonalGoalsEnabled] = useState(true);
  const [metricName, setMetricName] = useState("Результат");
  const [metricUnit, setMetricUnit] = useState("");
  const [reportingDays, setReportingDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [reportDeadline, setReportDeadline] = useState("23:00");
  const [reportTimeZone, setReportTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [allowedMisses, setAllowedMisses] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");

    if (challenge) {
      setTitle(challenge.title);
      setDescription(challenge.description ?? "");
      setRules(challenge.rules ?? "");
      setLink(challenge.link ?? "");
      setStartsAt(challenge.startsAt ?? "");
      setEndsAt(challenge.endsAt ?? "");
      setIsPublic(challenge.isPublic);
      setRequiresReport(challenge.requiresReport);
      setSelectedGoalIds(challenge.goalIds ?? challenge.goals.map((goal) => goal.id));
      setPersonalGoalsEnabled(challenge.personalGoalsEnabled ?? false);
      setMetricName(challenge.metricName ?? "Результат");
      setMetricUnit(challenge.metricUnit ?? "");
      setReportingDays(challenge.reportingDays ?? []);
      setReportDeadline(challenge.reportDeadline ?? "23:00");
      setReportTimeZone(challenge.reportTimeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC");
      setAllowedMisses(String(challenge.allowedMisses ?? 1));
      return;
    }

    setTitle("");
    setDescription("");
    setRules("");
    setLink("");
    setStartsAt("");
    setEndsAt("");
    setIsPublic(true);
    setRequiresReport(true);
    setSelectedGoalIds([]);
    setPersonalGoalsEnabled(true);
    setMetricName("Результат");
    setMetricUnit("");
    setReportingDays(["mon", "tue", "wed", "thu", "fri"]);
    setReportDeadline("23:00");
    setReportTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    setAllowedMisses("1");
  }, [open, challenge]);

  const toggleGoalSelection = (goalId: string) => {
    setSelectedGoalIds((current) =>
      current.includes(goalId) ? current.filter((item) => item !== goalId) : [...current, goalId],
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onSave({
        id: challenge?.id ?? "",
        title: title.trim(),
        description: description.trim() || undefined,
        rules: rules.trim() || undefined,
        link: link.trim() || undefined,
        isPublic,
        reports: challenge?.reports ?? [],
        requiresReport,
        price: personalGoalsEnabled ? 0 : challenge?.price,
        startsAt: startsAt.trim() || undefined,
        endsAt: endsAt.trim() || undefined,
        goalIds: selectedGoalIds,
        personalGoalsEnabled,
        metricName: metricName.trim() || "Результат",
        metricUnit: metricUnit.trim() || undefined,
        reportingDays,
        reportDeadline: reportDeadline.trim() || undefined,
        reportTimeZone: reportTimeZone.trim() || "UTC",
        allowedMisses: Math.max(0, Math.floor(Number(allowedMisses) || 0)),
      });
      onOpenChange(false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Не удалось сохранить челлендж. Проверьте данные и попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormSheetLayout
      open={open}
      onOpenChange={onOpenChange}
      title={challenge ? t("challenges.edit_title") : t("challenges.create_title")}
      subtitle={t("challenges.create_sheet_description")}
      footer={
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <ActionChip onPress={() => onOpenChange(false)}>{t("common.cancel")}</ActionChip>
          <ActionChip onPress={() => void handleSave()} tone="primary">
            {isSubmitting ? t("common.sending") : challenge ? t("common.save") : t("common.create")}
          </ActionChip>
        </View>
      }
    >
      <ChallengeFieldsSection
        title={title}
        description={description}
        rules={rules}
        link={link}
        startsAt={startsAt}
        endsAt={endsAt}
        onChangeTitle={setTitle}
        onChangeDescription={setDescription}
        onChangeRules={setRules}
        onChangeLink={setLink}
        onChangeStartsAt={setStartsAt}
        onChangeEndsAt={setEndsAt}
      />
      <ChallengeVisibilitySection isPublic={isPublic} onChange={setIsPublic} />
      <ChallengeReportsSection requiresReport={requiresReport} onChange={setRequiresReport} />
      <ChallengeFoundationSection
        personalGoalsEnabled={personalGoalsEnabled}
        metricName={metricName}
        metricUnit={metricUnit}
        reportingDays={reportingDays}
        reportDeadline={reportDeadline}
        reportTimeZone={reportTimeZone}
        allowedMisses={allowedMisses}
        onChangePersonalGoalsEnabled={(enabled) => {
          setPersonalGoalsEnabled(enabled);
          if (enabled) setRequiresReport(true);
        }}
        onChangeMetricName={setMetricName}
        onChangeMetricUnit={setMetricUnit}
        onChangeReportDeadline={setReportDeadline}
        onChangeReportTimeZone={setReportTimeZone}
        onChangeAllowedMisses={setAllowedMisses}
        onToggleReportingDay={(day) => setReportingDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day])}
      />
      {!personalGoalsEnabled && <ChallengeGoalsSection goals={goals} selectedGoalIds={selectedGoalIds} onToggleGoal={toggleGoalSelection} />}
      {!!error && (
        <Text style={{ color: appPalette.semantic.dangerText, fontFamily: "Montserrat", fontSize: 12 }}>
          {error}
        </Text>
      )}
    </FormSheetLayout>
  );
}
