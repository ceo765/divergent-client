import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp } from "lucide-react";
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

// Инлайн-панель отчёта прямо на карточке челленджа: компании как задачи в цели,
// с галочками и полем названия, а кнопка «Сдать отчёт» - в конце списка.
export function ChallengeReportPanel({ challenge }: { challenge: Challenge }) {
  const myId = useAppStore((state) => state.user?.id);
  const refreshAppData = useAppStore((state) => state.refreshAppData);
  const [plan, setPlan] = useState<ChallengeParticipant | null>(null);
  const [checkIns, setCheckIns] = useState<ChallengeCheckIn[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [tasksTomorrow, setTasksTomorrow] = useState("");
  const [tomorrowOpen, setTomorrowOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savedNote, setSavedNote] = useState(false);
  const [error, setError] = useState("");

  const unit = plan?.unit || challenge.metricUnit || "";
  const target = plan?.targetValue && plan.targetValue > 0 ? plan.targetValue : 0;
  const doneNames = useMemo(() => slots.filter((s) => s.done && s.name.trim()).map((s) => s.name.trim()), [slots]);
  const doneCount = doneNames.length;
  const canSubmit = doneCount > 0;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void Promise.all([getMyChallengePlan(challenge.id), getChallengeCheckIns(challenge.id)])
      .then(([nextPlan, nextCheckIns]) => {
        if (!active) return;
        setPlan(nextPlan);
        setCheckIns(nextCheckIns);
        const goal = nextPlan.targetValue && nextPlan.targetValue > 0 ? nextPlan.targetValue : 10;
        const mine = nextCheckIns.find((c) => c.user?.id === myId && isSameDay(new Date(c.submittedAt), new Date()));
        setSlots(buildSlots(goal, mine?.doneToday ?? []));
        setTasksTomorrow((mine?.tasksTomorrow ?? []).join("\n"));
      })
      .catch(() => { if (active) setError("Не удалось загрузить личный план."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [challenge.id, myId]);

  const progress = useMemo(() => {
    if (!target) return 0;
    return Math.min(100, Math.round((doneCount / target) * 100));
  }, [doneCount, target]);

  const patchSlot = (index: number, patch: Partial<Slot>) => {
    setSavedNote(false);
    setSlots((current) => current.map((slot, i) => {
      if (i !== index) return slot;
      const next = { ...slot, ...patch };
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
      setSavedNote(true);
      setHistoryOpen(true); // сразу показываем записанный отчёт - «кого обработал сегодня»
      await refreshAppData();
    } catch (nextError) {
      setError(formatChallengeReportError(nextError));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="py-2 text-sm text-muted-foreground">Загружаем компании…</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Компании · {doneCount}{target ? ` из ${target}` : ""}</span>
        <span className="text-muted-foreground">{progress}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-muted">
        <div className="h-full rounded bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">Впиши название и поставь галочку. Без названия галочку не поставить.</p>

      <div className="max-h-[46vh] space-y-1.5 overflow-y-auto pr-1">
        {slots.map((slot, index) => (
          <div key={index} className={`flex items-center gap-2 rounded-md border px-2 py-1.5 ${slot.done ? "border-emerald-500/40 bg-emerald-500/10" : "bg-muted/20"}`}>
            <span className="w-5 flex-none text-right text-xs text-muted-foreground">{index + 1}</span>
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
              className={`h-8 flex-1 ${slot.done ? "line-through" : ""}`}
            />
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={slots.length >= MAX_SLOTS}>
        + ещё строка
      </Button>

      <Collapsible open={tomorrowOpen} onOpenChange={setTomorrowOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="transparent" size="sm" className="w-full justify-between px-0">
            <span className="text-sm">Задачи на завтра (необязательно)</span>
            {tomorrowOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-1">
          <Textarea value={tasksTomorrow} onChange={(event) => setTasksTomorrow(event.target.value)} placeholder="Каждая задача — с новой строки" />
        </CollapsibleContent>
      </Collapsible>

      {!!error && <p className="text-sm text-destructive">{error}</p>}
      {savedNote && !error && (
        <p className="text-sm text-emerald-600">Отчёт за сегодня записан: {doneCount}{target ? ` из ${target}` : ""} компаний.</p>
      )}

      <Button className="w-full" disabled={!canSubmit || submitting} onClick={() => void submit()}>
        {submitting ? "Отправляем…" : "Сдать отчёт"}
      </Button>

      <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="transparent" size="sm" className="w-full justify-between px-0">
            <span className="text-sm">Кого обработал · отчёты по дням</span>
            {historyOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          {checkIns.length === 0 ? <p className="text-sm text-muted-foreground">Отчётов пока нет.</p> : checkIns.map((item) => (
            <div key={item.id} className="rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>{item.user.name}</strong>
                <span className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.submittedAt))}
                  {item.isLate ? " · поздно" : " · вовремя"}
                </span>
              </div>
              <p className="mt-1"><strong>План:</strong> {formatValue(item.planValue, unit)} · <strong>Факт:</strong> {formatValue(item.factValue, unit)}</p>
              {item.doneToday.length > 0 && (
                <ul className="mt-1 list-disc pl-5">{item.doneToday.map((text) => <li key={text}>{text}</li>)}</ul>
              )}
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
