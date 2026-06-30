import { Check, ChevronRight, Lock, Sparkles, Star } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MISSION_DEFINITIONS } from "@/shared/missions/catalog";
import { useAppStore } from "@/stores/useAppStore";

export default function MissionsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const missionState = useAppStore((state) => state.missionState);
  const missionsLoading = useAppStore((state) => state.missionsLoading);
  const loadMissions = useAppStore((state) => state.loadMissions);

  useEffect(() => { void loadMissions(); }, [loadMissions]);

  const completed = missionState?.missions.filter((mission) => mission.completedAt).length ?? 0;
  const total = MISSION_DEFINITIONS.length;
  const activeOrder = missionState?.missions.find((mission) => mission.key === missionState.activeKey)?.order ?? total + 1;

  return <div className="flex min-h-0 flex-1 flex-col px-2">
    <div className="py-3">
      <div className="flex items-center gap-2"><Sparkles className="size-6 text-primary" /><h2>{t("missions.title")}</h2></div>
      <p className="text-sm text-muted-foreground">{t("missions.subtitle")}</p>
      <div className="mt-3 flex items-center gap-3"><Progress value={(completed / total) * 100} className="h-2" /><span className="shrink-0 text-xs font-medium">{t("missions.progress", { completed, total })}</span></div>
    </div>
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-3">
      {missionsLoading && !missionState ? <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Загружаем миссии…</CardContent></Card> : MISSION_DEFINITIONS.map((definition, index) => {
        const progress = missionState?.missions.find((mission) => mission.key === definition.key);
        const isCompleted = Boolean(progress?.completedAt);
        const isActive = missionState?.activeKey === definition.key;
        const isLocked = !isCompleted && !isActive && index + 1 > activeOrder;
        return <Card key={definition.key} className={isActive ? "border-primary shadow-sm" : isLocked ? "opacity-60" : ""}>
          <CardContent className="flex gap-3 py-4">
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${isCompleted ? "bg-emerald-100 text-emerald-700" : isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {isCompleted ? <Check className="size-5" /> : isLocked ? <Lock className="size-4" /> : <span className="font-bold">{index + 1}</span>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{t(definition.titleKey)}</h3>
                {isActive && <Badge>{t("missions.active")}</Badge>}
                {isCompleted && <Badge className="bg-emerald-600">{t("missions.completed")}</Badge>}
                <Badge variant="secondary" className="ml-auto"><Star className="mr-1 size-3" />+{progress?.xpReward ?? 100} XP</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t(definition.descriptionKey)}</p>
              {!isLocked && <div className="mt-3 grid gap-2 rounded-lg bg-muted/40 p-3 text-sm sm:grid-cols-2">
                <div><p className="text-xs font-semibold uppercase text-muted-foreground">{t("missions.what_to_do")}</p><p>{t(definition.actionKey)}</p></div>
                <div><p className="text-xs font-semibold uppercase text-muted-foreground">{t("missions.example")}</p><p>{t(definition.exampleKey)}</p></div>
              </div>}
              {isActive && <Button className="mt-3" onClick={() => navigate(definition.path)}>{t("missions.go_to_action")}<ChevronRight className="ml-1 size-4" /></Button>}
              {isLocked && <p className="mt-2 text-xs text-muted-foreground">{t("missions.locked")}</p>}
            </div>
          </CardContent>
        </Card>;
      })}
      {completed === total && <Card className="border-emerald-300 bg-emerald-50"><CardContent className="py-6 text-center font-semibold text-emerald-800">{t("missions.all_complete")}</CardContent></Card>}
    </div>
  </div>;
}
