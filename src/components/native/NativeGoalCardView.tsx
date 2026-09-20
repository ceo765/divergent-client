import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { ProgressRing } from "@/components/shared/ProgressRing";
import {
  GoalCardActions,
  GoalCardHeader,
  GoalFooter,
  GoalLinkedItems,
  GoalNumericProgressInput,
  GoalProgressSection,
  GoalTaskSection,
} from "@/components/native/GoalCardParts";
import { NutritionSheet, todayRange } from "@/components/native/NutritionSheet";
import { ActionChip } from "@/components/native/ActionChip";
import { SurfaceCard } from "@/components/native/SurfaceCard";
import { fetchMeals } from "@/shared/api/client";
import { isTaskCompletedThisPeriod, sumCompletedTaskXp } from "@/shared/screens/goals/model";
import { appPalette } from "@/theme/palette";
import type { Goal, GoalPeriod, MealsDay, Reward, Task } from "@/types";

function countTasks(tasks?: Task[]): number {
  if (!tasks || tasks.length === 0) return 0;
  return tasks.reduce((sum, task) => sum + 1 + countTasks(task.subtasks), 0);
}

function countCompleted(tasks: Task[] | undefined, goalPeriod: GoalPeriod): number {
  if (!tasks || tasks.length === 0) return 0;
  return tasks.reduce((sum, task) => sum + (isTaskCompletedThisPeriod(task, goalPeriod) ? 1 : 0) + countCompleted(task.subtasks, goalPeriod), 0);
}

function hasChallengeStartedForUser(challengeStart: Date, userTimeZone: string) {
  const now = new Date();
  const nowInUserTZ = new Date(new Intl.DateTimeFormat("en-US", { timeZone: userTimeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now));
  const startInUserTZ = new Date(new Intl.DateTimeFormat("en-US", { timeZone: userTimeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(challengeStart));
  return startInUserTZ <= nowInUserTZ;
}

function getGoalStatus(goal: Goal) {
  const now = new Date();
  const due = goal.dueDate ? new Date(goal.dueDate) : null;
  if (due) due.setDate(due.getDate() + 1);
  const completedAt = goal.lastCompletedAt ? new Date(goal.lastCompletedAt) : null;
  const isExpired = due ? now > due : false;

  if (completedAt) {
    if (due && completedAt > due) return "FAILED" as const;
    return "COMPLETED" as const;
  }
  if (isExpired) return "FAILED" as const;
  return "ACTIVE" as const;
}

export function NativeGoalCardView({ goal, categoryLabel, reward, userTimeZone, autoExpand = false, focused = false, onEdit, onTaskToggle, onAddReminder, onAddProgress, onGoToProgress }: { goal: Goal; categoryLabel: string; reward?: Reward | null; userTimeZone: string; autoExpand?: boolean; focused?: boolean; onEdit?: (id: string) => void; onTaskToggle: (goalId: string, taskId: string, setLog?: { weight?: number | null; reps?: number | null }) => Promise<void>; onAddReminder?: (id: string) => void; onAddProgress?: (goalId: string, delta: number) => void; onGoToProgress?: (id: string) => void }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(autoExpand);
  const [progressDelta, setProgressDelta] = useState("");
  const [highlight, setHighlight] = useState(focused);
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [nutritionDay, setNutritionDay] = useState<MealsDay | null>(null);

  const safeTasks = goal.tasks ?? [];
  const totalTasks = countTasks(safeTasks);
  const completedTasks = countCompleted(safeTasks, goal.goalPeriod);
  const isNumeric = goal.goalType === "PROGRESS";
  const completedTaskXp = sumCompletedTaskXp(safeTasks, goal.goalPeriod);
  const isXpBasedTaskGoal = goal.goalType === "TASK" && goal.taskXpTarget != null;
  const progress = isNumeric
    ? goal.targetValue && goal.targetValue > 0
      ? Math.min(((goal.currentValue ?? 0) / goal.targetValue) * 100, 100)
      : 0
    : isXpBasedTaskGoal
      ? goal.taskXpTarget && goal.taskXpTarget > 0
        ? Math.min((completedTaskXp / goal.taskXpTarget) * 100, 100)
        : 100
    : totalTasks > 0
      ? (completedTasks / totalTasks) * 100
      : 0;

  const isNutrition = Boolean(goal.isNutrition);
  const nutritionTarget = goal.targetValue ?? 0;
  const nutritionEaten = nutritionDay?.totals.calories ?? 0;
  const ringProgress = isNutrition ? (nutritionTarget > 0 ? Math.min((nutritionEaten / nutritionTarget) * 100, 100) : 0) : progress;

  const status = getGoalStatus(goal);
  const statusLabel = status === "COMPLETED" ? t("goals.task_status_completed") : status === "FAILED" ? t("goals.task_status_failed") : null;
  const challengeStarted = goal.challenge?.startsAt ? hasChallengeStartedForUser(new Date(goal.challenge.startsAt), userTimeZone) : true;
  const disabledTasks = Boolean(goal.challenge && !challengeStarted);
  const cycleLabel = useMemo(() => {
    if (goal.goalPeriod === "DAILY") return t("goal_period.daily");
    if (goal.goalPeriod === "WEEKLY") return t("goal_period.weekly");
    if (goal.goalPeriod === "MONTHLY") return t("goal_period.monthly");
    return null;
  }, [goal.goalPeriod, t]);

  useEffect(() => {
    if (autoExpand) {
      setIsOpen(true);
    }
  }, [autoExpand]);

  useEffect(() => {
    if (!isNutrition) return;
    const { from, to } = todayRange();
    void fetchMeals(goal.id, from, to).then(setNutritionDay).catch(() => undefined);
  }, [goal.id, isNutrition]);

  useEffect(() => {
    if (!focused) {
      return;
    }

    setHighlight(true);
    const timeout = setTimeout(() => setHighlight(false), 2000);
    return () => clearTimeout(timeout);
  }, [focused]);

  return (
    <View style={{ backgroundColor: highlight ? appPalette.semantic.infoSurfaceStrong : "transparent", borderRadius: 12 }}>
      <SurfaceCard gap={16} padding={24} radius={12}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <GoalCardHeader goal={goal} categoryLabel={categoryLabel} statusLabel={statusLabel} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <ProgressRing progress={ringProgress} size={70} strokeWidth={6} />
            <GoalCardActions goal={goal} onEdit={onEdit} onAddReminder={onAddReminder} onGoToProgress={onGoToProgress} />
          </View>
        </View>
        <GoalProgressSection goal={goal} progress={progress} completedTasks={completedTasks} totalTasks={totalTasks} />
        <GoalLinkedItems goalId={goal.id} />
        {isNutrition && (
          <View style={{ gap: 8 }}>
            <Text style={{ color: appPalette.semantic.textStrong, fontSize: 14, fontWeight: "600", fontFamily: "Montserrat" }}>
              Сегодня: {nutritionEaten}{nutritionTarget > 0 ? ` из ${nutritionTarget}` : ""} ккал
            </Text>
            <ActionChip tone="primary" onPress={() => setNutritionOpen(true)}>Добавить еду по фото</ActionChip>
            <NutritionSheet goal={goal} open={nutritionOpen} onOpenChange={setNutritionOpen} onChanged={setNutritionDay} />
          </View>
        )}
        {goal.goalType === "PROGRESS" && !isNutrition && (
          <GoalNumericProgressInput
            progressDelta={progressDelta}
            onChangeProgressDelta={setProgressDelta}
            onAddProgress={() => {
              const value = Number(progressDelta);
              if (!Number.isNaN(value) && value !== 0) {
                onAddProgress?.(goal.id, value);
                setProgressDelta("");
              }
            }}
          />
        )}
        {goal.goalType === "TASK" && <GoalTaskSection goal={goal} isOpen={isOpen} onToggleOpen={() => setIsOpen((current) => !current)} onTaskToggle={onTaskToggle} disabledTasks={disabledTasks} />}
        <GoalFooter goal={goal} reward={reward} cycleLabel={cycleLabel} />
      </SurfaceCard>
    </View>
  );
}
