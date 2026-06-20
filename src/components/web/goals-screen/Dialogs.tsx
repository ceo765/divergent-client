import { Suspense, lazy } from "react";

import type { CategoryOption, Goal, GoalFormData, Reminder, ReportUploadPayload, Reward } from "@/types";

const AiGenerateGoalDialog = lazy(() => import("@/components/web/goals/AiDialog"));
const CreateReportDialog = lazy(() => import("@/components/web/goals/CreateReportDialog"));
const GoalDialog = lazy(() =>
  import("@/components/web/goals/GoalDialog").then((m) => ({ default: m.GoalDialog })),
);
const ReminderDialog = lazy(() =>
  import("@/components/web/reminders/ReminderDialog").then((m) => ({ default: m.ReminderDialog })),
);

function DialogFallback() {
  return null;
}

export function GoalsScreenDialogs({
  goalDialogOpen,
  editingGoal,
  categories,
  rewards,
  reminderDialogOpen,
  selectedGoalIdForReminder,
  goals,
  createReportDialogOpen,
  aiOpen,
  aiInitialPrompt,
  onGoalDialogOpenChange,
  onReminderDialogOpenChange,
  onCreateReportDialogOpenChange,
  onAiOpenChange,
  onSaveGoal,
  onDeleteGoal,
  onAddCategory,
  onSaveReminder,
  onSaveReport,
  onDraftAdded,
}: {
  goalDialogOpen: boolean;
  editingGoal?: Goal | null;
  categories: CategoryOption[];
  rewards: Reward[];
  reminderDialogOpen: boolean;
  selectedGoalIdForReminder?: string | null;
  goals: Goal[];
  createReportDialogOpen: boolean;
  aiOpen: boolean;
  aiInitialPrompt?: string;
  onGoalDialogOpenChange: (open: boolean) => void;
  onReminderDialogOpenChange: (open: boolean) => void;
  onCreateReportDialogOpenChange: (open: boolean) => void;
  onAiOpenChange: (open: boolean) => void;
  onSaveGoal: (data: GoalFormData) => void | Promise<void>;
  onDeleteGoal: (id: string) => void | Promise<void>;
  onAddCategory: (category: CategoryOption) => void;
  onSaveReminder: (reminder: Reminder) => void | Promise<void>;
  onSaveReport: (data: ReportUploadPayload) => Promise<void>;
  onDraftAdded: (goal: Goal) => void;
}) {
  return (
    <Suspense fallback={<DialogFallback />}>
      {goalDialogOpen && (
        <GoalDialog
          open={goalDialogOpen}
          onOpenChange={onGoalDialogOpenChange}
          onSave={onSaveGoal}
          onDelete={onDeleteGoal}
          goal={editingGoal ?? undefined}
          categories={categories}
          rewards={rewards}
          onAddCategory={onAddCategory}
        />
      )}
      {reminderDialogOpen && (
        <ReminderDialog
          open={reminderDialogOpen}
          onOpenChange={onReminderDialogOpenChange}
          onSave={onSaveReminder}
          reminder={undefined}
          goals={goals}
          initialGoalId={selectedGoalIdForReminder ?? undefined}
        />
      )}
      {createReportDialogOpen && (
        <CreateReportDialog
          open={createReportDialogOpen}
          onOpenChange={onCreateReportDialogOpenChange}
          onSubmit={onSaveReport}
        />
      )}
      {aiOpen && (
        <AiGenerateGoalDialog
          open={aiOpen}
          onOpenChange={onAiOpenChange}
          onDraftAdded={onDraftAdded}
          initialPrompt={aiInitialPrompt}
        />
      )}
    </Suspense>
  );
}
