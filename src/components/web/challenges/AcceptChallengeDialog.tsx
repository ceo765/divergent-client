import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Share2, ChevronUp, ChevronDown } from "lucide-react";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import type { Challenge, Leader } from "@/types";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/stores/useAppStore.ts";
import { getChallengeDerivedState } from "@/shared/display/challenges";

interface ChallengeDialogProps {
  challenge: Challenge;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: (id: string) => void;
  onShare: (id: string) => void;
}

export function AcceptChallengeDialog({ challenge, isOpen, onOpenChange, onAccept, onShare }: ChallengeDialogProps) {
  const [showGoals, setShowGoals] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Leader[]>([]);

  const { t } = useTranslation();
  const { user, getLeaderboard } = useAppStore();

  const totalGoals = challenge.goals.length;
  const derivedState = getChallengeDerivedState(challenge, user!.id);
  const { challengeStatus, hasEnded, hasStarted, isParticipant, participant, progress } = derivedState;


  const onLeaderboardClick = async (id: string) => {
    if (isLeaderboardOpen) {
      return;
    }

    const nextLeaderboard = await getLeaderboard(id);
    setLeaderboard(nextLeaderboard);
  };

  const statusLabel =
    challengeStatus === "COMPLETED"
      ? t("challenges.status_completed")
      : challengeStatus === "FAILED"
        ? t("challenges.status_failed")
        : t("challenges.status_active");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{challenge.title}</DialogTitle>
        </DialogHeader>

        {challenge.description && (
          <p className="mt-2 whitespace-break-spaces text-sm text-muted-foreground">{challenge.description}</p>
        )}

        <div className="mt-4 flex items-center gap-6">
          <ProgressRing progress={progress * 100} size={70} strokeWidth={7} />

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar size={16} />
              <span>
                {challenge.startsAt ? format(new Date(challenge.startsAt), "dd.MM.yyyy") : "—"} {" > "}
                {challenge.endsAt ? format(new Date(challenge.endsAt), "dd.MM.yyyy") : "—"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users size={16} />
              <span>
                {t("challenges.participants_count")} {challenge.participants.length}
              </span>
            </div>

            <Badge variant={challenge.isPublic ? "secondary" : "outline"} className="mt-1">
              {challenge.isPublic ? t("challenges.visibility.public") : t("challenges.visibility.private")}
            </Badge>
            {challengeStatus !== "ACTIVE" && (
              <Badge
                className={
                  challengeStatus === "COMPLETED"
                    ? "bg-green-600"
                    : challengeStatus === "FAILED"
                      ? "bg-red-400"
                      : "bg-accent text-foreground"
                }
              >
                {statusLabel}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {challenge.personalGoalsEnabled && isParticipant && (
            <div className="flex justify-between rounded-md border p-2 text-sm font-medium">
              <span>{challenge.metricName || "Результат"}</span>
              <span>
                {(participant?.currentValue ?? 0).toLocaleString("ru-RU")} / {(participant?.targetValue ?? 0).toLocaleString("ru-RU")} {participant?.unit || challenge.metricUnit || ""}
              </span>
            </div>
          )}
          {totalGoals > 0 && (
            <Collapsible open={showGoals} onOpenChange={setShowGoals} className="mt-2">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>{t("challenges.goals")}</span>
                  {showGoals ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {challenge.goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between rounded border p-2 transition hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="text-sm">{goal.title}</span>
                    {goal.lastCompletedAt && <Badge variant="secondary">{t("challenges.completed")}</Badge>}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {challenge.rules && (
            <Collapsible open={isRulesOpen} onOpenChange={setIsRulesOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between" onClick={(e) => e.stopPropagation()}>
                  <span>{t("challenges.rules")}</span>
                  {isRulesOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {challenge.rules}
              </CollapsibleContent>
            </Collapsible>
          )}

          <Collapsible open={isLeaderboardOpen} onOpenChange={setIsLeaderboardOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="transparent"
                className="w-full justify-between"
                onClick={(e) => (e.stopPropagation(), onLeaderboardClick(challenge.id))}
              >
                <span>{t("challenges.top_participants")}</span>
                {isLeaderboardOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="my-2 space-y-2">
              {leaderboard.map((participant, index) => (
                <div
                  key={participant.userId}
                  className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">#{index + 1}</Badge>
                    <span>{participant.name}</span>
                  </div>
                  <span className="text-muted-foreground">{participant.xp} XP</span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-between rounded-md border p-2 text-sm font-medium">
            <span>{t("challenges.participation_cost")}</span>
            <span>{challenge.price ? `${challenge.price} ${t("common.rubles_short")}` : t("challenges.free")}</span>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>

          <Button variant="outline" onClick={() => onShare(challenge.id)}>
            <Share2 size={16} className="mr-1" /> {t("common.share")}
          </Button>

          {!isParticipant && !hasStarted && !hasEnded && (
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => {
                onAccept(challenge.id);
                onOpenChange(false);
              }}
            >
              {t("challenges.accept")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

