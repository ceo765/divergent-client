export type GoalsRouteParams = {
  id?: string | null;
  reportTaskId?: string | null;
  onboarding?: boolean | null;
};

export type RemindersRouteParams = {
  id?: string | null;
  goalId?: string | null;
};

export type ChallengesRouteParams = {
  id?: string | null;
  paymentId?: string | null;
};

export type RewardsRouteParams = {
  id?: string | null;
};

export type ProgressRouteParams = {
  goalId?: string | null;
};

function buildPath(path: string, params?: Record<string, string | null | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function buildGoalsPath(params: GoalsRouteParams = {}) {
  return buildPath("/goals", {
    id: params.id,
    reportTaskId: params.reportTaskId,
    onboarding: params.onboarding ? "1" : null,
  });
}

export function buildRemindersPath(params: RemindersRouteParams = {}) {
  return buildPath("/reminders", {
    id: params.id,
    goalId: params.goalId,
  });
}

export function buildChallengesPath(params: ChallengesRouteParams = {}) {
  return buildPath("/challenges", {
    id: params.id,
    paymentId: params.paymentId,
  });
}

export function buildRewardsPath(params: RewardsRouteParams = {}) {
  return buildPath("/rewards", { id: params.id });
}

export function buildProgressPath(params: ProgressRouteParams = {}) {
  return buildPath("/progress", { goalId: params.goalId });
}

export function buildSettingsPath() {
  return "/settings";
}
