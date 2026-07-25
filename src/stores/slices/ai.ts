import * as api from "@/shared/api/client";
import type { AppStoreActions, StoreSlice } from "@/stores/types";
import type { Reminder } from "@/types";

type AiSlice = Pick<AppStoreActions, "chatAI" | "chatAIStream" | "getChatHistory" | "addDraft">;

export const createAiSlice: StoreSlice<AiSlice> = (set, get) => ({
  chatAI: async (message) => {
    set({ loading: true });
    try {
      const response = await api.chatAI(message);
      await get().completeOnboardingStep("used_ai");
      return response;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  chatAIStream: async (message, handlers, category) => {
    set({ loading: true });
    try {
      const response = await api.chatAIStream(message, handlers, category);
      await get().completeOnboardingStep("used_ai");
      return response;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  getChatHistory: async (category) => {
    set({ loading: true });
    try {
      return await api.getChatHistory(category);
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      set({ loading: false });
    }
  },

  addDraft: async (messageId) => {
    set({ loading: true });
    try {
      const draft = await api.addDraft(messageId);
      const { goal, reward, reminders } = draft;

      set((state) => ({
        goals: state.goals.some((item) => item.id === goal.id)
          ? state.goals.map((item) => (item.id === goal.id ? goal : item))
          : [...state.goals, goal],
      }));

      await get().completeOnboardingStep("created_first_goal");
      if (goal.goalType === "PROGRESS") {
        await get().completeOnboardingStep("created_first_numeric_goal");
      }
      if (goal.goalType === "TASK" && goal.taskXpTarget != null) {
        await get().completeOnboardingStep("set_completion_threshold");
      }

      if (reward) {
        set((state) => ({
          rewards: state.rewards.some((item) => item.id === reward.id)
            ? state.rewards.map((item) => (item.id === reward.id ? reward : item))
            : [...state.rewards, reward],
        }));
      }

      if (reminders?.length) {
        set((state) => ({
          reminders: [
            ...state.reminders.filter(
              (item) =>
                !reminders.find((draftReminder: Reminder) => draftReminder.id === item.id)
            ),
            ...reminders,
          ],
        }));
      }

      return goal;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      set({ loading: false });
    }
  },
});
