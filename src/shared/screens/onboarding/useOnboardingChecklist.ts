import { useEffect, useMemo, useState } from "react";

import { getActivity } from "@/shared/api/client";
import { useAppStore } from "@/stores/useAppStore";
import type { Goal, Reminder } from "@/types";

import { buildOnboardingChecklist, type OnboardingChecklistState } from "./model";

export type UseOnboardingChecklistResult = OnboardingChecklistState & {
  historyLoading: boolean;
  ready: boolean;
};

export function useOnboardingChecklist(goals: Goal[], reminders: Reminder[]): UseOnboardingChecklistResult {
  const { user } = useAppStore();
  const [hasGoalStreak, setHasGoalStreak] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const persistedState = user?.onboardingState ?? null;
  const needsStreakFallback = !persistedState?.started_first_streak;
  const [historyChecked, setHistoryChecked] = useState(() => !needsStreakFallback);

  useEffect(() => {
    if (!needsStreakFallback) {
      setHasGoalStreak(false);
      setHistoryLoading(false);
      setHistoryChecked(true);
      return;
    }

    setHistoryChecked(false);
    let cancelled = false;

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const streakCandidates = goals.filter((goal) => goal.goalType === "TASK" && goal.goalPeriod !== "NONE");
        if (streakCandidates.length === 0) {
          if (!cancelled) {
            setHasGoalStreak(false);
            setHistoryChecked(true);
          }
          return;
        }

        const history = await Promise.all(
          streakCandidates.map(async (goal) => {
            try {
              const activity = await getActivity(goal.id);
              return activity.longestStreak >= 3;
            } catch (error) {
              console.error(error);
              return false;
            }
          }),
        );

        if (!cancelled) {
          setHasGoalStreak(history.some(Boolean));
          setHistoryChecked(true);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setHasGoalStreak(false);
          setHistoryChecked(true);
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [goals, needsStreakFallback]);

  return useMemo(
    () => ({
      ...buildOnboardingChecklist(goals, reminders, persistedState, hasGoalStreak),
      historyLoading,
      ready: historyChecked,
    }),
    [goals, reminders, persistedState, hasGoalStreak, historyLoading, historyChecked],
  );
}
