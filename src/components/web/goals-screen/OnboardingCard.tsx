import { ChevronRight } from "lucide-react";
import { Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { RewardIcon } from "@/components/shared/RewardIcon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Reward } from "@/types";

import { ONBOARDING_STEPS, type OnboardingChecklistState } from "@/shared/screens/onboarding/model";
const STEP_XP = 100;

export function OnboardingCard({
  state,
  reward,
  onUsePrompt,
}: {
  state: OnboardingChecklistState;
  reward: Reward | null;
  onUsePrompt: (prompt: string) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (state.isComplete) {
    return null;
  }

  const nextStep = state.steps.find((step) => !step.completed);

  return (
    <Card className="mx-auto w-full max-w-2xl bg-background">
      <CardContent className="flex flex-col gap-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-emerald-600" />
              <h3 className="text-base font-semibold">{t("onboarding.title")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t("onboarding.subtitle")}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {t("onboarding.progress", { completed: state.completedCount, total: state.totalCount })}
          </Badge>
        </div>

        <div className="grid gap-2">
          {nextStep ? (() => {
            const meta = ONBOARDING_STEPS.find((item) => item.key === nextStep.key);
            if (!meta) {
              return null;
            }

            return (
              <div
                key={nextStep.key}
                className="rounded-lg border border-border bg-background/80 p-3"
              >
                <div className="min-w-0 flex-1 w-full">
                  <div className="flex w-full items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{t(meta.titleKey)}</div>
                    </div>
                    <Badge variant="secondary" className="ml-auto shrink-0 whitespace-nowrap bg-emerald-100 text-emerald-700">
                      +{STEP_XP} {t("common.xp")}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground">{t(meta.descriptionKey)}</p>
                  <button
                    type="button"
                    onClick={() => onUsePrompt(t(meta.promptKey))}
                    className="mt-2 w-full rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-left transition hover:bg-muted/60"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t("onboarding.prompt_label")}</p>
                    <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{t(meta.promptKey)}</p>
                  </button>
                </div>
              </div>
            );
          })() : null}
        </div>

        {reward && (
          <button
            type="button"
            onClick={() => navigate({ pathname: "/rewards", search: `?id=${reward.id}` })}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-background px-3 py-2 text-left transition hover:bg-muted/50"
          >
            <RewardIcon
              icon={reward.icon}
              size={4}
              className="rounded-md bg-muted/60"
              colorClass={reward.isUnlocked ? "text-foreground" : "text-muted-foreground"}
            />
            <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-foreground">{reward.title}</span>
              <Badge variant={reward.isUnlocked ? "default" : "secondary"} className={reward.isUnlocked ? "bg-green-500" : ""}>
                {reward.isUnlocked ? t("rewards.unlocked") : t("rewards.locked")}
              </Badge>
            </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{reward.description}</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-emerald-600" />
          </button>
        )}

      </CardContent>
    </Card>
  );
}
