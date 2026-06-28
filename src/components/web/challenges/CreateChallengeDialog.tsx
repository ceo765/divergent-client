"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { Challenge, ChallengeInput, Goal } from "@/types";

import Select from "react-select";
import {Label} from "@/components/ui/label.tsx";
import {DatePickerInput} from "@/components/ui/date-picker.tsx";

interface CreateChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge?: Challenge;
  goals: Goal[];
  onSave: (data: ChallengeInput) => Promise<void> | void;
}

export function CreateChallengeDialog({
                                        open,
                                        onOpenChange,
                                        onSave,
                                        challenge,
                                        goals,
                                      }: CreateChallengeDialogProps) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [link, setLink] = useState("");
  const [price, setPrice] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [requiresReport, setRequiresReport] = useState(true);
  const [personalGoalsEnabled, setPersonalGoalsEnabled] = useState(true);
  const [metricName, setMetricName] = useState("Результат");
  const [metricUnit, setMetricUnit] = useState("");
  const [reportingDays, setReportingDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [reportDeadline, setReportDeadline] = useState("23:00");
  const [reportTimeZone, setReportTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [allowedMisses, setAllowedMisses] = useState("1");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<{ label: string; value: string }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (challenge) {
      setTitle(challenge.title);
      setDescription(challenge.description ?? "");
      setRules(challenge.rules ?? "");
      setLink(challenge.link ?? "");
      setPrice(challenge.price ? String(challenge.price) : "");
      setIsPublic(challenge.isPublic);
      setRequiresReport(challenge.requiresReport);
      setPersonalGoalsEnabled(challenge.personalGoalsEnabled ?? false);
      setMetricName(challenge.metricName ?? "Результат");
      setMetricUnit(challenge.metricUnit ?? "");
      setReportingDays(challenge.reportingDays ?? []);
      setReportDeadline(challenge.reportDeadline ?? "23:00");
      setReportTimeZone(challenge.reportTimeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC");
      setAllowedMisses(String(challenge.allowedMisses ?? 1));
      setStartsAt(challenge.startsAt?.slice(0, 10) ?? "");
      setEndsAt(challenge.endsAt?.slice(0, 10) ?? "");
      setSelectedGoals(
        challenge.goals
          .map((g) => ({ value: g.id, label: g.title }))
      );
    } else {
      resetForm();
    }
  }, [open, challenge, goals]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setRules("");
    setLink("");
    setPrice("");
    setIsPublic(true);
    setRequiresReport(true);
    setPersonalGoalsEnabled(true);
    setMetricName("Результат");
    setMetricUnit("");
    setReportingDays(["mon", "tue", "wed", "thu", "fri"]);
    setReportDeadline("23:00");
    setReportTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    setAllowedMisses("1");
    setStartsAt("");
    setEndsAt("");
    setSelectedGoals([]);
    setError("");
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      setError("");
      await onSave({
        id: challenge?.id || "",
        title: title.trim(),
        description: description.trim() || undefined,
        rules: rules.trim() || undefined,
        link: link.trim() || undefined,
        isPublic,
        reports: [], // FIXME
        requiresReport,
        personalGoalsEnabled,
        metricName: metricName.trim() || "Результат",
        metricUnit: metricUnit.trim() || undefined,
        reportingDays,
        reportDeadline: reportDeadline || undefined,
        reportTimeZone,
        allowedMisses: Math.max(0, Number(allowedMisses) || 0),
        price: personalGoalsEnabled ? 0 : Number(price),
        startsAt: startsAt || undefined,
        endsAt: endsAt || undefined,
        goalIds: selectedGoals.map((g) => g.value),
      });

      onOpenChange(false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Не удалось сохранить челлендж. Проверьте данные и попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{challenge ? t("challenges.edit_title") : t("challenges.create_title")}</DialogTitle>
          <DialogDescription>
            {challenge ? t("challenges.edit_description") : t("challenges.create_description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rules">{t("challenges.fields.title")}</Label>
            <Input
              id="title"
              placeholder={t("challenges.fields.title")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rules">{t("challenges.fields.description")}</Label>
            <Textarea
              id="description"
              placeholder={t("challenges.fields.description")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rules">{t("challenges.fields.rules")}</Label>
            <Textarea
              id="rules"
              placeholder={t("challenges.fields.rules")}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">{t("challenges.fields.link")}</Label>
            <Input
              id="link"
              placeholder={t("challenges.fields.link")}
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>

          {!personalGoalsEnabled && <div className="space-y-2">
            <Label htmlFor="price">{t("challenges.fields.price")}</Label>
            <Input
              placeholder={t("challenges.fields.price")}
              id="price"
              value={price}
              type="number"
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>}

          <div className="space-y-2">
            <Label htmlFor="visibility">{t("challenges.fields.visibility")}</Label>
            <Select
              id="visibility"
              className="text-sm"
              options={[
                {value: true, label: t("challenges.visibility.public")},
                {value: false, label: t("challenges.visibility.private")},
              ]}
              value={
                isPublic
                  ? {value: true, label: t("challenges.visibility.public")}
                  : {value: false, label: t("challenges.visibility.private")}
              }
              onChange={(option) => setIsPublic(option?.value ?? true)}
              placeholder={t("challenges.fields.select_visibility")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requiresReport">{t("challenges.fields.requiresReport")}</Label>
            <Select
              id="requiresReport"
              className="text-sm"
              options={[
                {value: true, label: t("common.yes")},
                {value: false, label: t("common.no")},
              ]}
              value={
                requiresReport
                  ? {value: true, label: t("common.yes")}
                  : {value: false, label: t("common.no")}
              }
              onChange={(option) => setRequiresReport(option?.value ?? true)}
              placeholder={t("challenges.fields.requiresReport")}
            />
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-start gap-3">
              <input
                id="personalGoalsEnabled"
                type="checkbox"
                className="mt-1 size-4"
                checked={personalGoalsEnabled}
                onChange={(event) => {
                  setPersonalGoalsEnabled(event.target.checked);
                  if (event.target.checked) setRequiresReport(true);
                }}
              />
              <div>
                <Label htmlFor="personalGoalsEnabled">Личная цель для каждого участника</Label>
                <p className="text-xs text-muted-foreground">
                  Участник задаёт собственный результат, а правила и форма отчёта остаются общими.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="metricName">Что измеряем</Label>
                <Input id="metricName" value={metricName} onChange={(event) => setMetricName(event.target.value)} placeholder="Выручка, страницы, тренировки" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metricUnit">Единица результата</Label>
                <Input id="metricUnit" value={metricUnit} onChange={(event) => setMetricUnit(event.target.value)} placeholder="₽, страниц, дней" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="reportDeadline">Отчёт до</Label>
                <Input id="reportDeadline" type="time" value={reportDeadline} onChange={(event) => setReportDeadline(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportTimeZone">Часовой пояс</Label>
                <Input id="reportTimeZone" value={reportTimeZone} onChange={(event) => setReportTimeZone(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allowedMisses">Допустимо пропусков</Label>
                <Input id="allowedMisses" type="number" min="0" value={allowedMisses} onChange={(event) => setAllowedMisses(event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Дни отчётности</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  ["mon", "Пн"], ["tue", "Вт"], ["wed", "Ср"], ["thu", "Чт"],
                  ["fri", "Пт"], ["sat", "Сб"], ["sun", "Вс"],
                ].map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={reportingDays.includes(value) ? "default" : "outline"}
                    onClick={() => setReportingDays((current) => current.includes(value) ? current.filter((day) => day !== value) : [...current, value])}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {!personalGoalsEnabled && <div className="space-y-2">
            <Label htmlFor="goals">{t("challenges.fields.goals")}</Label>
            <Select
              id="goals"
              className="text-sm"
              isMulti
              options={goals.map((g) => ({value: g.id, label: g.title}))}
              value={selectedGoals}
              onChange={(values) => setSelectedGoals(values as { value: string; label: string }[])}
              placeholder={t("challenges.fields.select_goals")}
            />
          </div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t("challenges.fields.start_date")}</Label>
              <DatePickerInput
                value={startsAt ? new Date(startsAt) : undefined}
                onChange={(date) => setStartsAt(date ? date.toISOString().slice(0, 10) : "")}
              />            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t("challenges.fields.end_date")}</Label>
              <DatePickerInput
                value={endsAt ? new Date(endsAt) : undefined}
                onChange={(date) => setEndsAt(date ? date.toISOString().slice(0, 10) : "")}
              />            </div>
          </div>
        </div>

        {!!error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || loading}>
            {challenge ? t("common.save") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
