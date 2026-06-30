import { ScrollText, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "@/stores/useAppStore";

export function MissionIntroDialog() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const missionState = useAppStore((state) => state.missionState);
  const markMissionIntroSeen = useAppStore((state) => state.markMissionIntroSeen);
  const [saving, setSaving] = useState(false);

  if (!missionState || missionState.introSeen) return null;

  const start = async () => {
    if (saving) return;
    try {
      setSaving(true);
      await markMissionIntroSeen();
      navigate("/missions");
    } finally {
      setSaving(false);
    }
  };

  return <Dialog open>
    <DialogContent className="max-w-sm text-center">
      <DialogHeader className="items-center text-center sm:text-center">
        <div className="relative flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ScrollText className="size-10" />
          <Sparkles className="absolute -right-1 -top-1 size-6" />
        </div>
        <DialogTitle className="pt-2 text-2xl">{t("missions.intro_title")}</DialogTitle>
        <DialogDescription className="text-sm leading-6">{t("missions.intro_description")}</DialogDescription>
      </DialogHeader>
      <Button size="lg" disabled={saving} onClick={() => void start()}>{saving ? t("common.saving") : t("missions.intro_start")}</Button>
    </DialogContent>
  </Dialog>;
}
