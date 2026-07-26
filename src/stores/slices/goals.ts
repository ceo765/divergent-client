import * as api from "@/shared/api/client";
import type { AppStoreActions, StoreSlice } from "@/stores/types";
import type { Goal } from "@/types";

type GoalsSlice = Pick<
  AppStoreActions,
  | "addCategory"
  | "addGoal"
  | "deleteGoal"
  | "loadArchivedGoals"
  | "archiveGoal"
  | "unarchiveGoal"
  | "updateGoal"
  | "updateGoalProgress"
  | "getActivity"
  | "getGoalXp"
  | "getProgressOverview"
  | "getProgressDay"
  | "toggleTask"
  | "addReport"
  | "showNativeToast"
  | "hideNativeToast"
>;

type TaskCompletionLike = {
  lastCompletedAt?: string | null;
  subtasks?: TaskCompletionLike[] | undefined;
};

function hasAnyCompletedTask(tasks: TaskCompletionLike[]): boolean {
  return tasks.some((task) => {
    if (task.lastCompletedAt) {
      return true;
    }

    return hasAnyCompletedTask(task.subtasks ?? []);
  });
}

async function completeGoalOnboardingSteps(get: () => { completeOnboardingStep: AppStoreActions["completeOnboardingStep"] }, goal: Goal) {
  if (goal.goalType === "PROGRESS") {
    await get().completeOnboardingStep("created_first_numeric_goal");
  }

  if (goal.goalType === "TASK" && goal.taskXpTarget != null) {
    await get().completeOnboardingStep("set_completion_threshold");
  }
}

export const createGoalsSlice: StoreSlice<GoalsSlice> = (set, get) => ({
  showNativeToast: ({ title, message, tone = "info", durationMs = 3000 }) => {
    const id = Date.now();
    set({
      nativeToast: {
        id,
        title,
        message,
        tone,
      },
    });

    setTimeout(() => {
      if (get().nativeToast?.id === id) {
        set({ nativeToast: null });
      }
    }, durationMs);
  },

  hideNativeToast: () => {
    set({ nativeToast: null });
  },

  addCategory: (category) => {
    set({ categories: [...get().categories, category] });
  },

  addGoal: async (goal) => {
    set({ loading: true });
    try {
      const newGoal = await api.createGoal(goal);
      set({ goals: [...get().goals, newGoal] });
      await get().completeOnboardingStep("created_first_goal");
      await completeGoalOnboardingSteps(get, newGoal);
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  deleteGoal: async (goal) => {
    set({ loading: true });
    try {
      await api.deleteGoal(goal.id);
      set({
        goals: get().goals.filter((item) => item.id !== goal.id),
      });
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  loadArchivedGoals: async () => {
    try {
      const archived = await api.fetchArchivedGoals();
      set({ archivedGoals: archived });
    } catch (err) {
      console.error(err);
    }
  },

  archiveGoal: async (id) => {
    set({ loading: true });
    try {
      await api.archiveGoal(id);
      set({ goals: get().goals.filter((item) => item.id !== id) });
      await get().loadArchivedGoals();
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  unarchiveGoal: async (id) => {
    set({ loading: true });
    try {
      await api.unarchiveGoal(id);
      set({ archivedGoals: get().archivedGoals.filter((item) => item.id !== id) });
      await get().refreshAppData();
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  updateGoal: async (goal) => {
    set({ loading: true });
    try {
      const updatedGoal = await api.updateGoal(goal);
      set({
        goals: get().goals.map((item) =>
          item.id === updatedGoal.id ? updatedGoal : item
        ),
      });
      await completeGoalOnboardingSteps(get, updatedGoal);
      await get().loadMissions();
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  updateGoalProgress: async (goalId, delta) => {
    set({ loading: true });
    try {
      const { goal, user } = await api.updateGoalProgress(goalId, delta);

      set({
        goals: get().goals.map((item) => (item.id === goalId ? goal : item)),
        user: {
          ...get().user!,
          xp: user.xp,
          level: user.level,
          xpInCurrentLevel: user.xpInCurrentLevel,
          requiredXp: user.requiredXp,
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  getActivity: async (goalId) => {
    set({ loading: true });
    try {
      return await api.getActivity(goalId);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  getGoalXp: async (goalId) => {
    set({ loading: true });
    try {
      return await api.getGoalXp(goalId);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  getProgressOverview: async () => {
    try {
      return await api.getProgressOverview();
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  getProgressDay: async (date) => {
    try {
      return await api.getProgressDay(date);
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  toggleTask: async (taskId, setLog) => {
    set({ loading: true });
    try {
      const { goal, user } = await api.toggleTask(taskId, setLog);

      set({
        goals: get().goals.map((item) => (item.id === goal.id ? goal : item)),
        user: {
          ...get().user!,
          xp: user.xp,
          level: user.level,
          xpInCurrentLevel: user.xpInCurrentLevel,
          requiredXp: user.requiredXp,
        },
      });

      if (hasAnyCompletedTask(goal.tasks)) {
        await get().completeOnboardingStep("completed_first_task");
      }

      if (goal.goalType === "TASK" && goal.goalPeriod !== "NONE") {
        try {
          const activity = await api.getActivity(goal.id);
          if (activity.longestStreak >= 3) {
            await get().completeOnboardingStep("started_first_streak");
          }
        } catch (error) {
          console.error(error);
        }
      }

      if (goal.challenge) {
        const challenges = await api.fetchChallenges();
        set({ challenges });
      }

      if (goal.reward) {
        const rewards = await api.fetchRewards();
        set({ rewards });
      }
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  addReport: async (taskId, data) => {
    set({ loading: true });
    try {
      const { goal, user } = await api.addReport(taskId, data);

      set({
        goals: get().goals.map((item) => (item.id === goal.id ? goal : item)),
        user: {
          ...get().user!,
          xp: user.xp,
          level: user.level,
          xpInCurrentLevel: user.xpInCurrentLevel,
          requiredXp: user.requiredXp,
        },
      });

      if (hasAnyCompletedTask(goal.tasks)) {
        await get().completeOnboardingStep("completed_first_task");
      }

      if (goal.goalType === "TASK" && goal.goalPeriod !== "NONE") {
        try {
          const activity = await api.getActivity(goal.id);
          if (activity.longestStreak >= 3) {
            await get().completeOnboardingStep("started_first_streak");
          }
        } catch (error) {
          console.error(error);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },
});
