import { Text, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";
import { useTranslation } from "react-i18next";

import { useNativeNavigation } from "@/app/native/NativeNavigation";
import { buildGoalsPath } from "@/app/routes";
import { Calendar, ChevronDown, ChevronUp, Swords, Users } from "@/components/native/icons";
import { appPalette } from "@/theme/palette";
import type { Challenge, Goal, Leader } from "@/types";

import { ChallengeCardBadge, ChallengePrimaryButton } from "./Primitives";
import { formatChallengeDate, goalCompleted } from "./helpers";

export function ChallengeCardHeader({
  challenge,
  isCreator,
  isParticipant,
  isRemoved,
  challengeStatus,
  statusLabel,
}: {
  challenge: Challenge;
  isCreator: boolean;
  isParticipant: boolean;
  isRemoved: boolean;
  challengeStatus: "COMPLETED" | "FAILED" | "ACTIVE";
  statusLabel: string;
}) {
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Swords size={20} color={appPalette.brand.primary} />
        <Text style={{ fontSize: 12, fontWeight: "500", color: appPalette.semantic.textStrong, flex: 1, fontFamily: "Montserrat", lineHeight: 12 }}>{challenge.title}</Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(isCreator && <ChallengeCardBadge>{t("common.created_by")}</ChallengeCardBadge>) ||
          (isParticipant && <ChallengeCardBadge>{t("common.participating")}</ChallengeCardBadge>)}
        {isRemoved && <ChallengeCardBadge tone="danger">Исключён</ChallengeCardBadge>}
        {challengeStatus !== "ACTIVE" && <ChallengeCardBadge tone={challengeStatus === "COMPLETED" ? "success" : "danger"}>{statusLabel}</ChallengeCardBadge>}
      </View>
      {!!challenge.description && <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontWeight: "400", lineHeight: 18, fontFamily: "Montserrat" }}>{challenge.description}</Text>}
    </View>
  );
}

export function ChallengeProgressSection({
  progress,
  completedGoals,
  totalGoals,
}: {
  progress: number;
  completedGoals: number;
  totalGoals: number;
}) {
  const { t } = useTranslation();

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontWeight: "400", lineHeight: 18, fontFamily: "Montserrat" }}>{t("goals.progress")}</Text>
        <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontWeight: "400", lineHeight: 18, fontFamily: "Montserrat" }}>
          {completedGoals} / {totalGoals} {t("challenges.goals_count")}
        </Text>
      </View>
      <View style={{ height: 8, backgroundColor: appPalette.semantic.borderSubtle, borderRadius: 999, overflow: "hidden" }}>
        <View style={{ width: `${progress * 100}%`, height: "100%", backgroundColor: appPalette.brand.primary }} />
      </View>
    </View>
  );
}

export function ChallengePersonalProgressSection({ challenge, currentValue, targetValue, progress, unit }: {
  challenge: Challenge;
  currentValue: number;
  targetValue: number;
  progress: number;
  unit: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
        <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontFamily: "Montserrat" }}>{challenge.metricName || "Результат"}</Text>
        <Text style={{ color: appPalette.semantic.textStrong, fontSize: 12, fontWeight: "600", fontFamily: "Montserrat" }}>
          {currentValue.toLocaleString("ru-RU")} / {targetValue.toLocaleString("ru-RU")} {unit}
        </Text>
      </View>
      <View style={{ height: 8, backgroundColor: appPalette.semantic.borderSubtle, borderRadius: 999, overflow: "hidden" }}>
        <View style={{ width: `${progress * 100}%`, height: "100%", backgroundColor: appPalette.brand.primary }} />
      </View>
    </View>
  );
}

export function ChallengeGoalsSection({
  focused,
  isOpen,
  goals,
  canOpenGoals,
  onToggleOpen,
}: {
  focused: boolean;
  isOpen: boolean;
  goals: Goal[];
  canOpenGoals: boolean;
  onToggleOpen: () => void;
}) {
  const { t } = useTranslation();
  const { navigateToPath } = useNativeNavigation();

  const openGoal = (goalId: string) => {
    if (!canOpenGoals) return;
    navigateToPath(buildGoalsPath({ id: goalId }));
  };

  return (
    <View style={{ gap: 10 }}>
      <Pressable onPress={(event) => { event.stopPropagation(); onToggleOpen(); }} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: appPalette.semantic.textStrong, fontSize: 12, fontWeight: "500", lineHeight: 18, fontFamily: "Montserrat" }}>{t("challenges.goals")}</Text>
        {isOpen ? <ChevronUp size={18} color={appPalette.semantic.textMuted} /> : <ChevronDown size={18} color={appPalette.semantic.textMuted} />}
      </Pressable>
      {isOpen && (
        <View style={{ gap: 8 }}>
          {goals.map((goal) => (
            <Pressable
              key={goal.id}
              onPress={(event) => { event.stopPropagation(); openGoal(goal.id); }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: focused ? appPalette.semantic.infoBorder : appPalette.semantic.borderSubtle,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: focused ? appPalette.semantic.infoSurfaceStrong : appPalette.surface.background,
              }}
            >
              <Text style={{ flex: 1, color: appPalette.semantic.textStrong, fontSize: 12, fontWeight: "400", lineHeight: 18, fontFamily: "Montserrat" }} numberOfLines={2}>
                {goal.title}
              </Text>
              {goalCompleted(goal) && <ChallengeCardBadge>?</ChallengeCardBadge>}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export function ChallengeRulesSection({
  rules,
  isOpen,
  onToggleOpen,
}: {
  rules?: string | null;
  isOpen: boolean;
  onToggleOpen: () => void;
}) {
  const { t } = useTranslation();

  if (!rules) {
    return null;
  }

  return (
    <View style={{ gap: 10 }}>
      <Pressable onPress={(event) => { event.stopPropagation(); onToggleOpen(); }} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: appPalette.semantic.textStrong, fontSize: 12, fontWeight: "500", lineHeight: 18, fontFamily: "Montserrat" }}>{t("challenges.rules")}</Text>
        {isOpen ? <ChevronUp size={18} color={appPalette.semantic.textMuted} /> : <ChevronDown size={18} color={appPalette.semantic.textMuted} />}
      </Pressable>
      {isOpen && <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontWeight: "400", lineHeight: 18, fontFamily: "Montserrat" }}>{rules}</Text>}
    </View>
  );
}

export function ChallengeLeaderboardSection({
  focused,
  isOpen,
  leaderboard,
  onToggleOpen,
}: {
  focused: boolean;
  isOpen: boolean;
  leaderboard: Leader[];
  onToggleOpen: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={{ gap: 10 }}>
      <Pressable onPress={(event) => { event.stopPropagation(); void onToggleOpen(); }} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: appPalette.semantic.textStrong, fontSize: 12, fontWeight: "500", lineHeight: 18, fontFamily: "Montserrat" }}>{t("challenges.top_participants")}</Text>
        {isOpen ? <ChevronUp size={18} color={appPalette.semantic.textMuted} /> : <ChevronDown size={18} color={appPalette.semantic.textMuted} />}
      </Pressable>
      {isOpen && (
        <View style={{ gap: 8 }}>
          {leaderboard.map((participant, index) => (
            <View
              key={participant.userId}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: focused ? appPalette.semantic.infoBorder : appPalette.semantic.borderSubtle,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: focused ? appPalette.semantic.infoSurfaceStrong : appPalette.surface.background,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                <ChallengeCardBadge>#{index + 1}</ChallengeCardBadge>
                <Text style={{ color: appPalette.semantic.textStrong, fontSize: 12, fontWeight: "400", lineHeight: 18, fontFamily: "Montserrat", flex: 1 }} numberOfLines={1}>
                  {participant.name}
                </Text>
              </View>
              <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontWeight: "400", lineHeight: 18, fontFamily: "Montserrat" }}>{participant.xp} XP</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function ChallengePriceSection({
  focused,
  price,
}: {
  focused: boolean;
  price?: number | null;
}) {
  const { t } = useTranslation();

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: focused ? appPalette.semantic.infoBorder : appPalette.semantic.borderSubtle,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <Text style={{ color: appPalette.semantic.textStrong, fontSize: 12, fontWeight: "500", lineHeight: 18, fontFamily: "Montserrat" }}>{t("challenges.participation_cost")}</Text>
      <Text style={{ color: appPalette.semantic.textStrong, fontSize: 12, fontWeight: "500", lineHeight: 18, fontFamily: "Montserrat" }}>{price ? `${price} ${t("common.rubles_short")}` : t("challenges.free")}</Text>
    </View>
  );
}

export function ChallengeActionsRow({
  onOpenDetails,
  isParticipant,
  canJoin,
  isCreator,
  hasStarted,
  hasEnded,
  isPaid,
  hasLink,
  onOpenLink,
  onOpenParticipants,
  onAccept,
  onReport,
  onChat,
}: {
  onOpenDetails?: () => void;
  isParticipant: boolean;
  canJoin: boolean;
  isCreator: boolean;
  hasStarted: boolean;
  hasEnded: boolean;
  isPaid: boolean;
  hasLink: boolean;
  onOpenLink?: () => void;
  onOpenParticipants?: () => void;
  onAccept?: () => void;
  onReport?: () => void;
  onChat?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
      {!!onOpenDetails && <ChallengePrimaryButton label={t("common.details")} onPress={onOpenDetails} />}
      {!!onOpenLink && hasLink && isParticipant && <ChallengePrimaryButton label={t("common.community")} onPress={onOpenLink} />}
      {!!onOpenParticipants && isCreator && <ChallengePrimaryButton label={t("common.participants")} onPress={onOpenParticipants} />}
      {!!onReport && isParticipant && <ChallengePrimaryButton label="Сдать отчёт" onPress={onReport} />}
      {!!onChat && <ChallengePrimaryButton label="Общий чат" onPress={onChat} />}
      {!!onAccept && canJoin && !isParticipant && !hasStarted && !hasEnded && !isPaid && <ChallengePrimaryButton label={t("challenges.accept")} onPress={onAccept} />}
    </View>
  );
}

export function ChallengeFooter({
  challenge,
}: {
  challenge: Challenge;
}) {
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: appPalette.semantic.borderSubtle, paddingTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
        <Calendar size={14} color={appPalette.semantic.textSubtle} />
        <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontWeight: "400", lineHeight: 18, fontFamily: "Montserrat", flex: 1 }}>
          {formatChallengeDate(challenge.startsAt)} {" > "} {formatChallengeDate(challenge.endsAt)}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Users size={14} color={appPalette.semantic.textSubtle} />
        <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontWeight: "400", lineHeight: 18, fontFamily: "Montserrat" }}>{challenge.participants.length}</Text>
      </View>
    </View>
  );
}
