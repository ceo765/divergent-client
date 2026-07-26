import { Component, type ErrorInfo, type ReactNode, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";
import { useTranslation } from "react-i18next";

import { Zap } from "@/components/native/icons";
import { NativePeriodCalendar } from "@/components/native/NativePeriodCalendar";
import { NativeScreenErrorBoundary } from "@/components/native/NativeScreenErrorBoundary";
import { SurfaceCard } from "@/components/native/SurfaceCard";
import {
  ProgressGoalPickerModal,
  ProgressHeader,
  ProgressStreakSection,
  ProgressWeeklyXpSection,
} from "@/components/native/progress-screen/ProgressSections";
import { ProgressStatCard } from "@/components/native/progress-screen/ProgressPrimitives";
import { ProgressOverviewSection } from "@/components/native/progress-screen/ProgressOverviewSection";
import { useProgressScreen } from "@/shared/screens/progress/useProgressScreen";
import { useProgressOverview } from "@/shared/screens/progress/useProgressOverview";
import { useHealth } from "@/shared/health/useHealth";
import { getStreakWindowTranslationKey } from "@/shared/display/streak";
import { useAppStore } from "@/stores/useAppStore";
import { appPalette } from "@/theme/palette";

type SectionBoundaryProps = {
  section: string;
  diagnostics: Record<string, unknown>;
  children: ReactNode;
};

type SectionBoundaryState = {
  hasError: boolean;
};

class ProgressSectionBoundary extends Component<SectionBoundaryProps, SectionBoundaryState> {
  state: SectionBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Native progress section render failed", {
      section: this.props.section,
      error,
      componentStack: errorInfo.componentStack,
      diagnostics: this.props.diagnostics,
    });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return null;
  }
}

function ProgressGoalErrorCard({
  title,
  description,
  actionLabel,
  onPress,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onPress: () => void;
}) {
  return (
    <SurfaceCard gap={12} padding={16} radius={12}>
      <View style={{ gap: 4 }}>
        <Text style={{ color: appPalette.semantic.textStrong, fontSize: 14, fontWeight: "500", lineHeight: 20, fontFamily: "Montserrat" }}>{title}</Text>
        <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontWeight: "400", lineHeight: 18, fontFamily: "Montserrat" }}>{description}</Text>
      </View>
      <Pressable
        onPress={onPress}
        style={{
          alignSelf: "flex-start",
          borderRadius: 10,
          borderWidth: 1,
          borderColor: appPalette.semantic.infoBorder,
          backgroundColor: appPalette.semantic.infoSurface,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <Text style={{ color: appPalette.semantic.infoText, fontSize: 12, fontWeight: "500", lineHeight: 18, fontFamily: "Montserrat" }}>{actionLabel}</Text>
      </Pressable>
    </SurfaceCard>
  );
}

function NativeProgressScreenContent(props: { goalId?: string | null; onConsumeLinkState?: () => void }) {
  const { t, i18n } = useTranslation();
  const [goalId, setGoalId] = useState<string | null>(props.goalId || null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const {
    goals,
    selectedGoal,
    xp,
    activity,
    loadingActivity,
    xpError,
    activityError,
    weeklyXpData,
    activityView,
    retryGoalMetrics,
  } = useProgressScreen(goalId);

  const showOverview = !selectedGoal;
  const categories = useAppStore((state) => state.categories);
  const { overview, loading: overviewLoading } = useProgressOverview(showOverview);
  const health = useHealth(showOverview);

  useEffect(() => {
    if (props.goalId === undefined) return;
    setGoalId(props.goalId || null);
    props.onConsumeLinkState?.();
  }, [props.goalId, props.onConsumeLinkState]);

  const streakMeta = useMemo(
    () =>
      !activity
        ? null
        : {
            current: activityView.currentStreak,
            longest: activityView.longestStreak,
            items: activityView.streakItems,
          },
    [activity, activityView]
  );
  const streakWindowLabel = t(getStreakWindowTranslationKey(selectedGoal?.goalPeriod));
  const baseDiagnostics = useMemo(
    () => ({
      goalId,
      selectedGoalId: selectedGoal?.id ?? null,
      selectedGoalType: selectedGoal?.goalType ?? null,
      selectedGoalPeriod: selectedGoal?.goalPeriod ?? null,
      selectedGoalTaskCount: selectedGoal?.tasks?.length ?? 0,
      hasActivity: Boolean(activity),
      activityPoints: activity?.data?.length ?? 0,
      currentStreak: activityView.currentStreak,
      longestStreak: activityView.longestStreak,
      streakDaysCount: activityView.streakItems.length,
      weeklyXpBars: weeklyXpData.length,
      loadingActivity,
      xpError,
      activityError,
    }),
    [activity, activityError, activityView.streakItems.length, goalId, loadingActivity, selectedGoal, weeklyXpData.length, xpError]
  );
  const selectedLabel = selectedGoal?.title || t("progress.all_goals");
  const progressLoadErrorDescription = i18n.language?.startsWith("ru")
    ? "Не удалось загрузить прогресс по этой цели. Попробуй повторить запрос ещё раз."
    : "Couldn't load progress for this goal. Try requesting it again.";
  const retryLabel = i18n.language?.startsWith("ru") ? "Повторить" : "Retry";
  const showTaskGoalError = !!selectedGoal && selectedGoal.goalType === "TASK" && (xpError || activityError);

  return (
    <View style={{ flex: 1, backgroundColor: appPalette.surface.background }}>
      <ProgressHeader title={t("progress.title")} selectedLabel={selectedLabel} onOpenPicker={() => setPickerOpen(true)} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 8, gap: 8 }}>
        <View style={{ gap: 8 }}>
          {selectedGoal && <ProgressStatCard title={t("progress.goal_xp")} value={xp} description={t("progress.goal_xp_description")} icon={<Zap size={20} color={appPalette.semantic.textMuted} />} />}
        </View>

        {showOverview && (
          <ProgressSectionBoundary section="ProgressOverviewSection" diagnostics={{ ...baseDiagnostics, hasOverview: Boolean(overview) }}>
            <ProgressOverviewSection
              overview={overview}
              loading={overviewLoading}
              health={health}
              onConnectHealth={() => void health.connect()}
              categories={categories}
            />
          </ProgressSectionBoundary>
        )}

        {selectedGoal && selectedGoal.goalType === "TASK" && (loadingActivity || activity) && (
          <ProgressSectionBoundary
            section="NativePeriodCalendar"
            diagnostics={{
              ...baseDiagnostics,
              renderedActivityPoints: activity?.data.length ?? 0,
            }}
          >
            <NativePeriodCalendar
              goal={selectedGoal}
              dateStatusMap={activityView.dateStatusMap}
              loading={loadingActivity}
            />
          </ProgressSectionBoundary>
        )}

        {showTaskGoalError && (
          <ProgressGoalErrorCard
            title={t("progress.activity_widget_title")}
            description={progressLoadErrorDescription}
            actionLabel={retryLabel}
            onPress={retryGoalMetrics}
          />
        )}

        {selectedGoal && selectedGoal.goalType === "TASK" && streakMeta && (
          <ProgressSectionBoundary
              section="ProgressStreakSection"
              diagnostics={{
                ...baseDiagnostics,
                renderedStreakDays: streakMeta.items.length,
              }}
            >
            <ProgressStreakSection current={streakMeta.current} longest={streakMeta.longest} goalPeriod={selectedGoal.goalPeriod} streakItems={streakMeta.items} windowLabel={streakWindowLabel} />
          </ProgressSectionBoundary>
        )}

        {selectedGoal && selectedGoal.goalType === "TASK" && activity && (
          <ProgressSectionBoundary
            section="ProgressWeeklyXpSection"
            diagnostics={{
              ...baseDiagnostics,
              renderedWeeklyXpBars: weeklyXpData.length,
              maxWeeklyXpValue: Math.max(...weeklyXpData.map((item) => item.value), 0),
            }}
          >
            <ProgressWeeklyXpSection data={weeklyXpData} />
          </ProgressSectionBoundary>
        )}

      </ScrollView>

      <ProgressGoalPickerModal
        open={pickerOpen}
        goals={goals}
        goalId={goalId}
        onClose={() => setPickerOpen(false)}
        onSelectGoal={(nextGoalId) => {
          setGoalId(nextGoalId);
          setPickerOpen(false);
        }}
      />
    </View>
  );
}

export default function NativeProgressScreenView(props: { goalId?: string | null; onConsumeLinkState?: () => void }) {
  const { t, i18n } = useTranslation();
  const [boundaryKey, setBoundaryKey] = useState(0);
  const fallbackMessage = i18n.language?.startsWith("ru")
    ? "Экран прогресса временно не удалось отрисовать. Сбросим выбор цели и откроем безопасное состояние."
    : "The progress screen couldn't be rendered right now. We'll reset the selected goal and reopen a safe state.";

  return (
    <NativeScreenErrorBoundary
      key={boundaryKey}
      title={t("progress.title")}
      message={fallbackMessage}
      resetLabel={t("progress.all_goals")}
      onReset={() => {
        setBoundaryKey((value) => value + 1);
      }}
    >
      <NativeProgressScreenContent {...props} />
    </NativeScreenErrorBoundary>
  );
}
