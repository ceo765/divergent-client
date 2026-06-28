import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Edit, Share, ChevronUp, ChevronDown, DoorOpen, Swords } from "lucide-react";
import type { Challenge, Leader } from "@/types";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { Button } from "@/components/ui/button.tsx";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible.tsx";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { buildGoalsPath } from "@/app/routes";
import {
  formatChallengeDate,
  getChallengeDerivedState,
  getChallengeStatusTranslationKey,
  goalCompleted,
} from "@/shared/display/challenges";
import { useAppStore } from "@/stores/useAppStore.ts";
import { MouseEvent as ReactMouseEvent } from "react";

interface Props {
  challenge: Challenge;
  focused: boolean;
  onEdit?: (id: string) => void;
  onShare?: (id: string) => void;
  onAccept?: (id: string) => void;
  onLeave?: (id: string) => void;
  onOpenLink?: (id: string) => void;
  onOpenParticipants?: (id: string) => void;
  onSelect?: (challenge: Challenge) => void;
  onReport?: (id: string) => void;
}

export function ChallengeCard({
  challenge,
  focused,
  onShare,
  onEdit,
  onAccept,
  onLeave,
  onOpenLink,
  onOpenParticipants,
  onSelect,
  onReport,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Leader[]>([]);

  const { user, getLeaderboard } = useAppStore();
  const navigate = useNavigate();
  const goals = challenge.goals;
  const {
    challengeStatus,
    completedGoals,
    hasEnded,
    hasStarted,
    isCreator,
    isParticipant,
    participant,
    progress,
  } = getChallengeDerivedState(challenge, user!.id);

  const onGoalClick = (e: ReactMouseEvent, id: string) => {
    if (!isParticipant) {
      return;
    }

    e.stopPropagation();
    navigate(buildGoalsPath({ id }));
  };

  const onLeaderboardClick = async (id: string) => {
    if (isLeaderboardOpen) {
      return;
    }

    const nextLeaderboard = await getLeaderboard(id);
    setLeaderboard(nextLeaderboard);
  };

  useEffect(() => {
    if (!cardRef.current || !focused) {
      return;
    }

    cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focused]);

  const statusLabel = t(getChallengeStatusTranslationKey(challengeStatus));

  return (
    <Card
      ref={cardRef}
      className={`
        mb-2 break-inside-avoid
        hover:shadow-md transition-all
        ${(hasEnded || hasStarted) && !isParticipant ? "opacity-60" : ""}
      `}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-2">
              <Swords className="size-5 text-primary" />
              <CardTitle className="break-words">{challenge.title}</CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              {(isCreator && <Badge variant="outline">{t("common.created_by")}</Badge>) ||
                (isParticipant && <Badge variant="outline">{t("common.participating")}</Badge>)}
              {challengeStatus !== "ACTIVE" && (
                <Badge
                  className={
                    challengeStatus === "COMPLETED"
                      ? "bg-green-500"
                      : challengeStatus === "FAILED"
                        ? "bg-red-500"
                        : "bg-accent text-foreground"
                  }
                >
                  {statusLabel}
                </Badge>
              )}
            </div>
            {challenge.description && <CardDescription className="break-words">{challenge.description}</CardDescription>}
          </div>

          <div className="flex items-center gap-2">
            {isParticipant && <ProgressRing progress={progress * 100} size={70} strokeWidth={6} />}
            <div className="flex flex-col">
              {onEdit && isCreator && (
                <Button variant="ghost" size="icon" onClick={(e) => (e.stopPropagation(), onEdit(challenge.id))}>
                  <Edit className="size-4" />
                </Button>
              )}
              {onShare && (
                <Button variant="ghost" size="icon" onClick={(e) => (e.stopPropagation(), onShare(challenge.id))}>
                  <Share className="size-4" />
                </Button>
              )}
              {!isCreator && onLeave && isParticipant && (
                <Button variant="ghost" size="icon" onClick={(e) => (e.stopPropagation(), onLeave(challenge.id))}>
                  <DoorOpen className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {isParticipant && challenge.personalGoalsEnabled && (
          <div className="space-y-2 pb-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{challenge.metricName || "Результат"}</span>
              <span className="font-medium">
                {(participant?.currentValue ?? 0).toLocaleString("ru-RU")} / {(participant?.targetValue ?? 0).toLocaleString("ru-RU")} {participant?.unit || challenge.metricUnit || ""}
              </span>
            </div>
            <Progress value={progress * 100} className="h-2" />
          </div>
        )}

        {isParticipant && !challenge.personalGoalsEnabled && (
          <div className="pb-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground">{t("goals.progress")}</span>
              <span className="text-muted-foreground">
                {completedGoals} / {goals.length} {t("challenges.goals_count")}
              </span>
            </div>
            <Progress value={progress * 100} className="h-2" />
          </div>
        )}

        {!challenge.personalGoalsEnabled && <Collapsible open={isGoalsOpen} onOpenChange={setIsGoalsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="transparent" className="w-full justify-between" onClick={(e) => e.stopPropagation()}>
              <span>{t("challenges.goals")}</span>
              {isGoalsOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="my-2 space-y-2">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="flex cursor-pointer items-center justify-between rounded border px-3 py-2 hover:bg-blue-50"
                onClick={(e) => onGoalClick(e, goal.id)}
              >
                <span className="truncate">{goal.title}</span>
                {goalCompleted(goal) && <Badge variant="secondary">?</Badge>}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>}

        {challenge.rules && (
          <Collapsible open={isRulesOpen} onOpenChange={setIsRulesOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="transparent" className="w-full justify-between" onClick={(e) => e.stopPropagation()}>
                <span>{t("challenges.rules")}</span>
                {isRulesOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="my-2 whitespace-pre-line break-words text-sm text-muted-foreground">
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

        <div className="flex flex-wrap justify-center gap-2">
          {onSelect && (
            <div className="flex justify-center py-2">
              <Button onClick={() => onSelect(challenge)}>{t("common.details")}</Button>
            </div>
          )}
          {onOpenLink && challenge.link && isParticipant && (
            <div className="flex justify-center py-2">
              <Button onClick={(e) => (e.stopPropagation(), onOpenLink(challenge.id))}>{t("common.community")}</Button>
            </div>
          )}
          {onOpenParticipants && isCreator && (
            <div className="flex justify-center py-2">
              <Button onClick={(e) => (e.stopPropagation(), onOpenParticipants(challenge.id))}>
                {t("common.participants")}
              </Button>
            </div>
          )}
          {onReport && isParticipant && challenge.personalGoalsEnabled && (
            <div className="flex justify-center py-2">
              <Button onClick={(event) => (event.stopPropagation(), onReport(challenge.id))}>Сдать отчёт</Button>
            </div>
          )}
          {!isParticipant && onAccept && !hasStarted && !hasEnded && (
            <div className="flex justify-center py-2">
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept(challenge.id);
                }}
              >
                {t("challenges.accept")}
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-3">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="size-4" />
            <span>
              {formatChallengeDate(challenge.startsAt)}
              {" > "}
              {formatChallengeDate(challenge.endsAt)}
            </span>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="size-4" />
            {challenge.participants.length}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
