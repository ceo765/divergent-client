import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, SafeAreaView, Text, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";

import { NativeNavigationProvider } from "@/app/native/NativeNavigation";
import { parseNativeAppRoute, type NativeAppTab } from "@/app/router.native";
import { NativeAppHeader } from "@/components/native/NativeAppHeader";
import { MissionRewardModal } from "@/components/native/MissionRewardModal";
import { MissionIntroModal } from "@/components/native/MissionIntroModal";
import { BarChart2, Bell, Gift, Home, Swords, Target } from "@/components/native/icons";
import { AppLoader } from "@/components/shared/AppLoader";
import { useAppStore } from "@/stores/useAppStore";
import { appPalette } from "@/theme/palette";

const NativeTodayScreen = lazy(() => import("@/views/native/today"));
const NativeChallengesScreen = lazy(() => import("@/views/native/challenges"));
const NativeGoalsScreen = lazy(() => import("@/views/native/goals"));
const NativeProgressScreen = lazy(() => import("@/views/native/ProgressView"));
const NativeRemindersScreen = lazy(() => import("@/views/native/reminders"));
const NativeRewardsScreen = lazy(() => import("@/views/native/rewards"));
const NativeSettingsScreen = lazy(() => import("@/views/native/settings"));
const NativeMissionsScreen = lazy(() => import("@/views/native/missions"));

function NativeScreenFallback() {
  return <AppLoader fullScreen />;
}

function syncPreviewUrl(state: ReturnType<typeof parseNativeAppRoute>) {
  if (typeof window === "undefined" || !state?.tab) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  params.set("tab", state.tab);
  params.delete("id");
  params.delete("goalId");
  params.delete("reportTaskId");
  params.delete("onboarding");
  params.delete("reminderId");
  params.delete("rewardId");
  params.delete("paymentId");

  if (state.tab === "goals" && state.goalId) {
    params.set("id", state.goalId);
  }

  if (state.tab === "goals" && state.reportTaskId) {
    params.set("reportTaskId", state.reportTaskId);
  }

  if (state.tab === "goals" && state.onboarding) {
    params.set("onboarding", state.onboarding);
  }

  if (state.tab === "reminders") {
    if (state.reminderId) {
      params.set("id", state.reminderId);
    }
    if (state.goalId) {
      params.set("goalId", state.goalId);
    }
  }

  if (state.tab === "challenges") {
    if (state.focusId) {
      params.set("id", state.focusId);
    }
    if (state.paymentId) {
      params.set("paymentId", state.paymentId);
    }
  }

  if (state.tab === "rewards" && state.rewardId) {
    params.set("id", state.rewardId);
  }

  if (state.tab === "progress" && state.goalId) {
    params.set("goalId", state.goalId);
  }

  const next = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", next);
}

export default function NativeAppShell({ mode = "standalone" }: { mode?: "preview" | "standalone" }) {
  const { t } = useTranslation();
  const { user } = useAppStore();
  const [activeTab, setActiveTab] = useState<NativeAppTab>("today");
  const [goalLinkState, setGoalLinkState] = useState<{
    goalId?: string | null;
    reportTaskId?: string | null;
    onboarding?: string | null;
  }>({});
  const [reminderLinkState, setReminderLinkState] = useState<{
    reminderId?: string | null;
    goalId?: string | null;
  }>({});
  const [challengeLinkState, setChallengeLinkState] = useState<{
    focusId?: string | null;
    paymentId?: string | null;
  }>({});
  const [rewardLinkState, setRewardLinkState] = useState<{ rewardId?: string | null }>({});
  const [progressLinkState, setProgressLinkState] = useState<{ goalId?: string | null }>({});
  const missionState = useAppStore((state) => state.missionState);
  const loadMissions = useAppStore((state) => state.loadMissions);

  const tabs: Array<{
    key: Exclude<NativeAppTab, "settings" | "missions">;
    label: string;
    icon: typeof Target;
  }> = [
    { key: "today", label: t("navigation.today"), icon: Home },
    { key: "goals", label: t("navigation.goals"), icon: Target },
    { key: "challenges", label: t("navigation.challenges"), icon: Swords },
    { key: "rewards", label: t("navigation.rewards"), icon: Gift },
    { key: "progress", label: t("navigation.progress"), icon: BarChart2 },
    { key: "reminders", label: t("navigation.reminders"), icon: Bell },
  ];

  const clearTransientState = useCallback(() => {
    setGoalLinkState({});
    setReminderLinkState({});
    setChallengeLinkState({});
    setRewardLinkState({});
    setProgressLinkState({});
  }, []);

  const applyRoute = useCallback((state: ReturnType<typeof parseNativeAppRoute>) => {
    if (!state?.tab) {
      return;
    }

    setActiveTab(state.tab);
    clearTransientState();

    if (mode === "preview") {
      syncPreviewUrl(state);
    }

  if (state.tab === "goals") {
      setGoalLinkState({
        goalId: state.goalId ?? null,
        reportTaskId: state.reportTaskId ?? null,
        onboarding: state.onboarding ?? null,
      });
      return;
    }

    if (state.tab === "reminders") {
      setReminderLinkState({
        reminderId: state.reminderId ?? null,
        goalId: state.goalId ?? null,
      });
      return;
    }

    if (state.tab === "challenges") {
      setChallengeLinkState({
        focusId: state.focusId ?? null,
        paymentId: state.paymentId ?? null,
      });
      return;
    }

    if (state.tab === "rewards") {
      setRewardLinkState({ rewardId: state.rewardId ?? null });
      return;
    }

    if (state.tab === "progress") {
      setProgressLinkState({ goalId: state.goalId ?? null });
    }
  }, [clearTransientState, mode]);

  const applyLink = useCallback((url: string) => {
    applyRoute(parseNativeAppRoute(url));
  }, [applyRoute]);

  const navigationValue = useMemo(() => ({
    navigateToPath: (path: string) => {
      const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
      applyLink(`divergent://${normalizedPath}`);
    },
  }), [applyLink]);

  useEffect(() => {

    if (user) {
      void loadMissions();
    }
  }, [loadMissions, user]);

  useEffect(() => {

    void Linking.getInitialURL().then((url) => {
      if (url) {
        applyLink(url);
      }
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      applyLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, [applyLink]);

  return (
    <NativeNavigationProvider value={navigationValue}>
      <SafeAreaView style={{ flex: 1, backgroundColor: appPalette.surface.background }}>
        {!!user && <NativeAppHeader user={user} missionBadgeCount={missionState?.badgeCount ?? 0} onOpenMissions={() => setActiveTab("missions")} onOpenSettings={() => setActiveTab("settings")} />}

        <View style={{ flex: 1 }}>
          <Suspense fallback={<NativeScreenFallback />}>
            {activeTab === "today" && (
              <NativeTodayScreen
                onOpenGoal={(goalId) => {
                  setGoalLinkState({ goalId });
                  setActiveTab("goals");
                }}
              />
            )}
            {activeTab === "goals" && (
              <NativeGoalsScreen
                goalId={goalLinkState.goalId}
                reportTaskId={goalLinkState.reportTaskId}
                onboarding={goalLinkState.onboarding}
                onConsumeLinkState={() => {
                  setGoalLinkState({});
                }}
              />
            )}
            {activeTab === "reminders" && (
              <NativeRemindersScreen
                reminderId={reminderLinkState.reminderId}
                goalId={reminderLinkState.goalId}
                onConsumeLinkState={() => {
                  setReminderLinkState({});
                }}
              />
            )}
            {activeTab === "challenges" && (
              <NativeChallengesScreen
                focusId={challengeLinkState.focusId}
                paymentId={challengeLinkState.paymentId}
                onConsumeLinkState={() => {
                  setChallengeLinkState({});
                }}
              />
            )}
            {activeTab === "rewards" && (
              <NativeRewardsScreen
                rewardId={rewardLinkState.rewardId}
                onConsumeLinkState={() => {
                  setRewardLinkState({});
                }}
              />
            )}
            {activeTab === "progress" && (
              <NativeProgressScreen
                goalId={progressLinkState.goalId}
                onConsumeLinkState={() => {
                  setProgressLinkState({});
                }}
              />
            )}
            {activeTab === "settings" && <NativeSettingsScreen />}
            {activeTab === "missions" && <NativeMissionsScreen />}
          </Suspense>
        </View>

        <View
          style={{
            flexDirection: "row",
            backgroundColor: appPalette.surface.background,
            paddingHorizontal: 4,
            paddingVertical: 8,
          }}
        >
          {tabs.map((tab) => {
            const active = tab.key === activeTab;
            const Icon = tab.icon;

            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  setActiveTab(tab.key);
                }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  marginHorizontal: 4,
                  minHeight: 45,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: appPalette.brand.primary,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? appPalette.brand.primary : appPalette.surface.background,
                }}
              >
                <Icon color={active ? appPalette.brand.primaryForeground : appPalette.brand.primary} size={17} strokeWidth={2.5} />
                <Text
                  style={{
                    color: active ? appPalette.brand.primaryForeground : appPalette.brand.primary,
                    fontSize: 8,
                    fontWeight: "800",
                    fontFamily: "Montserrat",
                    textTransform: "uppercase",
                    textAlign: "center",
                    lineHeight: 8,
                    marginTop: 2,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <MissionIntroModal onStart={() => setActiveTab("missions")} />
        <MissionRewardModal />
      </SafeAreaView>
    </NativeNavigationProvider>
  );
}
