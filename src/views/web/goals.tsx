import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { buildProgressPath, buildRemindersPath } from "@/app/routes";
import { GoalsScreenDialogs } from "@/components/web/goals-screen/Dialogs";
import {
  GoalsScreenContent,
  GoalsScreenHeader,
} from "@/components/web/goals-screen/Sections";
import { useOnboardingChecklist } from "@/shared/screens/onboarding/useOnboardingChecklist";
import { useGoalsScreen } from "@/shared/screens/goals/useGoalsScreen";

export default function GoalsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get("id");
  const focusOnboarding = searchParams.get("onboarding") === "1";
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const {
    loading,
    goals,
    reminders,
    rewards,
    categories,
    goalDialogOpen,
    editingGoal,
    createReportDialogOpen,
    reminderDialogOpen,
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
    saveReminder,
    saveReport,
    toggleGoalTask,
  } = useGoalsScreen({
    onNavigateToProgress: (goalId) => navigate(buildProgressPath({ goalId })),
    onReminderCreated: () => navigate(buildRemindersPath()),
  });
  const onboarding = useOnboardingChecklist(goals, reminders);
  const filteredGoals = useMemo(() => {
    if (selectedCategory === "all") {
      return goals;
    }

    return goals.filter((goal) => goal.category === selectedCategory);
  }, [goals, selectedCategory]);

  const categoriesWithGoals = useMemo(
    () => categories.filter((category) => goals.some((goal) => goal.category === category.value)),
    [categories, goals],
  );

  useEffect(() => {
    if (selectedCategory !== "all" && !categoriesWithGoals.some((category) => category.value === selectedCategory)) {
      setSelectedCategory("all");
    }
  }, [categoriesWithGoals, selectedCategory]);

  const selectedCategoryLabel =
    selectedCategory === "all"
      ? t("goals.all_categories")
      : categories.find((category) => category.value === selectedCategory)?.label ?? selectedCategory;

  const handleSaveGoal = async (...args: Parameters<typeof saveGoal>) => {
    const result = await saveGoal(...args);
    toast.success(result.status === "updated" ? t("goals.updated") : t("goals.created"));
  };

  const handleSaveReminder = async (...args: Parameters<typeof saveReminder>) => {
    const result = await saveReminder(...args);
    toast.success(result.status === "updated" ? t("reminders.updated") : t("reminders.created"));
  };

  const handleSaveReport = async (...args: Parameters<typeof saveReport>) => {
    const saved = await saveReport(...args);
    if (saved) toast.success(t("goals.report_saved"));
  };

  const handleTaskToggle = async (goalId: string, taskId: string) => {
    const result = await toggleGoalTask(goalId, taskId);
    if (result.status === "completed") {
      toast.success(t("goals.completed_alert", { xp: result.xpReward }));
    }
  };

  const handleAddCategory = (...args: Parameters<typeof createCategory>) => {
    const category = createCategory(...args);
    toast.success(t("goals.category_created", { title: category.label }));
  };

  const handleDeleteGoal = async (id: string) => {
    await removeGoal(id);
  };

  const onDraftAdded = () => {
    // no-op on web for now
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col px-2">
      <GoalsScreenHeader
        categories={categoriesWithGoals}
        showCategories={goals.length > 0}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onCreate={openCreateGoal}
        onOpenAi={() => openAi()}
      />

      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        <GoalsScreenContent
          loading={loading}
          goals={filteredGoals}
          rewards={rewards}
          focusId={focusId}
          focusOnboarding={focusOnboarding}
          hasGoals={goals.length > 0}
          onboarding={onboarding}
          selectedCategoryLabel={selectedCategoryLabel}
          onCreate={openCreateGoal}
          onEdit={openEditGoal}
          onTaskToggle={handleTaskToggle}
        onAddReminder={openReminderForGoal}
        onAddProgress={addProgress}
        onGoToProgress={navigateToProgress}
        onUsePrompt={openAi}
      />
      </div>

      <GoalsScreenDialogs
        goalDialogOpen={goalDialogOpen}
        editingGoal={editingGoal}
        categories={categories}
        rewards={rewards}
        reminderDialogOpen={reminderDialogOpen}
        selectedGoalIdForReminder={selectedGoalIdForReminder}
        goals={goals}
        createReportDialogOpen={createReportDialogOpen}
        aiOpen={aiOpen}
        onGoalDialogOpenChange={setGoalDialogOpen}
        onReminderDialogOpenChange={setReminderDialogOpen}
        onCreateReportDialogOpenChange={setCreateReportDialogOpen}
        onAiOpenChange={setAiOpen}
        aiInitialPrompt={aiInitialPrompt}
        onSaveGoal={handleSaveGoal}
        onDeleteGoal={handleDeleteGoal}
        onAddCategory={handleAddCategory}
        onSaveReminder={handleSaveReminder}
        onSaveReport={handleSaveReport}
        onDraftAdded={onDraftAdded}
      />
    </div>
  );
}
