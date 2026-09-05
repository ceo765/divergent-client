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

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function ChallengeCheckInDialog({ challenge, open, onOpenChange }: {
  challenge: Challenge;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const myId = useAppStore((state) => state.user?.id);
  const [plan, setPlan] = useState<ChallengeParticipant | null>(null);
  const [checkIns, setCheckIns] = useState<ChallengeCheckIn[]>([]);
  const [items, setItems] = useState<string[]>([]); // сделано сегодня (напр. компании)
  const [newItem, setNewItem] = useState("");
  const [autoFact, setAutoFact] = useState(true); // факт = число позиций в списке
  const [factManual, setFactManual] = useState("");
  const [tasksTomorrow, setTasksTomorrow] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const refreshAppData = useAppStore((state) => state.refreshAppData);
  const unit = plan?.unit || challenge.metricUnit || "";

  const numericFact = autoFact ? items.length : (Number(factManual) || 0);
  const canSubmit = Number.isFinite(numericFact) && numericFact >= 0 && items.length > 0;

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
        // Догружаем сегодняшний свой отчёт - чтобы добавлять по ходу дня, а не вводить заново.
        const mine = nextCheckIns.find((c) => c.user?.id === myId && isSameDay(new Date(c.submittedAt), new Date()));
        if (mine) {
          setItems(mine.doneToday ?? []);
          setFactManual(String(mine.factValue ?? 0));
          setAutoFact((mine.factValue ?? 0) === (mine.doneToday?.length ?? 0));
          setTasksTomorrow((mine.tasksTomorrow ?? []).join("\n"));
        } else {
          setItems([]);
          setFactManual(String(nextPlan.currentValue ?? 0));
          setAutoFact(true);
          setTasksTomorrow("");
        }
      })
      .catch(() => { if (active) setError("Не удалось загрузить личный план и отчёты."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [challenge.id, open, myId]);

  const progress = useMemo(() => {
    if (!plan?.targetValue || plan.targetValue <= 0) return 0;
    return Math.min(100, Math.round((numericFact / plan.targetValue) * 100));
  }, [numericFact, plan?.targetValue]);

  const addItem = () => {
    const v = newItem.trim();
    if (!v) return;
    setItems((current) => [...current, v]);
    setNewItem("");
  };

  const submit = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      setError("");
      const saved = await submitChallengeCheckIn(challenge.id, {
        factValue: numericFact,
        doneToday: items,
        tasksTomorrow: lines(tasksTomorrow),
      });
      setCheckIns((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setPlan((current) => current ? { ...current, currentValue: numericFact } : current);
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
                <div><p className="text-xs text-muted-foreground">План</p><p className="text-lg font-semibold">{formatValue(plan?.targetValue, unit)}</p></div>
                <div><p className="text-xs text-muted-foreground">Факт</p><p className="text-lg font-semibold">{formatValue(numericFact, unit)}</p></div>
                <div><p className="text-xs text-muted-foreground">Выполнено</p><p className="text-lg font-semibold">{progress}%</p></div>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded bg-background">
                <div className="h-full rounded bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Сделано сегодня {items.length > 0 && <span className="text-muted-foreground">· {items.length}</span>}</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={newItem}
                  onChange={(event) => setNewItem(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addItem(); } }}
                  placeholder="Например: компания «SkyHub» — обработана"
                />
                <Button type="button" onClick={addItem}>Добавить</Button>
              </div>
              <div className="space-y-2">
                {items.map((text, index) => (
                  <div key={`${text}-${index}`} className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2">
                    <span className="flex h-5 w-5 flex-none items-center justify-center rounded bg-emerald-500 text-xs text-white">✓</span>
                    <span className="flex-1 text-sm">{text}</span>
                    <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setItems((current) => current.filter((_, i) => i !== index))}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={autoFact} onChange={(event) => setAutoFact(event.target.checked)} />
                Считать факт по списку (= {items.length})
              </label>
              {!autoFact && (
                <div className="flex items-center gap-2">
                  <Input type="number" min="0" value={factManual} onChange={(event) => setFactManual(event.target.value)} />
                  {!!unit && <span className="text-sm text-muted-foreground">{unit}</span>}
                </div>
              )}
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
