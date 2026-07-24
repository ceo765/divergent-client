import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ProgressRing } from "@/components/shared/ProgressRing";
import { DoorOpen, Edit, Share } from "@/components/native/icons";
import { SurfaceCard } from "@/components/native/SurfaceCard";
import { useAppStore } from "@/stores/useAppStore";
import { appPalette } from "@/theme/palette";
import type { Challenge, Leader } from "@/types";

import { ChallengeCardAction } from "./challenge-card/Primitives";
import {
  ChallengeActionsRow,
  ChallengeCardHeader,
  ChallengeFooter,
  ChallengeGoalsSection,
  ChallengeLeaderboardSection,
  ChallengePriceSection,
  ChallengePersonalProgressSection,
  ChallengeProgressSection,
  ChallengeRulesSection,
} from "./challenge-card/Sections";
import { getChallengeDerivedState } from "./challenge-card/helpers";

export function NativeChallengeCardView({
  challenge,
  focused = false,
  onEdit,
  onShare,
  onSelect,
  onAccept,
  onLeave,
  onOpenLink,
  onOpenParticipants,
  onReport,
  onChat,
}: {
  challenge: Challenge;
  focused?: boolean;
  onEdit?: (id: string) => void;
  onShare?: (id: string) => void;
  onSelect?: (challenge: Challenge) => void;
  onAccept?: (id: string) => void;
  onLeave?: (id: string) => void;
  onOpenLink?: (id: string) => void;
  onOpenParticipants?: (id: string) => void;
  onReport?: (id: string) => void;
  onChat?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { user, getLeaderboard } = useAppStore();
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Leader[]>([]);
  const [highlight, setHighlight] = useState(focused);

  const { isCreator, isParticipant, participant, completedGoals, progress, hasStarted, hasEnded, challengeStatus } = getChallengeDerivedState(challenge, user?.id);
  const statusLabel =
    challengeStatus === "COMPLETED"
      ? t("challenges.status_completed")
      : challengeStatus === "FAILED"
        ? t("challenges.status_failed")
        : t("challenges.status_active");

  const openLeaderboard = async () => {
    if (isLeaderboardOpen) {
      setIsLeaderboardOpen(false);
      return;
    }

    const nextLeaderboard = await getLeaderboard(challenge.id);
    setLeaderboard(nextLeaderboard);
    setIsLeaderboardOpen(true);
  };

  useEffect(() => {
    if (!focused) {
      return;
    }

    setHighlight(true);
    const timeout = setTimeout(() => setHighlight(false), 2000);
    return () => clearTimeout(timeout);
  }, [focused]);

  return (
    <View
      style={{
        opacity: (hasEnded || hasStarted || participant?.status === "REMOVED") && !isParticipant ? 0.6 : 1,
        backgroundColor: highlight ? appPalette.semantic.infoSurfaceStrong : "transparent",
        borderRadius: 12,
      }}
    >
      <SurfaceCard gap={12} padding={24} radius={12}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
            <ChallengeCardHeader
              challenge={challenge}
              isCreator={isCreator}
              isParticipant={isParticipant}
              isRemoved={participant?.status === "REMOVED"}
              challengeStatus={challengeStatus}
              statusLabel={statusLabel}
            />

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {isParticipant && <ProgressRing progress={progress * 100} size={70} strokeWidth={6} />}
              <View>
                {isCreator && !!onEdit && <ChallengeCardAction icon={<Edit size={14} color={appPalette.semantic.textMuted} />} onPress={() => onEdit(challenge.id)} />}
                {!!onShare && <ChallengeCardAction icon={<Share size={14} color={appPalette.semantic.textMuted} />} onPress={() => onShare(challenge.id)} />}
                {!isCreator && isParticipant && !!onLeave && <ChallengeCardAction icon={<DoorOpen size={14} color={appPalette.semantic.textMuted} />} onPress={() => onLeave(challenge.id)} />}
              </View>
            </View>
          </View>

          {isParticipant && challenge.personalGoalsEnabled && (
            <ChallengePersonalProgressSection
              challenge={challenge}
              currentValue={participant?.currentValue ?? 0}
              targetValue={participant?.targetValue ?? 0}
              progress={progress}
              unit={participant?.unit || challenge.metricUnit || ""}
            />
          )}

          {isParticipant && participant && participant.missCount > 0 && (
            <View style={{ borderWidth: 1, borderColor: appPalette.semantic.warningBorder, backgroundColor: appPalette.semantic.warningSurface, borderRadius: 12, padding: 12 }}>
              <Text style={{ color: appPalette.semantic.warningText, fontSize: 12, lineHeight: 18, fontFamily: "Montserrat" }}>
                Пропуски: {participant.missCount} из {challenge.allowedMisses ?? 1} допустимых.
                {participant.missCount >= (challenge.allowedMisses ?? 1) ? " Следующий пропуск приведёт к исключению." : ""}
              </Text>
            </View>
          )}

          {isParticipant && !challenge.personalGoalsEnabled && (
            <ChallengeProgressSection
              progress={progress}
              completedGoals={completedGoals}
              totalGoals={challenge.goals.length}
            />
          )}

          {!challenge.personalGoalsEnabled && <ChallengeGoalsSection
            focused={focused}
            isOpen={isGoalsOpen}
            goals={challenge.goals}
            canOpenGoals={isParticipant}
            onToggleOpen={() => setIsGoalsOpen((current) => !current)}
          />}

          <ChallengeRulesSection
            rules={challenge.rules}
            isOpen={isRulesOpen}
            onToggleOpen={() => setIsRulesOpen((current) => !current)}
          />

          <ChallengeLeaderboardSection
            focused={focused}
            isOpen={isLeaderboardOpen}
            leaderboard={leaderboard}
            onToggleOpen={openLeaderboard}
          />

          <ChallengePriceSection focused={focused} price={challenge.price} />

          <ChallengeActionsRow
            onOpenDetails={onSelect ? () => onSelect(challenge) : undefined}
            isParticipant={isParticipant}
            canJoin={!participant}
            isCreator={isCreator}
            hasStarted={hasStarted}
            hasEnded={hasEnded}
            isPaid={Boolean(challenge.price && challenge.price > 0)}
            hasLink={Boolean(challenge.link)}
            onOpenLink={onOpenLink ? () => onOpenLink(challenge.id) : undefined}
            onOpenParticipants={onOpenParticipants ? () => onOpenParticipants(challenge.id) : undefined}
            onAccept={onAccept ? () => onAccept(challenge.id) : undefined}
            onReport={onReport && challenge.personalGoalsEnabled ? () => onReport(challenge.id) : undefined}
            onChat={onChat && (isParticipant || isCreator) ? () => onChat(challenge.id) : undefined}
          />

          <ChallengeFooter challenge={challenge} />
      </SurfaceCard>
    </View>
  );
}
