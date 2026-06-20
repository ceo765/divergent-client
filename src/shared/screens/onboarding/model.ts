import type { Goal, Reminder, OnboardingState, OnboardingStepKey } from "@/types";

export const ONBOARDING_STEPS = [
  {
    key: "created_first_goal",
    titleKey: "onboarding.steps.first_goal_title",
    descriptionKey: "onboarding.steps.first_goal_description",
    promptKey: "onboarding.steps.first_goal_prompt",
  },
  {
    key: "created_first_numeric_goal",
    titleKey: "onboarding.steps.numeric_goal_title",
    descriptionKey: "onboarding.steps.numeric_goal_description",
    promptKey: "onboarding.steps.numeric_goal_prompt",
  },
  {
    key: "set_completion_threshold",
    titleKey: "onboarding.steps.threshold_title",
    descriptionKey: "onboarding.steps.threshold_description",
    promptKey: "onboarding.steps.threshold_prompt",
  },
  {
    key: "started_first_streak",
    titleKey: "onboarding.steps.streak_title",
    descriptionKey: "onboarding.steps.streak_description",
    promptKey: "onboarding.steps.streak_prompt",
  },
  {
    key: "created_first_reminder",
    titleKey: "onboarding.steps.reminder_title",
    descriptionKey: "onboarding.steps.reminder_description",
    promptKey: "onboarding.steps.reminder_prompt",
  },
] as const;

export type OnboardingStepState = {
  key: OnboardingStepKey;
  completed: boolean;
};

export type OnboardingChecklistState = {
  steps: OnboardingStepState[];
  completedCount: number;
  totalCount: number;
  nextStep: OnboardingStepKey | null;
  isComplete: boolean;
};

function hasNumericGoal(goals: Goal[]) {
  return goals.some((goal) => goal.goalType === "PROGRESS");
}

function hasThresholdGoal(goals: Goal[]) {
  return goals.some((goal) => goal.goalType === "TASK" && goal.taskXpTarget != null);
}

function getDerivedStepState(goals: Goal[], reminders: Reminder[], hasGoalStreak: boolean): OnboardingState {
  const steps: OnboardingState = {};
  const now = new Date().toISOString();

  if (goals.length > 0) {
    steps.created_first_goal = now;
  }

  if (hasNumericGoal(goals)) {
    steps.created_first_numeric_goal = now;
  }

  if (hasThresholdGoal(goals)) {
    steps.set_completion_threshold = now;
  }

  if (hasGoalStreak) {
    steps.started_first_streak = now;
  }

  if (reminders.length > 0) {
    steps.created_first_reminder = now;
  }

  return steps;
}

export function buildOnboardingChecklist(
  goals: Goal[],
  reminders: Reminder[] = [],
  persistedState?: OnboardingState | null,
  hasGoalStreak = false,
): OnboardingChecklistState {
  const derivedState = getDerivedStepState(goals, reminders, hasGoalStreak);
  const steps: OnboardingStepState[] = ONBOARDING_STEPS.map((step) => ({
    key: step.key,
    completed: Boolean(persistedState?.[step.key] ?? derivedState[step.key]),
  }));

  const completedCount = steps.filter((step) => step.completed).length;
  const nextStep = steps.find((step) => !step.completed)?.key ?? null;

  return {
    steps,
    completedCount,
    totalCount: steps.length,
    nextStep,
    isComplete: completedCount === steps.length,
  };
}
