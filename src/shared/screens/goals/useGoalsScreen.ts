import { useState } from "react";

import { useAppStore } from "@/stores/useAppStore";
import type { CategoryOption, Goal, GoalFormData, Reminder, ReportUploadPayload } from "@/types";
import { findTaskRecursive, isTaskCompletedThisPeriod } from "./model";

type SaveGoalResult =
  | { status: "created"; goalId: string }
  | { status: "updated"; goalId: string };

type SaveReminderResult =
  | { status: "created"; reminderId: string }
  | { status: "updated"; reminderId: string };

type ToggleTaskResult =
  | { status: "report_required"; taskId: string }
  | { status: "completed"; xpReward: number }
  | { status: "toggled" }
  | { status: "ignored" };

export function useGoalsScreen(
  options: {
    onNavigateToProgress?: (goalId: string) => void;
    onReminderCreated?: () => void;
  } = {},
) {
  const {
    loading,
    goals,
    reminders,
    addGoal,
    updateGoal,
    toggleTask,
    addReminder,
    addCategory,
    addReport,
    updateReminder,
    updateRewardGoal,
    updateGoalProgress,
    deleteGoal,
    rewards,
    categories,
  } = useAppStore();

  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();
  const [createReportDialogOpen, setCreateReportDialogOpen] = useState(false);
  const [reportTaskId, setReportTaskId] = useState<string | null>(null);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>(undefined);
  const [selectedGoalIdForReminder, setSelectedGoalIdForReminder] = useState<string | undefined>(undefined);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(undefined);

  const openCreateGoal = () => {
    setEditingGoal(undefined);
    setGoalDialogOpen(true);
  };

  const openEditGoal = (id: string) => {
    const goal = goals.find((item) => item.id === id);
    if (!goal) {
      return;
    }

    setEditingGoal(goal);
    setGoalDialogOpen(true);
  };

  const saveGoal = async (goal: GoalFormData): Promise<SaveGoalResult> => {
    if (editingGoal) {
      await updateGoal(goal);
      await updateRewardGoal(goal.id, goal.rewardId ?? undefined);
      setEditingGoal(undefined);
      setGoalDialogOpen(false);
      return { status: "updated", goalId: goal.id };
    }

    await addGoal(goal);
    await updateRewardGoal(goal.id, goal.rewardId ?? undefined);
    setEditingGoal(undefined);
    setGoalDialogOpen(false);
    return { status: "created", goalId: goal.id };
  };

  const removeGoal = async (id: string) => {
    const goal = goals.find((item) => item.id === id);
    if (!goal) {
      return false;
    }

    await deleteGoal(goal);
    setGoalDialogOpen(false);
    return true;
  };

  const saveReminder = async (reminder: Reminder): Promise<SaveReminderResult> => {
    if (editingReminder) {
      await updateReminder(reminder);
      setEditingReminder(undefined);
      setReminderDialogOpen(false);
      return { status: "updated", reminderId: reminder.id };
    }

    await addReminder(reminder);
    setEditingReminder(undefined);
    setReminderDialogOpen(false);
    options.onReminderCreated?.();
    return { status: "created", reminderId: reminder.id };
  };

  const openReminderForGoal = (goalId: string) => {
    setSelectedGoalIdForReminder(goalId);
    setEditingReminder(undefined);
    setReminderDialogOpen(true);
  };

  const openReportForTask = (taskId: string) => {
    const matchingGoal = goals.find((goal) => findTaskRecursive(goal.tasks, taskId));
    if (!matchingGoal) {
      return false;
    }

    setReportTaskId(taskId);
    setCreateReportDialogOpen(true);
    return true;
  };

  const saveReport = async ({ file, fileName, mimeType, comment }: ReportUploadPayload) => {
    if (!reportTaskId) {
      return false;
    }

    await addReport(reportTaskId, { file, fileName, mimeType, comment });
    setCreateReportDialogOpen(false);
    setReportTaskId(null);
    return true;
  };

  const toggleGoalTask = async (goalId: string, taskId: string): Promise<ToggleTaskResult> => {
    const goal = goals.find((item) => item.id === goalId);
    if (!goal) {
      return { status: "ignored" };
    }

    const task = findTaskRecursive(goal.tasks, taskId);
    if (!task) {
      return { status: "ignored" };
    }

    const newCompleted = !isTaskCompletedThisPeriod(task, goal.goalPeriod);

    if (newCompleted && goal.challenge?.requiresReport) {
      setReportTaskId(taskId);
      setCreateReportDialogOpen(true);
      return { status: "report_required", taskId };
    }

    await toggleTask(taskId);

    if (newCompleted) {
      return { status: "completed", xpReward: task.xpReward ?? 0 };
    }

    return { status: "toggled" };
  };

  const addProgress = (goalId: string, delta: number) => updateGoalProgress(goalId, delta);

  const navigateToProgress = (goalId: string) => {
    options.onNavigateToProgress?.(goalId);
  };

  const createCategory = (category: CategoryOption) => {
    addCategory(category);
    return category;
  };

  const openAi = (prompt?: string) => {
    setAiInitialPrompt(prompt?.trim() || undefined);
    setAiOpen(true);
  };

  return {
    loading,
    goals,
    reminders,
    rewards,
    categories,
    goalDialogOpen,
    editingGoal,
    createReportDialogOpen,
    reminderDialogOpen,
    editingReminder,
    selectedGoalIdForReminder,
    aiOpen,
    aiInitialPrompt,
    setGoalDialogOpen,
    setCreateReportDialogOpen,
    setReminderDialogOpen,
    setAiOpen,
    openAi,
    openCreateGoal,
    openEditGoal,
    saveGoal,
    removeGoal,
    addProgress,
    navigateToProgress,
    createCategory,
    openReminderForGoal,
    openReportForTask,
    saveReminder,
    saveReport,
    toggleGoalTask,
  };
}
