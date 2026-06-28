import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Challenge, PersonalChallengeGoalInput } from "@/types";

function lines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

export function PersonalChallengeJoinDialog({
  challenge,
  open,
  onOpenChange,
  onJoin,
}: {
  challenge: Challenge;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoin: (challenge: Challenge, goal: PersonalChallengeGoalInput) => Promise<void>;
}) {
  const unit = challenge.metricUnit || "";
  const metricName = challenge.metricName || "Результат";
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("0");
  const [context, setContext] = useState("");
  const [currentApproach, setCurrentApproach] = useState("");
  const [availableTime, setAvailableTime] = useState("");
  const [firstSteps, setFirstSteps] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const target = Number(targetValue);
  const current = Number(currentValue);
  const canSubmit = Number.isFinite(target) && target > 0 && Number.isFinite(current) && current >= 0 && context.trim() && lines(firstSteps).length > 0;
  const endDate = useMemo(
    () => challenge.endsAt ? new Intl.DateTimeFormat("ru-RU").format(new Date(challenge.endsAt)) : null,
    [challenge.endsAt],
  );

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Подготовим вашу личную цель</DialogTitle>
          <DialogDescription>
            Ответьте простыми словами. План можно будет менять в течение челленджа{endDate ? `, который завершится ${endDate}` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="personalTarget">Какой результат хотите получить?</Label>
              <div className="flex items-center gap-2">
                <Input id="personalTarget" type="number" min="0" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} />
                {!!unit && <span className="text-sm text-muted-foreground">{unit}</span>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="personalCurrent">Какой результат уже есть?</Label>
              <div className="flex items-center gap-2">
                <Input id="personalCurrent" type="number" min="0" value={currentValue} onChange={(event) => setCurrentValue(event.target.value)} />
                {!!unit && <span className="text-sm text-muted-foreground">{unit}</span>}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="personalContext">Расскажите о своей ситуации</Label>
            <Textarea id="personalContext" value={context} onChange={(event) => setContext(event.target.value)} placeholder="Что хотите изменить или получить? Что важно учесть?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personalApproach">Что уже делаете для результата?</Label>
            <Textarea id="personalApproach" value={currentApproach} onChange={(event) => setCurrentApproach(event.target.value)} placeholder="Можно написать «пока ничего»" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personalTime">Сколько времени готовы уделять?</Label>
            <Input id="personalTime" value={availableTime} onChange={(event) => setAvailableTime(event.target.value)} placeholder="Например: 2 часа по будням" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personalSteps">Какие первые действия хотите включить?</Label>
            <Textarea id="personalSteps" value={firstSteps} onChange={(event) => setFirstSteps(event.target.value)} placeholder={"Каждое действие — с новой строки\nНапример: обработать 50 контактов"} />
            <p className="text-xs text-muted-foreground">Позже ИИ предложит дополнительные шаги, но окончательное решение всегда остаётся за вами.</p>
          </div>
          {!!error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button disabled={!canSubmit || submitting} onClick={() => void submit()}>
            {submitting ? "Сохраняем…" : "Вступить с личной целью"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
