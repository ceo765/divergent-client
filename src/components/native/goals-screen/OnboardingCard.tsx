import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { buildRewardsPath } from "@/app/routes";
import { useNativeNavigation } from "@/app/native/NativeNavigation";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";
import { NativeRewardIcon } from "@/components/native/NativeRewardIcon";
import { Target } from "@/components/native/icons";
import { appPalette } from "@/theme/palette";
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
  const { navigateToPath } = useNativeNavigation();

  if (state.isComplete) {
    return null;
  }

  const nextStep = state.steps.find((step) => !step.completed);

  return (
    <View
      style={{
        gap: 16,
        borderWidth: 1,
        borderColor: appPalette.semantic.borderSubtle,
        backgroundColor: appPalette.surface.card,
        borderRadius: 16,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Target size={16} color={appPalette.semantic.successText} />
            <Text
              style={{
                fontSize: 16,
                lineHeight: 24,
                fontWeight: "600",
                color: appPalette.semantic.textStrong,
                fontFamily: "Montserrat",
              }}
            >
              {t("onboarding.title")}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 12,
              lineHeight: 18,
              color: appPalette.semantic.textMuted,
              fontFamily: "Montserrat",
            }}
          >
            {t("onboarding.subtitle")}
          </Text>
        </View>
        <View
          style={{
            borderRadius: 999,
            backgroundColor: appPalette.semantic.successSurface,
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
        >
          <Text
            style={{
              color: appPalette.semantic.successText,
              fontSize: 12,
              lineHeight: 18,
              fontWeight: "500",
              fontFamily: "Montserrat",
            }}
          >
            {t("onboarding.progress", { completed: state.completedCount, total: state.totalCount })}
          </Text>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        {nextStep ? (() => {
          const meta = ONBOARDING_STEPS.find((item) => item.key === nextStep.key);
          if (!meta) {
            return null;
          }

          return (
            <View
              style={{
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: appPalette.semantic.borderSubtle,
                backgroundColor: appPalette.surface.background,
              }}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <Text
                    style={{
                      flex: 1,
                      color: appPalette.semantic.textStrong,
                      fontSize: 13,
                      lineHeight: 19,
                      fontWeight: "500",
                      fontFamily: "Montserrat",
                    }}
                  >
                    {t(meta.titleKey)}
                  </Text>
                  <View
                    style={{
                      borderRadius: 999,
                      backgroundColor: appPalette.semantic.successSurface,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Text
                      style={{
                        color: appPalette.semantic.successText,
                        fontSize: 11,
                        lineHeight: 16,
                        fontWeight: "600",
                        fontFamily: "Montserrat",
                      }}
                    >
                      +{STEP_XP} {t("common.xp")}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    color: appPalette.semantic.textStrong,
                    fontSize: 12,
                    lineHeight: 18,
                    fontFamily: "Montserrat",
                  }}
                >
                  {t(meta.descriptionKey)}
                </Text>
                <Pressable
                  onPress={() => onUsePrompt(t(meta.promptKey))}
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: appPalette.semantic.borderSubtle,
                    backgroundColor: appPalette.semantic.neutralSurface,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    marginTop: 4,
                    gap: 4,
                  }}
                >
                  <Text
                    style={{
                      color: appPalette.semantic.textMuted,
                      fontSize: 9,
                      lineHeight: 13,
                      fontWeight: "600",
                      letterSpacing: 0.3,
                      fontFamily: "Montserrat",
                      textTransform: "uppercase",
                    }}
                  >
                    {t("onboarding.prompt_label")}
                  </Text>
                  <Text
                    style={{
                      color: appPalette.semantic.textMuted,
                      fontSize: 11,
                      lineHeight: 16,
                      fontFamily: "Montserrat",
                    }}
                  >
                    {t(meta.promptKey)}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })() : null}
      </View>

      {reward && (
        <Pressable
          onPress={() => navigateToPath(buildRewardsPath({ id: reward.id }))}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: appPalette.semantic.borderSubtle,
            backgroundColor: appPalette.surface.background,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <NativeRewardIcon icon={reward.icon} unlocked={reward.isUnlocked} size={32} iconSize={16} />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Text
                style={{
                  color: appPalette.semantic.textStrong,
                  fontSize: 13,
                  lineHeight: 19,
                  fontWeight: "600",
                  fontFamily: "Montserrat",
                  flexShrink: 1,
                }}
                numberOfLines={1}
              >
                {reward.title}
              </Text>
              <View
                style={{
                  borderRadius: 999,
                  backgroundColor: reward.isUnlocked ? appPalette.semantic.successStrong : appPalette.semantic.neutralSurface,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Text
                  style={{
                    color: reward.isUnlocked ? appPalette.semantic.textInverse : appPalette.semantic.neutralText,
                    fontSize: 11,
                    lineHeight: 16,
                    fontWeight: "600",
                    fontFamily: "Montserrat",
                  }}
                >
                  {reward.isUnlocked ? t("rewards.unlocked") : t("rewards.locked")}
                </Text>
              </View>
            </View>
            <Text
              style={{
                color: appPalette.semantic.textMuted,
                fontSize: 12,
                lineHeight: 18,
                fontFamily: "Montserrat",
              }}
              numberOfLines={2}
            >
              {reward.description}
            </Text>
          </View>
          <Text
            style={{
              color: appPalette.semantic.successText,
              fontSize: 18,
              lineHeight: 18,
              fontFamily: "Montserrat",
              paddingHorizontal: 2,
            }}
          >
            {'>'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
