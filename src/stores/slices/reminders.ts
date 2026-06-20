import * as api from "@/shared/api/client";
import type { AppStoreActions, StoreSlice } from "@/stores/types";

type RemindersSlice = Pick<
  AppStoreActions,
  "addReminder" | "deleteReminder" | "updateReminder" | "toggleReminder"
>;

export const createRemindersSlice: StoreSlice<RemindersSlice> = (set, get) => ({
  addReminder: async (reminder) => {
    set({ loading: true });
    try {
      const newReminder = await api.createReminder(reminder);
      set({ reminders: [...get().reminders, newReminder] });
      await get().completeOnboardingStep("created_first_reminder");
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  deleteReminder: async (reminder) => {
    set({ loading: true });
    try {
      await api.deleteReminder(reminder.id);
      set({
        reminders: get().reminders.filter((item) => item.id !== reminder.id),
      });
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  updateReminder: async (reminder) => {
    set({ loading: true });
    try {
      const updatedReminder = await api.updateReminder(reminder);
      set({
        reminders: get().reminders.map((item) =>
          item.id === updatedReminder.id ? updatedReminder : item
        ),
      });
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  toggleReminder: async (id) => {
    set({ loading: true });
    try {
      const updatedReminder = await api.toggleReminder(id);
      set({
        reminders: get().reminders.map((item) =>
          item.id === updatedReminder.id ? updatedReminder : item
        ),
      });
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },
});
