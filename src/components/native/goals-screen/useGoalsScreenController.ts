import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useNativeNavigation } from "@/app/native/NativeNavigation";
import { buildProgressPath, buildRemindersPath } from "@/app/routes";
import { useAppStore } from "@/stores/useAppStore";
import { useGoalsScreen } from "@/shared/screens/goals/useGoalsScreen";
import { showDraftAddedAlert, showGoalTaskToggleResultAlert } from "./alerts";

export function useGoalsScreenController(props: {
  goalId?: string | null;
  reportTaskId?: string | null;
  onConsumeLinkState?: () => void;
}) {
  const { t } = useTranslation();
  const { user } = useAppStore();
  const { navigateToPath } = useNativeNavigation();
  const { reportTaskId, onConsumeLinkState } = props;
  const screen = useGoalsScreen({
    onNavigateToProgress: (goalId) => {
      navigateToPath(buildProgressPath({ goalId }));
    },
  });
  const { openReportForTask } = screen;
  const consumedReportTaskIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!reportTaskId) {
      consumedReportTaskIdRef.current = null;
      return;
    }

    if (consumedReportTaskIdRef.current === reportTaskId) {
      return;
    }

    const opened = openReportForTask(reportTaskId);
    if (!opened) {
      return;
    }

    consumedReportTaskIdRef.current = reportTaskId;
    onConsumeLinkState?.();
  }, [onConsumeLinkState, openReportForTask, reportTaskId]);

  const handleTaskToggle = async (goalId: string, taskId: string) => {
    const result = await screen.toggleGoalTask(goalId, taskId);
    showGoalTaskToggleResultAlert(result, t);
  };

  const handleDraftAdded = (goalTitle: string) => {
    showDraftAddedAlert(goalTitle, t);
  };

  const openReminderForGoal = (goalId: string) => {
    navigateToPath(buildRemindersPath({ goalId }));
  };

  return {
    ...screen,
    userTimeZone: user?.timeZone ?? "UTC",
    openReminderForGoal,
    openAi: screen.openAi,
    handleTaskToggle,
    handleDraftAdded,
  };
}
