import { useState } from "react";
import { Sparkles, Star, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getMissionDefinition } from "@/shared/missions/catalog";
import { useAppStore } from "@/stores/useAppStore";

export function MissionRewardDialog() {
  const { t } = useTranslation();
  const missionState = useAppStore((state) => state.missionState);
  const claimMissionReward = useAppStore((state) => state.claimMissionReward);
  const [claiming, setClaiming] = useState(false);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const pending = missionState?.missions.find((mission) => mission.key === missionState.pendingRewardKey);
  const definition = pending ? getMissionDefinition(pending.key) : null;

  if (!pending || !definition) return null;

  const claim = async () => {
    if (claiming) return;
    try { setClaiming(true); await claimMissionReward(pending.key); }
    finally { setClaiming(false); }
  };

  return <Dialog open={dismissedKey !== pending.key} onOpenChange={(open) => { if (!open) setDismissedKey(pending.key); }}>
    <DialogContent className="max-w-sm overflow-hidden text-center">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-amber-200/60 to-transparent" />
      <DialogHeader className="relative items-center text-center sm:text-center">
        <div className="relative flex size-20 items-center justify-center rounded-full bg-amber-100 text-amber-600"><Trophy className="size-10" /><Sparkles className="absolute -right-2 -top-2 size-6 text-primary" /></div>
        <DialogTitle className="pt-2 text-2xl">{t("missions.reward_title")}</DialogTitle>
        <DialogDescription>{t(definition.titleKey)}</DialogDescription>
      </DialogHeader>
      <div className="relative rounded-xl border bg-muted/40 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("missions.reward_received")}</p>
        <p className="mt-1 flex items-center justify-center gap-2 text-2xl font-bold text-amber-600"><Star className="size-6 fill-current" />+{pending.xpReward} XP</p>
      </div>
      <Button size="lg" disabled={claiming} onClick={() => void claim()}>{claiming ? t("missions.claiming") : t("missions.claim", { xp: pending.xpReward })}</Button>
    </DialogContent>
  </Dialog>;
}
