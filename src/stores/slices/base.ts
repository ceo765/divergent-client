import type { AppStoreState, StoreSlice } from "@/stores/types";

export const createBaseSlice: StoreSlice<AppStoreState> = () => ({
  initialized: false,
  loading: false,
  user: null,
  token: null,
  goals: [],
  archivedGoals: [],
  notes: [],
  collections: [],
  challenges: [],
  rewards: [],
  reminders: [],
  friends: [],
  categories: [],
  reports: {},
  nativeToast: null,
  missionState: null,
  missionsLoading: false,
});
