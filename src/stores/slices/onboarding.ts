import * as api from "@/shared/api/client";
import type { AppStoreActions, StoreSlice } from "@/stores/types";
import type { OnboardingStepKey } from "@/types";

type OnboardingSlice = Pick<AppStoreActions, "completeOnboardingStep">;

export const createOnboardingSlice: StoreSlice<OnboardingSlice> = (set, get) => ({
  completeOnboardingStep: async (step: OnboardingStepKey) => {
    try {
      const user = await api.completeOnboardingStep(step);
      set({ user });
      await get().loadMissions();

      if (
        user.onboardingState?.created_first_goal &&
        user.onboardingState?.used_ai &&
        user.onboardingState?.completed_first_task
      ) {
        const rewards = await api.fetchRewards();
        set({ rewards });
      }
    } catch (err) {
      console.error(err);
    }
  },
});
