import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { GoalsScreenDialogs } from "@/components/native/goals-screen/Dialogs";
import { GoalsScreenContent, GoalsScreenHeader } from "@/components/native/goals-screen/Sections";
import { useGoalsScreenController } from "@/components/native/goals-screen/useGoalsScreenController";
import { useOnboardingChecklist } from "@/shared/screens/onboarding/useOnboardingChecklist";
import { useAppStore } from "@/stores/useAppStore";
import { appPalette } from "@/theme/palette";

export default function NativeGoalsScreen(props: {
  goalId?: string | null;
  reportTaskId?: string | null;
  onboarding?: string | null;
  onConsumeLinkState?: () => void;
}) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [mode, setMode] = useState<"active" | "archived">("active");
  const { archivedGoals, loadArchivedGoals, archiveGoal, unarchiveGoal } = useAppStore();
  const {
    loading,
    goals,
    reminders,
    rewards,
    categories,
    goalDialogOpen,
    aiOpen,
    editingGoal,
    openCreateGoal,
    openEditGoal,
    openReminderForGoal,
    addProgress,
    navigateToProgress,
    saveGoal,
    removeGoal,
    createCategory,
    createReportDialogOpen,
    saveReport,
    setGoalDialogOpen,
    setCreateReportDialogOpen,
    setAiOpen,
    openAi,
    aiInitialPrompt,
    userTimeZone,
    handleTaskToggle,
    handleDraftAdded,
  } = useGoalsScreenController(props);
  const onboarding = useOnboardingChecklist(goals, reminders);
  const sourceGoals = mode === "active" ? goals : archivedGoals;

  useEffect(() => {
    if (mode === "archived") {
      void loadArchivedGoals();
    }
  }, [mode, loadArchivedGoals]);

  const categoriesWithGoals = useMemo(
    () => categories.filter((category) => sourceGoals.some((goal) => goal.category === category.value)),
    [categories, sourceGoals],
  );

  useEffect(() => {
    if (selectedCategory !== "all" && !categoriesWithGoals.some((category) => category.value === selectedCategory)) {
      setSelectedCategory("all");
    }
  }, [categoriesWithGoals, selectedCategory]);

  const filteredGoals = useMemo(() => {
    if (selectedCategory === "all") {
      return sourceGoals;
    }

    return sourceGoals.filter((goal) => goal.category === selectedCategory);
  }, [sourceGoals, selectedCategory]);

  const selectedCategoryLabel =
    selectedCategory === "all"
      ? t("goals.all_categories")
      : categoriesWithGoals.find((category) => category.value === selectedCategory)?.label ?? selectedCategory;

  const handleEdit = (id: string) => {
    if (mode === "archived") {
      Alert.alert("Вернуть из архива?", "Цель снова станет активной.", [
        { text: "Отмена", style: "cancel" },
        { text: "Вернуть", onPress: () => void unarchiveGoal(id) },
      ]);
      return;
    }
    openEditGoal(id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: appPalette.surface.background }}>
      <GoalsScreenHeader
        categories={categoriesWithGoals}
        showCategories={goals.length > 0}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onCreate={openCreateGoal}
        onOpenAi={() => openAi()}
      />

      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 8 }}>
        {(["active", "archived"] as const).map((m) => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: active ? appPalette.brand.primary : appPalette.semantic.borderSubtle,
                backgroundColor: active ? appPalette.brand.primary : appPalette.semantic.neutralSurfaceStrong,
              }}
            >
              <Text style={{ color: active ? appPalette.semantic.textInverse : appPalette.semantic.textStrong, fontSize: 12, lineHeight: 18, fontWeight: "500", fontFamily: "Montserrat" }}>
                {m === "active" ? "Активные" : "Завершённые"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <GoalsScreenContent
        loading={loading}
        goals={filteredGoals}
        rewards={rewards}
        categories={categoriesWithGoals}
        hasGoals={sourceGoals.length > 0}
        onboarding={onboarding}
        selectedCategoryLabel={selectedCategoryLabel}
        userTimeZone={userTimeZone}
        focusedGoalId={props.goalId}
        focusOnboarding={props.onboarding === "1"}
        onCreate={openCreateGoal}
        onEdit={handleEdit}
        onTaskToggle={handleTaskToggle}
        onAddReminder={openReminderForGoal}
        onAddProgress={addProgress}
        onGoToProgress={navigateToProgress}
        onUsePrompt={openAi}
      />

      <GoalsScreenDialogs
        createReportDialogOpen={createReportDialogOpen}
        goalDialogOpen={goalDialogOpen}
        aiOpen={aiOpen}
        editingGoal={editingGoal}
        categories={categories}
        rewards={rewards}
        onAddCategory={createCategory}
        onCreateReportDialogOpenChange={setCreateReportDialogOpen}
        onGoalDialogOpenChange={setGoalDialogOpen}
        onAiOpenChange={setAiOpen}
        aiInitialPrompt={aiInitialPrompt}
        onSaveReport={saveReport}
        onSaveGoal={saveGoal}
        onDeleteGoal={removeGoal}
        onArchiveGoal={archiveGoal}
        onUnarchiveGoal={unarchiveGoal}
        onDraftAdded={(goal) => handleDraftAdded(goal.title)}
      />
    </View>
  );
}
