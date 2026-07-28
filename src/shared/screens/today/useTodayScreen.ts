import { useMemo } from "react";

import { useAppStore } from "@/stores/useAppStore";
import type { Goal, Task } from "@/types";
import { isTaskCompletedThisPeriod } from "@/shared/screens/goals/model";

export type TodayItem = {
  key: string;
  goalId: string;
  goalTitle: string;
  title: string;
  category: string;
  done: boolean;
  kind: "task" | "deadline";
  taskId?: string;
  goalPeriod: Goal["goalPeriod"];
};

function leafTasks(tasks: Task[]): Task[] {
  const out: Task[] = [];
  const walk = (list: Task[]) => {
    for (const t of list) {
      if (t.subtasks && t.subtasks.length > 0) {
        walk(t.subtasks);
      } else {
        out.push(t);
      }
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

      // Дедлайн сегодня
      if (isDueToday(goal.dueDate)) {
        const anyLeftToday =
          goal.goalType !== "TASK" ||
          leafTasks(goal.tasks).some((t) => !isTaskCompletedThisPeriod(t, goal.goalPeriod));
        result.push({
          key: `deadline-${goal.id}`,
          goalId: goal.id,
          goalTitle: goal.title,
          title: goal.title,
          category: goal.category,
          done: !anyLeftToday,
          kind: "deadline",
          goalPeriod: goal.goalPeriod,
        });
      }

      // Задачи регулярных целей (ежедневных/недельных/месячных)
      if (goal.goalType === "TASK" && goal.goalPeriod !== "NONE") {
        for (const task of leafTasks(goal.tasks)) {
          result.push({
            key: `task-${task.id}`,
            goalId: goal.id,
            goalTitle: goal.title,
            title: task.title,
            category: goal.category,
            done: isTaskCompletedThisPeriod(task, goal.goalPeriod),
            kind: "task",
            taskId: task.id,
            goalPeriod: goal.goalPeriod,
          });
        }
      }
    }

    // Невыполненные сверху, дедлайны выше обычных задач
    return result.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (a.kind !== b.kind) return a.kind === "deadline" ? -1 : 1;
      return 0;
    });
  }, [goals]);

  const total = items.length;
  const done = items.filter((i) => i.done).length;

  const toggle = async (item: TodayItem) => {
    if (item.taskId) {
      await toggleTask(item.taskId);
    }
  };

  return { items, total, done, toggle };
}
