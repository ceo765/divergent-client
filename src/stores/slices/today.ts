import * as api from "@/shared/api/client";
import type { AppStoreActions, StoreSlice } from "@/stores/types";
import type { TodayState } from "@/types";

type TodaySlice = Pick<AppStoreActions, "loadTodayState" | "setTodayCheck" | "setPerfectDay">;

function apply(set: (partial: Partial<Record<string, unknown>>) => void, state: TodayState) {
  set({
    todayChecks: state.checks,
    todayStreak: state.perfectStreak,
    todayLongest: state.perfectLongest,
  });
}

export const createTodaySlice: StoreSlice<TodaySlice> = (set) => ({
  loadTodayState: async (date) => {
    try {
      apply(set, await api.fetchTodayState(date));
    } catch (err) {
      console.error(err);
    }
  },

  setTodayCheck: async (goalId, on, date) => {
    try {
      apply(set, await api.postTodayCheck(goalId, on, date));
    } catch (err) {
      console.error(err);
    }
  },

  setPerfectDay: async (date, on) => {
    try {
      apply(set, await api.postPerfectDay(date, on));
    } catch (err) {
      console.error(err);
    }
  },
});
