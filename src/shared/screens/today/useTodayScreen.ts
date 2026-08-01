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
};

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

export function useTodayScreen() {
  const { goals, toggleTask } = useAppStore();

  const items = useMemo<TodayItem[]>(() => {
    const result: TodayItem[] = [];

    for (const goal of goals) {
      if (goal.archivedAt) continue;

      const recurring = goal.goalType === "TASK" && goal.goalPeriod !== "NONE";
      const deadline = isDueToday(goal.dueDate);
      if (!recurring && !deadline) continue;

      const leaves = goal.goalType === "TASK" ? leafTasks(goal.tasks) : [];
      const total = leaves.length;
      const done = leaves.filter((t) => isTaskCompletedThisPeriod(t, goal.goalPeriod)).length;

      result.push({
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
      });
    }

    // Незавершённые сверху, дедлайны выше
    return result.sort((a, b) => {
      if (a.allDone !== b.allDone) return a.allDone ? 1 : -1;
      if (a.isDeadline !== b.isDeadline) return a.isDeadline ? -1 : 1;
      return 0;
    });
  }, [goals]);

  const total = items.length;
  const done = items.filter((i) => i.allDone).length;

  // Галочка в «Сегодня» закрывает/открывает цель целиком за период:
  // если что-то не выполнено - доводим до конца (закрываем невыполненные листовые
  // задачи), если всё выполнено - снимаем отметки со всех. Работает и для одной
  // задачи, и для цели с множеством подзадач (в т.ч. еженедельной).
  const toggle = async (item: TodayItem) => {
    const goal = goals.find((g) => g.id === item.goalId);
    if (!goal || goal.goalType !== "TASK") return;
    const leaves = leafTasks(goal.tasks);
    if (leaves.length === 0) return;

    const incomplete = leaves.filter((t) => !isTaskCompletedThisPeriod(t, goal.goalPeriod));
    // Целевые id фиксируем снимком до цикла (toggleTask будет подменять цель в сторе).
    const targetIds = (incomplete.length === 0 ? leaves : incomplete).map((t) => t.id);

    for (const id of targetIds) {
      await toggleTask(id);
    }
  };

  return { items, total, done, toggle };
}
