import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getChallengeCheckIns, getMyChallengePlan, submitChallengeCheckIn } from "@/shared/api/client";
import { formatChallengeReportError } from "@/shared/display/challengeErrors";
import { useAppStore } from "@/stores/useAppStore";
import type { Challenge, ChallengeCheckIn, ChallengeParticipant } from "@/types";

function lines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function formatValue(value: number | undefined, unit: string) {
  if (value == null) return "—";
  return `${value.toLocaleString("ru-RU")} ${unit}`.trim();
}

export function ChallengeCheckInDialog({ challenge, open, onOpenChange }: {
  challenge: Challenge;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [plan, setPlan] = useState<ChallengeParticipant | null>(null);
  const [checkIns, setCheckIns] = useState<ChallengeCheckIn[]>([]);
  const [factValue, setFactValue] = useState("");
  const [doneToday, setDoneToday] = useState("");
  const [tasksTomorrow, setTasksTomorrow] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const refreshAppData = useAppStore((state) => state.refreshAppData);
  const unit = plan?.unit || challenge.metricUnit || "";
  const numericFact = Number(factValue);
  const canSubmit = Number.isFinite(numericFact) && numericFact >= 0 && lines(doneToday).length > 0 && lines(tasksTomorrow).length > 0;

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

  const progress = useMemo(() => {
    if (!plan?.targetValue || plan.targetValue <= 0) return 0;
    return Math.min(100, Math.round(((Number(factValue) || 0) / plan.targetValue) * 100));
  }, [factValue, plan?.targetValue]);

  const submit = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      setError("");
      const saved = await submitChallengeCheckIn(challenge.id, {
        factValue: numericFact,
        doneToday: lines(doneToday),
        tasksTomorrow: lines(tasksTomorrow),
      });
      setCheckIns((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setPlan((current) => current ? { ...current, currentValue: numericFact } : current);
      await refreshAppData();
      setDoneToday("");
      setTasksTomorrow("");
    } catch (nextError) {
      setError(formatChallengeReportError(nextError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Отчёт · {challenge.title}</DialogTitle>
          <DialogDescription>
            Отчёт нужно сдать до {challenge.reportDeadline || "времени, указанного организатором"} ({challenge.reportTimeZone || "UTC"}).
          </DialogDescription>
        </DialogHeader>

        {loading ? <p className="text-sm text-muted-foreground">Загружаем личный план…</p> : (
          <div className="space-y-5">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div><p className="text-xs text-muted-foreground">План</p><p className="text-lg font-semibold">{formatValue(plan?.targetValue, unit)}</p></div>
                <div><p className="text-xs text-muted-foreground">Факт</p><p className="text-lg font-semibold">{formatValue(Number(factValue) || 0, unit)}</p></div>
                <div><p className="text-xs text-muted-foreground">Выполнено</p><p className="text-lg font-semibold">{progress}%</p></div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkInFact">Обновите факт</Label>
              <div className="flex items-center gap-2">
                <Input id="checkInFact" type="number" min="0" value={factValue} onChange={(event) => setFactValue(event.target.value)} />
                {!!unit && <span className="text-sm text-muted-foreground">{unit}</span>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkInDone">Сделано сегодня</Label>
              <Textarea id="checkInDone" value={doneToday} onChange={(event) => setDoneToday(event.target.value)} placeholder="Каждое действие — с новой строки" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkInTomorrow">Задачи на завтра</Label>
              <Textarea id="checkInTomorrow" value={tasksTomorrow} onChange={(event) => setTasksTomorrow(event.target.value)} placeholder="Каждая задача — с новой строки" />
            </div>
            {!!error && <p className="text-sm text-destructive">{error}</p>}
            <Button disabled={!canSubmit || submitting} onClick={() => void submit()}>
              {submitting ? "Публикуем…" : "Опубликовать отчёт в группе"}
            </Button>

            <div className="space-y-3 border-t pt-4">
              <h3 className="font-semibold">Отчёты группы</h3>
              {checkIns.length === 0 ? <p className="text-sm text-muted-foreground">Отчётов пока нет.</p> : checkIns.map((item) => (
                <div key={item.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong>{item.user.name}</strong>
                    <span className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.submittedAt))}
                      {item.isLate ? " · сдан поздно" : " · вовремя"}
                    </span>
                  </div>
                  <p><strong>План:</strong> {formatValue(item.planValue, unit)} · <strong>Факт:</strong> {formatValue(item.factValue, unit)}</p>
                  <div><strong>Сделано сегодня:</strong><ul className="list-disc pl-5">{item.doneToday.map((text) => <li key={text}>{text}</li>)}</ul></div>
                  <div><strong>Задачи на завтра:</strong><ul className="list-disc pl-5">{item.tasksTomorrow.map((text) => <li key={text}>{text}</li>)}</ul></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Закрыть</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
