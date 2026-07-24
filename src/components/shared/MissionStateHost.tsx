import { useEffect } from "react";

import { MissionRewardDialog } from "@/components/web/missions/MissionRewardDialog";
import { MissionIntroDialog } from "@/components/web/missions/MissionIntroDialog";
import { useAppStore } from "@/stores/useAppStore";

export function MissionStateHost() {
  const userId = useAppStore((state) => state.user?.id);
  const loadMissions = useAppStore((state) => state.loadMissions);

  useEffect(() => {
    if (!userId) return;
    void loadMissions();
  }, [loadMissions, userId]);

  return <><MissionIntroDialog /><MissionRewardDialog /></>;
}
