import { useMemo } from "react";

import { useAppStore } from "@/stores/useAppStore";
import type { Goal, Task } from "@/types";
import { isTaskCompletedThisPeriod } from "@/shared/screens/goals/model";

export type TodayItem = {
  key: string;
  goalId: string;
  goalTitle: string;
  category: string;
  total: number;
  done: number;
  allDone: boolean;
  singleTaskId?: string;
  isDeadline: boolean;
  goalPeriod: Goal["goalPeriod"];
  // Отмечена ли цель в «Сегодня» (одиночная = реально выполнена;
  // многозадачная = дневная отметка ИЛИ все задачи закрыты).
  checked: boolean;
};

export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Одиночная цель считается закрытой по факту выполнения задачи; многозадачная -
// по дневной отметке (или если все задачи в цели уже закрыты).
function computeChecked(item: Omit<TodayItem, "checked">, todayChecks: string[]): boolean {
  if (item.singleTaskId) return item.allDone;
  return item.allDone || todayChecks.includes(item.goalId);
}

function leafTasks(tasks: Task[]): Task[] {
  const out: Task[] = [];
  const walk = (list: Task[]) => {
    for (const t of list) {
      if (t.subtasks && t.subtasks.length > 0) walk(t.subtasks);
      else out.push(t);
    }
  };
  walk(tasks ?? []);
  return out;
}

function isDueToday(dueDate?: string): boolean {
  if (!dueDate) return false;
  const key = new Date().toISOString().slice(0, 10);
  return String(dueDate).slice(0, 10) === key;
}

// Базовый список целей на сегодня (без учёта дневных отметок).
function buildTodayItems(goals: Goal[], todayChecks: string[]): TodayItem[] {
  const result: TodayItem[] = [];

  for (const goal of goals) {
    if (goal.archivedAt) continue;

    const recurring = goal.goalType === "TASK" && goal.goalPeriod !== "NONE";
    const deadline = isDueToday(goal.dueDate);
    if (!recurring && !deadline) continue;

    const leaves = goal.goalType === "TASK" ? leafTasks(goal.tasks) : [];
    const total = leaves.length;
    const done = leaves.filter((t) => isTaskCompletedThisPeriod(t, goal.goalPeriod)).length;

    const base: Omit<TodayItem, "checked"> = {
      key: `goal-${goal.id}`,
      goalId: goal.id,
      goalTitle: goal.title,
      category: goal.category,
      total,
      done,
      allDone: total > 0 ? done === total : false,
      singleTaskId: total === 1 ? leaves[0].id : undefined,
      isDeadline: deadline,
      goalPeriod: goal.goalPeriod,
    };
    result.push({ ...base, checked: computeChecked(base, todayChecks) });
  }

  // Незакрытые сверху, дедлайны выше
  return result.sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1;
    if (a.isDeadline !== b.isDeadline) return a.isDeadline ? -1 : 1;
    return 0;
  });
}

export function useTodayScreen() {
  const goals = useAppStore((s) => s.goals);
  const todayChecks = useAppStore((s) => s.todayChecks);
  const todayStreak = useAppStore((s) => s.todayStreak);
  const todayLongest = useAppStore((s) => s.todayLongest);
  const toggleTask = useAppStore((s) => s.toggleTask);
  const setTodayCheck = useAppStore((s) => s.setTodayCheck);
  const setPerfectDay = useAppStore((s) => s.setPerfectDay);
  const loadTodayState = useAppStore((s) => s.loadTodayState);

  const date = localDateKey();
  const items = useMemo(() => buildTodayItems(goals, todayChecks), [goals, todayChecks]);

  const total = items.length;
  const done = items.filter((i) => i.checked).length;

  // Одиночная цель (напр. «Чтение») - реально закрываем задачу (синк в цель).
  // Многозадачная - ставим/снимаем дневную отметку, НЕ трогая задачи внутри цели.
  // После любого тапа пересчитываем «идеальный день» (закрыт ли весь список).
  const toggle = async (item: TodayItem) => {
    if (item.singleTaskId) {
      await toggleTask(item.singleTaskId);
    } else {
      await setTodayCheck(item.goalId, !item.checked, date);
    }

    const st = useAppStore.getState();
    const fresh = buildTodayItems(st.goals, st.todayChecks);
    const allChecked = fresh.length > 0 && fresh.every((it) => it.checked);
    await setPerfectDay(date, allChecked);
  };

  return { items, total, done, toggle, date, loadTodayState, todayStreak, todayLongest };
}
