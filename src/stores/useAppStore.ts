import { create } from "zustand";

import { createAiSlice } from "@/stores/slices/ai";
import { createAuthSlice } from "@/stores/slices/auth";
import { createBaseSlice } from "@/stores/slices/base";
import { createChallengesSlice } from "@/stores/slices/challenges";
import { createFriendsSlice } from "@/stores/slices/friends";
import { createGoalsSlice } from "@/stores/slices/goals";
import { createOnboardingSlice } from "@/stores/slices/onboarding";
import { createRemindersSlice } from "@/stores/slices/reminders";
import { createRewardsSlice } from "@/stores/slices/rewards";
import { createMissionsSlice } from "@/stores/slices/missions";
import { createNotesSlice } from "@/stores/slices/notes";
import type { AppStore } from "@/stores/types";

export const useAppStore = create<AppStore>((set, get) => ({
  ...createBaseSlice(set, get, undefined as never),
  ...createAuthSlice(set, get, undefined as never),
  ...createChallengesSlice(set, get, undefined as never),
  ...createFriendsSlice(set, get, undefined as never),
  ...createGoalsSlice(set, get, undefined as never),
  ...createOnboardingSlice(set, get, undefined as never),
  ...createRewardsSlice(set, get, undefined as never),
  ...createRemindersSlice(set, get, undefined as never),
  ...createAiSlice(set, get, undefined as never),
  ...createMissionsSlice(set, get, undefined as never),
  ...createNotesSlice(set, get, undefined as never),
}));
