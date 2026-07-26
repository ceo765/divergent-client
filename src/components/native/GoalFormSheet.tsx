import { useEffect, useMemo, useState } from "react";
import { Alert, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ActionChip } from "@/components/native/ActionChip";
import { FieldInput } from "@/components/native/FieldInput";
import { FormSheetLayout } from "@/components/native/form-sheet/Layout";
import {
  CategorySection,
  DueDateSection,
  GoalPeriodSection,
  GoalTypeSection,
  WorkoutToggleSection,
  ProgressFieldsSection,
  RewardSection,
  TaskXpTargetSection,
  TasksSection,
} from "@/components/native/goal-form-sheet/Sections";
import { createTask } from "@/components/native/goal-form-sheet/helpers";
import { sumTaskXp } from "@/shared/screens/goals/model";
import type { CategoryOption, Goal, GoalFormData, GoalPeriod, GoalType, Reward, Task } from "@/types";

function addSubtaskRecursive(currentTasks: Task[], parentId: string, subtask: Task): Task[] {
  return currentTasks.map((task) => {
    if (task.id === parentId) {
      return {
        ...task,
        subtasks: [...(task.subtasks ?? []), subtask],
      };
    }

    if (task.subtasks?.length) {
      return {
        ...task,
        subtasks: addSubtaskRecursive(task.subtasks, parentId, subtask),
      };
    }

    return task;
  });
}

function removeTaskRecursive(currentTasks: Task[], idToRemove: string): Task[] {
  return currentTasks
    .filter((task) => task.id !== idToRemove)
    .map((task) => ({
      ...task,
      subtasks: task.subtasks?.length ? removeTaskRecursive(task.subtasks, idToRemove) : [],
    }));
}

export function GoalFormSheet({
  open,
  goal,
  categories,
  rewards,
  onOpenChange,
  onSave,
  onDelete,
  onArchive,
  onUnarchive,
  onAddCategory,
}: {
  open: boolean;
  goal?: Goal;
  categories: CategoryOption[];
  rewards: Reward[];
  onOpenChange: (open: boolean) => void;
  onSave: (data: GoalFormData) => Promise<unknown>;
  onDelete: (id: string) => Promise<boolean>;
  onArchive?: (id: string) => Promise<void>;
  onUnarchive?: (id: string) => Promise<void>;
  onAddCategory: (category: CategoryOption) => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]?.value ?? "personal");
  const [goalType, setGoalType] = useState<GoalType>("TASK");
  const [isWorkout, setIsWorkout] = useState(false);
  const [goalPeriod, setGoalPeriod] = useState<GoalPeriod>("NONE");
  const [dueDate, setDueDate] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [taskXpTarget, setTaskXpTarget] = useState("");
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskXp, setNewTaskXp] = useState("");
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [newSubTaskTitles, setNewSubTaskTitles] = useState<Record<string, string>>({});
  const [newSubTaskXps, setNewSubTaskXps] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeRewardId = useMemo(() => {
    if (!goal) {
      return selectedRewardId;
    }

    return selectedRewardId ?? rewards.find((reward) => reward.goalId === goal.id)?.id ?? null;
  }, [goal, rewards, selectedRewardId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description ?? "");
      setCategory(goal.category);
      setGoalType(goal.goalType);
      setIsWorkout(Boolean(goal.isWorkout));
      setGoalPeriod(goal.goalPeriod);
      setDueDate(goal.dueDate ?? "");
      setCurrentValue(goal.currentValue?.toString() ?? "");
      setTargetValue(goal.targetValue?.toString() ?? "");
      setTaskXpTarget(goal.taskXpTarget?.toString() ?? "");
      setTasks(goal.tasks ?? []);
      setSelectedRewardId(rewards.find((reward) => reward.goalId === goal.id)?.id ?? null);
      setExpandedTasks({});
      setNewSubTaskTitles({});
      setNewSubTaskXps({});
      setNewTaskTitle("");
      setNewTaskXp("");
      return;
    }

    setTitle("");
    setDescription("");
    setCategory(categories[0]?.value ?? "personal");
    setGoalType("TASK");
    setIsWorkout(false);
    setGoalPeriod("NONE");
    setDueDate("");
    setCurrentValue("");
    setTargetValue("");
    setTaskXpTarget("");
    setTasks([]);
    setNewTaskTitle("");
    setNewTaskXp("");
    setSelectedRewardId(null);
    setExpandedTasks({});
    setNewSubTaskTitles({});
    setNewSubTaskXps({});
  }, [open, goal, rewards]);

  const addTask = () => {
    const nextTitle = newTaskTitle.trim();
    if (!nextTitle) {
      return;
    }

    const nextXpRaw = newTaskXp.trim();
    const nextXp = nextXpRaw ? Number(nextXpRaw) : undefined;

    setTasks((current) => [...current, createTask(nextTitle, Number.isFinite(nextXp) ? nextXp : undefined)]);
    setNewTaskTitle("");
    setNewTaskXp("");
  };

  const addSubTask = (parentId: string) => {
    const nextTitle = (newSubTaskTitles[parentId] ?? "").trim();
    if (!nextTitle) {
      return;
    }

    const nextXpRaw = (newSubTaskXps[parentId] ?? "").trim();
    const nextXp = nextXpRaw ? Number(nextXpRaw) : undefined;

    setTasks((current) =>
      addSubtaskRecursive(current, parentId, {
        ...createTask(nextTitle),
        parentId,
        xpReward: Number.isFinite(nextXp) ? nextXp : undefined,
      }),
    );
    setExpandedTasks((current) => ({ ...current, [parentId]: true }));
    setNewSubTaskTitles((current) => ({ ...current, [parentId]: "" }));
    setNewSubTaskXps((current) => ({ ...current, [parentId]: "" }));
  };

  const removeTask = (taskId: string) => {
    setTasks((current) => removeTaskRecursive(current, taskId));
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((current) => ({ ...current, [taskId]: !current[taskId] }));
  };

  const totalTaskXp = sumTaskXp(tasks);
  const parsedTaskXpTarget = taskXpTarget.trim() === "" ? undefined : Number(taskXpTarget);
  const isTaskXpTargetValid =
    goalType !== "TASK" ||
    parsedTaskXpTarget === undefined ||
    (Number.isFinite(parsedTaskXpTarget) && parsedTaskXpTarget >= 0 && parsedTaskXpTarget <= totalTaskXp);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t("goals.dialog.title_label"), t("goals.dialog.title_placeholder"));
      return;
    }

    if (goalType === "TASK" && tasks.length === 0) {
      Alert.alert(t("goals.dialog.tasks_label"), t("goals.dialog.empty_tasks"));
      return;
    }

    if (!isTaskXpTargetValid) {
      Alert.alert(t("goals.dialog.task_xp_target_label"), t("goals.dialog.task_xp_total_label"));
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        id: goal?.id ?? `${Date.now()}`,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        tasks: goalType === "TASK" ? tasks : [],
        dueDate: dueDate.trim() || undefined,
        lastCompletedAt: goal?.lastCompletedAt,
        xpReward: goal?.xpReward,
        taskXpTarget: goalType === "TASK" && parsedTaskXpTarget !== undefined ? parsedTaskXpTarget : undefined,
        currentValue: goalType === "PROGRESS" && currentValue.trim() !== "" ? Number(currentValue) : undefined,
        targetValue: goalType === "PROGRESS" && targetValue.trim() !== "" ? Number(targetValue) : undefined,
        goalType,
        isWorkout: goalType === "TASK" ? isWorkout : false,
        goalPeriod,
        rewardId: activeRewardId,
        challenge: goal?.challenge,
        challengeId: goal?.challengeId,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!goal) {
      return;
    }

    Alert.alert(t("common.delete"), t("goals.dialog.edit_title"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          void onDelete(goal.id).then((ok) => {
            if (ok) {
              onOpenChange(false);
            }
          });
        },
      },
    ]);
  };

  return (
    <FormSheetLayout
      open={open}
      onOpenChange={onOpenChange}
      title={goal ? t("goals.dialog.edit_title") : t("goals.dialog.create_title")}
      subtitle={t("goals.dialog.description")}
      footer={
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {!!goal && (
            <ActionChip onPress={handleDelete} tone="danger">
              {t("common.delete")}
            </ActionChip>
          )}
          {!!goal && !goal.archivedAt && onArchive && (
            <ActionChip onPress={() => { void onArchive(goal.id); onOpenChange(false); }}>Завершить</ActionChip>
          )}
          {!!goal && !!goal.archivedAt && onUnarchive && (
            <ActionChip onPress={() => { void onUnarchive(goal.id); onOpenChange(false); }}>Вернуть</ActionChip>
          )}
          <ActionChip onPress={() => onOpenChange(false)}>{t("common.cancel")}</ActionChip>
          <ActionChip onPress={() => void handleSave()} tone="primary" disabled={isSubmitting || !title.trim() || !isTaskXpTargetValid}>
            {isSubmitting ? t("common.saving") : goal ? t("common.save") : t("common.create")}
          </ActionChip>
        </View>
      }
    >
      <FieldInput label={t("common.title")} value={title} onChangeText={setTitle} placeholder={t("goals.dialog.title_placeholder")} autoCapitalize="sentences" />
      <FieldInput
        label={t("common.description")}
        value={description}
        onChangeText={setDescription}
        placeholder={t("goals.dialog.description_placeholder")}
        autoCapitalize="sentences"
        multiline
        numberOfLines={4}
      />
      <GoalTypeSection goalType={goalType} onChange={setGoalType} />
      {goalType === "TASK" && <WorkoutToggleSection value={isWorkout} onChange={setIsWorkout} />}
      <GoalPeriodSection goalPeriod={goalPeriod} onChange={setGoalPeriod} />
      <DueDateSection dueDate={dueDate} onChange={setDueDate} />
      <CategorySection categories={categories} category={category} onChange={setCategory} onAddCategory={onAddCategory} />
      <RewardSection rewards={rewards} activeRewardId={activeRewardId} onChange={setSelectedRewardId} />
      {goalType === "PROGRESS" ? (
        <ProgressFieldsSection currentValue={currentValue} targetValue={targetValue} onChangeCurrentValue={setCurrentValue} onChangeTargetValue={setTargetValue} />
      ) : (
        <>
          <TasksSection
            tasks={tasks}
            newTaskTitle={newTaskTitle}
            newTaskXp={newTaskXp}
            onChangeNewTaskTitle={setNewTaskTitle}
            onChangeNewTaskXp={setNewTaskXp}
            onAddTask={addTask}
            onRemoveTask={removeTask}
            expandedTasks={expandedTasks}
            onToggleExpand={toggleExpand}
            newSubTaskTitles={newSubTaskTitles}
            newSubTaskXps={newSubTaskXps}
            onChangeNewSubTaskTitle={(taskId, value) => setNewSubTaskTitles((current) => ({ ...current, [taskId]: value }))}
            onChangeNewSubTaskXp={(taskId, value) => setNewSubTaskXps((current) => ({ ...current, [taskId]: value }))}
            onAddSubTask={addSubTask}
          />
          <TaskXpTargetSection taskXpTarget={taskXpTarget} totalTaskXp={totalTaskXp} onChangeTaskXpTarget={setTaskXpTarget} />
        </>
      )}
    </FormSheetLayout>
  );
}
