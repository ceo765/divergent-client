import * as api from "@/shared/api/client";
import type { AppStoreActions, AppStoreState, StoreSlice } from "@/stores/types";

type MissionsSlice = Pick<AppStoreState, "missionState" | "missionsLoading"> & Pick<AppStoreActions, "loadMissions" | "markMissionIntroSeen" | "claimMissionReward" | "recordProgressViewed">;

export const createMissionsSlice: StoreSlice<MissionsSlice> = (set, get) => ({
  missionState: null,
  missionsLoading: false,
  loadMissions: async () => {
    if (!get().user) return;
    set({ missionsLoading: true });
    try { set({ missionState: await api.getMissions() }); }
    catch (error) { console.error(error); }
    finally { set({ missionsLoading: false }); }
  },
  markMissionIntroSeen: async () => {
    set({ missionState: await api.markMissionIntroSeen() });
  },
  claimMissionReward: async (key) => {
    const result = await api.claimMissionReward(key);
    set((state) => ({ missionState: result, user: state.user ? { ...state.user, ...result.user } : state.user }));
  },
  recordProgressViewed: async () => {
    try { set({ missionState: await api.recordProgressViewed() }); }
    catch (error) { console.info("Progress mission is not ready yet", error); }
  },
});
