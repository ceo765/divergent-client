import * as api from "@/shared/api/client";
import type { AppStoreActions, StoreSlice } from "@/stores/types";

type RewardsSlice = Pick<
  AppStoreActions,
  | "addReward"
  | "deleteReward"
  | "updateReward"
  | "updateRewardGoal"
  | "claimReward"
>;

export const createRewardsSlice: StoreSlice<RewardsSlice> = (set, get) => ({
  addReward: async (reward) => {
    set({ loading: true });
    try {
      const newReward = await api.createReward(reward);
      set({ rewards: [...get().rewards, newReward] });
      await get().loadMissions();
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  deleteReward: async (reward) => {
    set({ loading: true });
    try {
      await api.deleteReward(reward.id);
      set({
        rewards: get().rewards.filter((item) => item.id !== reward.id),
      });
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  updateReward: async (reward) => {
    set({ loading: true });
    try {
      const updatedReward = await api.updateReward(reward);
      set({
        rewards: get().rewards.map((item) =>
          item.id === updatedReward.id ? updatedReward : item
        ),
      });
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  updateRewardGoal: async (goalId, rewardId) =>
    set((state) => ({
      rewards: state.rewards.map((reward) => {
        if (reward.id === rewardId) {
          return { ...reward, goalId: goalId === "none" ? undefined : goalId };
        }

        if (reward.goalId === goalId) {
          return { ...reward, goalId: undefined };
        }

        return reward;
      }),
    })),

  claimReward: async (id) => {
    set({ loading: true });
    try {
      const updatedReward = await api.claimReward(id);
      set({
        rewards: get().rewards.map((item) =>
          item.id === updatedReward.id ? updatedReward : item
        ),
      });
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },
});
