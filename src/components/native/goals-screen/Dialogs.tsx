import { Suspense, lazy } from "react";

import type { CategoryOption, Goal, GoalFormData, ReportUploadPayload, Reward } from "@/types";

const AiChatSheet = lazy(() =>
  import("@/components/native/AiChatSheet").then((m) => ({ default: m.AiChatSheet })),
);
const CreateReportSheet = lazy(() =>
  import("@/components/native/CreateReportSheet").then((m) => ({ default: m.CreateReportSheet })),
);
const GoalFormSheet = lazy(() =>
  import("@/components/native/GoalFormSheet").then((m) => ({ default: m.GoalFormSheet })),
);

function SheetFallback() {
  return null;
}

export function GoalsScreenDialogs({
  createReportDialogOpen,
  goalDialogOpen,
  aiOpen,
  aiInitialPrompt,
  editingGoal,
  categories,
  rewards,
  onAddCategory,
  onCreateReportDialogOpenChange,
  onGoalDialogOpenChange,
  onAiOpenChange,
  onSaveReport,
  onSaveGoal,
  onDeleteGoal,
  onArchiveGoal,
  onUnarchiveGoal,
  onDraftAdded,
}: {
  createReportDialogOpen: boolean;
  goalDialogOpen: boolean;
  aiOpen: boolean;
  aiInitialPrompt?: string;
  editingGoal?: Goal | null;
  categories: CategoryOption[];
  rewards: Reward[];
  onAddCategory: (category: CategoryOption) => void;
  onCreateReportDialogOpenChange: (open: boolean) => void;
  onGoalDialogOpenChange: (open: boolean) => void;
  onAiOpenChange: (open: boolean) => void;
  onSaveReport: (data: ReportUploadPayload) => Promise<boolean>;
  onSaveGoal: (data: GoalFormData) => Promise<unknown>;
  onDeleteGoal: (id: string) => Promise<boolean>;
  onArchiveGoal?: (id: string) => Promise<void>;
  onUnarchiveGoal?: (id: string) => Promise<void>;
  onDraftAdded: (goal: Goal) => void;
}) {
  return (
    <Suspense fallback={<SheetFallback />}>
      {createReportDialogOpen && (
        <CreateReportSheet
          open={createReportDialogOpen}
          onOpenChange={onCreateReportDialogOpenChange}
          onSubmit={onSaveReport}
        />
      )}
      {goalDialogOpen && (
        <GoalFormSheet
          open={goalDialogOpen}
          goal={editingGoal ?? undefined}
          categories={categories}
          rewards={rewards}
          onOpenChange={onGoalDialogOpenChange}
          onSave={onSaveGoal}
          onDelete={onDeleteGoal}
          onArchive={onArchiveGoal}
          onUnarchive={onUnarchiveGoal}
          onAddCategory={onAddCategory}
        />
      )}
      {aiOpen && (
        <AiChatSheet
          open={aiOpen}
          onOpenChange={onAiOpenChange}
          onDraftAdded={onDraftAdded}
          initialPrompt={aiInitialPrompt}
        />
      )}
    </Suspense>
  );
}
