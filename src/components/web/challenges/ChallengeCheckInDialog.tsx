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

type Slot = { name: string; done: boolean };

const MAX_SLOTS = 300;

function lines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function formatValue(value: number | undefined, unit: string) {
  if (value == null) return "—";
  return `${value.toLocaleString("ru-RU")} ${unit}`.trim();
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Строим ровно столько строк, сколько норма участника (напр. 40 у меня / 30 у друга),
// и заполняем первые строки уже отмеченными компаниями из сегодняшнего отчёта.
function buildSlots(target: number, doneNames: string[]): Slot[] {
  const rows = Math.min(MAX_SLOTS, Math.max(target, doneNames.length, 1));
  const slots: Slot[] = [];
  for (let i = 0; i < rows; i += 1) {
    const name = doneNames[i];
    slots.push(name ? { name, done: true } : { name: "", done: false });
  }
  return slots;
}

export function ChallengeCheckInDialog({ challenge, open, onOpenChange }: {
  challenge: Challenge;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const myId = useAppStore((state) => state.user?.id);
  const [plan, setPlan] = useState<ChallengeParticipant | null>(null);
  const [checkIns, setCheckIns] = useState<ChallengeCheckIn[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [tasksTomorrow, setTasksTomorrow] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const refreshAppData = useAppStore((state) => state.refreshAppData);
  const unit = plan?.unit || challenge.metricUnit || "";

  const target = plan?.targetValue && plan.targetValue > 0 ? plan.targetValue : 0;
  const doneNames = useMemo(() => slots.filter((s) => s.done && s.name.trim()).map((s) => s.name.trim()), [slots]);
  const doneCount = doneNames.length;
  const canSubmit = doneCount > 0;

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError("");
    void Promise.all([getMyChallengePlan(challenge.id), getChallengeCheckIns(challenge.id)])
      .then(([nextPlan, nextCheckIns]) => {
        if (!active) return;
        setPlan(nextPlan);
        setCheckIns(nextCheckIns);
        const goal = nextPlan.targetValue && nextPlan.targetValue > 0 ? nextPlan.targetValue : 10;
        // Догружаем сегодняшний свой отчёт - чтобы дополнять по ходу дня, а не вводить заново.
        const mine = nextCheckIns.find((c) => c.user?.id === myId && isSameDay(new Date(c.submittedAt), new Date()));
        setSlots(buildSlots(goal, mine?.doneToday ?? []));
        setTasksTomorrow((mine?.tasksTomorrow ?? []).join("\n"));
      })
      .catch(() => { if (active) setError("Не удалось загрузить личный план и отчёты."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [challenge.id, open, myId]);

  const progress = useMemo(() => {
    if (!target) return 0;
    return Math.min(100, Math.round((doneCount / target) * 100));
  }, [doneCount, target]);

  const patchSlot = (index: number, patch: Partial<Slot>) => {
    setSlots((current) => current.map((slot, i) => {
      if (i !== index) return slot;
      const next = { ...slot, ...patch };
      // Нельзя оставить галочку без названия - гасим её, если имя стёрли.
      if (!next.name.trim()) next.done = false;
      return next;
    }));
  };

  const addRow = () => setSlots((current) => (current.length >= MAX_SLOTS ? current : [...current, { name: "", done: false }]));

  const submit = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      setError("");
      const saved = await submitChallengeCheckIn(challenge.id, {
        factValue: doneCount,
        doneToday: doneNames,
        tasksTomorrow: lines(tasksTomorrow),
      });
      setCheckIns((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setPlan((current) => current ? { ...current, currentValue: doneCount } : current);
      await refreshAppData();
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
                <div><p className="text-xs text-muted-foreground">План</p><p className="text-lg font-semibold">{formatValue(target || undefined, unit)}</p></div>
                <div><p className="text-xs text-muted-foreground">Отмечено</p><p className="text-lg font-semibold">{formatValue(doneCount, unit)}</p></div>
                <div><p className="text-xs text-muted-foreground">Выполнено</p><p className="text-lg font-semibold">{progress}%</p></div>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded bg-background">
                <div className="h-full rounded bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Компании · отмечено {doneCount}{target ? ` из ${target}` : ""}</Label>
              <p className="text-xs text-muted-foreground">Впиши название и поставь галочку. Галочку нельзя поставить без названия.</p>
              <div className="max-h-[42vh] space-y-2 overflow-y-auto pr-1">
                {slots.map((slot, index) => (
                  <div key={index} className={`flex items-center gap-2 rounded-md border px-3 py-2 ${slot.done ? "bg-emerald-500/10 border-emerald-500/40" : "bg-muted/20"}`}>
                    <span className="w-6 flex-none text-right text-xs text-muted-foreground">{index + 1}</span>
                    <input
                      type="checkbox"
                      checked={slot.done}
                      disabled={!slot.name.trim()}
                      onChange={(event) => patchSlot(index, { done: event.target.checked })}
                      className="h-5 w-5 flex-none accent-emerald-500 disabled:opacity-30"
                      aria-label={`Отметить компанию №${index + 1}`}
                    />
                    <Input
                      value={slot.name}
                      onChange={(event) => patchSlot(index, { name: event.target.value })}
                      placeholder={`Компания №${index + 1}`}
                      className={`flex-1 ${slot.done ? "line-through" : ""}`}
                    />
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" onClick={addRow} disabled={slots.length >= MAX_SLOTS}>+ ещё строка</Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkInTomorrow">Задачи на завтра <span className="text-muted-foreground">(необязательно)</span></Label>
              <Textarea id="checkInTomorrow" value={tasksTomorrow} onChange={(event) => setTasksTomorrow(event.target.value)} placeholder="Каждая задача — с новой строки" />
            </div>

            {!!error && <p className="text-sm text-destructive">{error}</p>}
            <Button disabled={!canSubmit || submitting} onClick={() => void submit()}>
              {submitting ? "Публикуем…" : "Опубликовать отчёт в группе"}
            </Button>

            <div className="space-y-3 border-t pt-4">
              <h3 className="font-semibold">Отчёты группы · по дням</h3>
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
                  <div><strong>Сделано:</strong><ul className="list-disc pl-5">{item.doneToday.map((text) => <li key={text}>{text}</li>)}</ul></div>
                  {item.tasksTomorrow.length > 0 && (
                    <div><strong>Задачи на завтра:</strong><ul className="list-disc pl-5">{item.tasksTomorrow.map((text) => <li key={text}>{text}</li>)}</ul></div>
                  )}
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
