import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Animated, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { ActionChip } from "@/components/native/ActionChip";
import { SheetDragHandle, useSheetDragToClose } from "@/components/native/form-sheet/SheetChrome";
import { Calendar, Clock, Crown, Gift, Award, Star, Target, Trophy, Zap } from "@/components/native/icons";
import { categoryConfig } from "@/components/native/GoalCardParts";
import { SurfaceCard } from "@/components/native/SurfaceCard";
import { formatElapsed } from "@/shared/ai/formatElapsed";
import { useAiChatSession } from "@/shared/ai/useAiChatSession";
import { formatReminderDayLabel } from "@/shared/display/reminders";
import type { RewardIconType } from "@/shared/domain";
import { useAppStore } from "@/stores/useAppStore";
import { appPalette } from "@/theme/palette";
import type { ChatMessage, Draft, Goal, Task } from "@/types";

const rewardIconMap: Record<RewardIconType, React.ComponentType<{ size?: string | number; color?: string }>> = {
  trophy: Trophy,
  star: Star,
  gift: Gift,
  crown: Crown,
  award: Award,
  zap: Zap,
};

export function AiChatSheet({ open, onOpenChange, onDraftAdded, initialPrompt }: { open: boolean; onOpenChange: (open: boolean) => void; onDraftAdded: (goal: Goal) => void; initialPrompt?: string }) {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const { headerPanHandlers, sheetStyle } = useSheetDragToClose(open, () => onOpenChange(false));
  const { categories } = useAppStore();
  const [category, setCategory] = useState<string | null>(null);
  const {
    prompt,
    setPrompt,
    history,
    historyLoading,
    loading,
    submitting,
    error,
    streamingMessageId,
    draftPendingMessageId,
    elapsedSeconds,
    allowAutoScrollRef,
    handleGenerate,
    handleDraftAdded,
  } = useAiChatSession({ open, onDraftAdded, initialPrompt, category });

  useEffect(() => {
    if (!open || history.length === 0) {
      return;
    }

    if (!allowAutoScrollRef.current) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });

    return () => cancelAnimationFrame(frameId);
  }, [history, open, allowAutoScrollRef]);

  const handleSubmit = () => {
    Keyboard.dismiss();
    void handleGenerate();
  };

  const quickActions = [
    { label: t("ai.quick_action_capabilities"), prompt: t("ai.quick_prompt_capabilities") },
    { label: t("ai.quick_action_goal"), prompt: t("ai.quick_prompt_goal") },
    { label: t("ai.quick_action_progress"), prompt: t("ai.quick_prompt_progress") },
  ];

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={() => onOpenChange(false)}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <View style={{ flex: 1, backgroundColor: appPalette.surface.overlay, justifyContent: "flex-end" }}>
          <Animated.View style={{ maxHeight: "92%", backgroundColor: appPalette.surface.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14, ...sheetStyle }}>
            <View {...headerPanHandlers} style={{ gap: 8 }}>
              <SheetDragHandle />
              <SelectableText style={{ fontSize: 20, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>{category ? `Коуч: ${categories.find((c) => c.value === category)?.label ?? category}` : t("ai.title")}</SelectableText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} removeClippedSubviews={false} contentContainerStyle={{ gap: 8, paddingVertical: 2, alignItems: "center" }} keyboardShouldPersistTaps="handled" style={{ flexGrow: 0, maxHeight: 40 }}>
              {[{ value: null as string | null, label: "Общий" }, ...categories.map((c) => ({ value: c.value as string | null, label: c.label }))].map((opt) => {
                const active = category === opt.value;
                return (
                  <Pressable key={opt.value ?? "__general"} onPress={() => setCategory(opt.value)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: active ? appPalette.brand.primary : appPalette.semantic.borderSubtle, backgroundColor: active ? appPalette.brand.primary : appPalette.semantic.neutralSurfaceStrong }}>
                    <Text numberOfLines={1} style={{ color: active ? appPalette.semantic.textInverse : appPalette.semantic.textStrong, fontSize: 12, fontWeight: "500", fontFamily: "Montserrat" }}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => {
                if (!allowAutoScrollRef.current) {
                  return;
                }

                scrollRef.current?.scrollToEnd({ animated: true });
              }}
            >
              {historyLoading ? (
                <View style={{ minHeight: 160, alignItems: "center", justifyContent: "center" }}>
                  <ActivityIndicator size="large" color={appPalette.brand.primary} />
                </View>
              ) : history.length === 0 ? (
                <View style={{ gap: 12, paddingVertical: 12 }}>
                  <SurfaceCard gap={12} padding={16} radius={16}>
                    <View style={{ gap: 6 }}>
                      <SelectableText style={{ color: appPalette.semantic.textStrong, fontSize: 16, lineHeight: 24, fontWeight: "700", fontFamily: "Montserrat" }}>
                        {t("ai.welcome_title")}
                      </SelectableText>
                      <SelectableText style={{ color: appPalette.semantic.textMuted, fontSize: 12, lineHeight: 18, fontFamily: "Montserrat" }}>
                        {t("ai.welcome_description")}
                      </SelectableText>
                    </View>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {quickActions.map((action) => (
                        <ActionChip key={action.label} onPress={() => void handleGenerate(action.prompt)} tone="secondary" disabled={loading || submitting}>
                          {action.label}
                        </ActionChip>
                      ))}
                    </View>
                  </SurfaceCard>
                </View>
              ) : (
                history.map((message, index) => (
                  <AiChatMessageCard
                    key={`${message.id ?? message.role}-${index}`}
                    message={message}
                    messageId={message.id}
                    onDraftAdded={handleDraftAdded}
                    isDraftPending={message.id === streamingMessageId}
                    isPreparingDraft={message.id === draftPendingMessageId}
                    elapsedSeconds={message.id === streamingMessageId ? elapsedSeconds : 0}
                  />
                ))
              )}
            </ScrollView>
            <View style={{ gap: 8 }}>
              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                placeholder={t("ai.placeholder")}
                multiline
                textAlignVertical="top"
                style={{ minHeight: 96, borderWidth: 1, borderColor: appPalette.semantic.borderStrong, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: appPalette.surface.background, color: appPalette.semantic.textStrong, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}
                placeholderTextColor={appPalette.semantic.textSubtle}
              />
              {!!error && (
                <View style={{ backgroundColor: appPalette.semantic.dangerSurface, borderRadius: 12, padding: 12 }}>
                  <SelectableText style={{ color: appPalette.semantic.dangerText, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>{error}</SelectableText>
                </View>
              )}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <ActionChip onPress={() => onOpenChange(false)}>{t("common.close")}</ActionChip>
              <ActionChip onPress={handleSubmit} tone="primary" disabled={loading || !prompt.trim()}>
                {submitting ? t("ai.asking") : t("ai.ask")}
              </ActionChip>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AiChatMessageCard({ message, messageId, onDraftAdded, isDraftPending, isPreparingDraft, elapsedSeconds }: { message: ChatMessage; messageId?: string; onDraftAdded: (goal: Goal, messageId?: string) => void; isDraftPending: boolean; isPreparingDraft: boolean; elapsedSeconds: number; }) {
  const { t } = useTranslation();
  const tone = useMemo(
    () =>
      message.role === "user"
        ? { backgroundColor: appPalette.semantic.infoSurface, textColor: appPalette.semantic.infoTextStrong }
        : { backgroundColor: appPalette.ui.inputBackground, textColor: appPalette.semantic.text },
    [message.role],
  );
  const messageContent = message.content || (isDraftPending ? t("ai.thinking") : "");
  const showThinkingState = message.role === "assistant" && isDraftPending && !message.content;

  return (
    <View style={{ gap: 8 }}>
      <View style={{ backgroundColor: tone.backgroundColor, borderRadius: 14, padding: 12 }}>
        {showThinkingState ? (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <SelectableText style={{ flex: 1, color: tone.textColor, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>{messageContent}</SelectableText>
            <SelectableText style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>
              {formatElapsed(elapsedSeconds)}
            </SelectableText>
          </View>
        ) : (
          <SelectableText style={{ color: tone.textColor, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>{messageContent}</SelectableText>
        )}
      </View>
      {message.role === "assistant" && message.goalDraft && <GoalDraftCard draft={message.goalDraft} messageId={message.id ?? messageId} isDraftAdded={message.isDraftAdded} onAdd={onDraftAdded} />}
      {message.role === "assistant" && !message.goalDraft && isPreparingDraft && (
        <View style={{ borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: appPalette.brand.primary, backgroundColor: appPalette.semantic.infoSurface }}>
          <SelectableText style={{ color: appPalette.semantic.infoTextStrong, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>
            {t("ai.preparing_draft")}
          </SelectableText>
        </View>
      )}
    </View>
  );
}

function GoalDraftCard({ draft, isDraftAdded, messageId, onAdd }: { draft: Draft; isDraftAdded: boolean; messageId?: string; onAdd: (goal: Goal, messageId?: string) => void; }) {
  const { t } = useTranslation();
  const { categories, addDraft } = useAppStore();
  const draftGoal = draft.goal as Draft["goal"] & {
    goalType?: "TASK" | "PROGRESS";
    currentValue?: number | null;
    targetValue?: number | null;
  };
  const categoryLabel = categories.find((item) => item.value === draft.goal.category)?.label ?? draft.goal.category;
  const categoryPalette = categoryConfig[draft.goal.category] ?? categoryConfig.custom;
  const CategoryIcon = categoryPalette.icon;
  const RewardDraftIcon = rewardIconMap[(draft.reward?.icon as RewardIconType | undefined) ?? "trophy"] ?? Trophy;
  const isProgressGoal = draftGoal.goalType === "PROGRESS";
  const periodLabels: Record<string, string> = {
    DAILY: t("goal_period.daily"),
    WEEKLY: t("goal_period.weekly"),
    MONTHLY: t("goal_period.monthly"),
  };

  const handleAdd = async () => {
    if (!messageId) return;
    try {
      const goal = await addDraft(messageId);
      if (goal) onAdd(goal, messageId);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SurfaceCard gap={12}>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0 }}>
          <Target size={18} color={appPalette.brand.primary} />
          <SelectableText style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat", lineHeight: 24 }}>{draft.goal.title}</SelectableText>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <View style={{ alignSelf: "flex-start", maxWidth: "100%", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1, backgroundColor: categoryPalette.backgroundColor, borderColor: categoryPalette.borderColor, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <CategoryIcon size={12} color={categoryPalette.textColor} />
            <SelectableText style={{ color: categoryPalette.textColor, fontWeight: "600", fontSize: 12, fontFamily: "Montserrat", lineHeight: 18, flexShrink: 1 }}>{categoryLabel}</SelectableText>
          </View>
          {draftGoal.goalType && (
            <MetaBadge>
              {isProgressGoal ? t("goals.dialog.goal_type_progress") : t("goals.dialog.goal_type_tasks")}
            </MetaBadge>
          )}
          {draft.goal.goalPeriod !== "NONE" && (
            <MetaBadge icon={<Clock size={12} color={appPalette.semantic.infoText} />}>
              {periodLabels[draft.goal.goalPeriod] ?? draft.goal.goalPeriod}
            </MetaBadge>
          )}
          {!!draft.goal.dueDate && (
            <MetaBadge icon={<Calendar size={12} color={appPalette.semantic.infoText} />}>
              {draft.goal.dueDate}
            </MetaBadge>
          )}
        </View>
        {!!draft.goal.description && <SelectableText style={{ color: appPalette.semantic.text, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>{draft.goal.description}</SelectableText>}
        {isProgressGoal && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <MetaBadge>{t("goals.dialog.target_value")}: {draftGoal.targetValue ?? 0}</MetaBadge>
          </View>
        )}
      </View>
      {!isProgressGoal && draft.tasks?.length > 0 && (
        <View style={{ gap: 6 }}>
          <SelectableText style={{ fontWeight: "600", color: appPalette.semantic.textStrong, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>{t("ai.tasks")}</SelectableText>
          {draft.tasks.map((task, index) => <TaskPreview key={`${task.title}-${index}`} task={task} depth={0} />)}
        </View>
      )}
      {draft.reminders?.length > 0 && (
        <View style={{ gap: 6 }}>
          <SelectableText style={{ fontWeight: "600", color: appPalette.semantic.textStrong, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>{t("ai.reminders")}</SelectableText>
          {draft.reminders.map((reminder, index) => (
            <View key={`${reminder.title}-${index}`} style={{ backgroundColor: appPalette.ui.inputBackground, borderRadius: 12, padding: 10, gap: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Clock size={14} color={appPalette.brand.primary} />
                <SelectableText style={{ color: appPalette.semantic.textStrong, fontWeight: "600", fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>{reminder.title}</SelectableText>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <MetaBadge icon={<Clock size={12} color={appPalette.semantic.infoText} />}>{reminder.time}</MetaBadge>
                {reminder.daysOfWeek.map((day) => <MetaBadge key={day}>{formatReminderDayLabel(day, t)}</MetaBadge>)}
                {reminder.daysOfMonth.map((day) => <MetaBadge key={day}>{String(day)}</MetaBadge>)}
              </View>
            </View>
          ))}
        </View>
      )}
      {!!draft.reward?.title && (
        <View style={{ gap: 6 }}>
          <SelectableText style={{ fontWeight: "600", color: appPalette.semantic.textStrong, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>{t("ai.reward")}</SelectableText>
          <View style={{ backgroundColor: appPalette.ui.inputBackground, borderRadius: 12, padding: 10, gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 28, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: appPalette.semantic.warningSurface }}>
                <RewardDraftIcon size={16} color={appPalette.semantic.warningText} />
              </View>
              <SelectableText style={{ color: appPalette.semantic.textStrong, fontWeight: "600", fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>{draft.reward.title}</SelectableText>
            </View>
            {!!draft.reward.description && <SelectableText style={{ color: appPalette.semantic.text, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>{draft.reward.description}</SelectableText>}
            {draft.reward.xpRequires != null && <MetaBadge>{t("ai.xp_required", { xp: draft.reward.xpRequires })}</MetaBadge>}
          </View>
        </View>
      )}
      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <ActionChip onPress={() => void handleAdd()} tone="primary">
          {isDraftAdded ? t("common.added") : t("common.add")}
        </ActionChip>
      </View>
    </SurfaceCard>
  );
}

function TaskPreview({ task, depth }: { task: Task; depth: number }) {
  return (
    <View style={{ gap: 6, marginLeft: depth * 12, paddingLeft: depth > 0 ? 10 : 0, borderLeftWidth: depth > 0 ? 1 : 0, borderLeftColor: appPalette.semantic.borderSubtle }}>
      <View style={{ backgroundColor: appPalette.ui.inputBackground, borderRadius: 12, padding: 10, gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <SelectableText style={{ flex: 1, color: appPalette.semantic.textStrong, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>{task.title}</SelectableText>
          {task.xpReward != null && <MetaBadge>+{task.xpReward} XP</MetaBadge>}
        </View>
      </View>
      {task.subtasks?.map((subtask, index) => <TaskPreview key={`${subtask.title}-${index}`} task={subtask} depth={depth + 1} />)}
    </View>
  );
}

function MetaBadge({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: appPalette.semantic.infoSurfaceStrong, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
      {icon ? <View style={{ width: 12, height: 12, alignItems: "center", justifyContent: "center" }}>{icon}</View> : null}
      <SelectableText style={{ color: appPalette.semantic.infoText, fontWeight: "600", fontSize: 12, fontFamily: "Montserrat", lineHeight: 18 }}>{children}</SelectableText>
    </View>
  );
}

function SelectableText({ children, style }: { children: React.ReactNode; style?: React.ComponentProps<typeof TextInput>["style"] }) {
    const textValue = flattenText(children);

    if (Platform.OS === "ios" || Platform.OS === "web") {
      return (
        <Text selectable style={style}>
          {textValue}
        </Text>
      );
    }

    return (
      <TextInput
        value={textValue}
      editable={false}
      multiline
      scrollEnabled={false}
      contextMenuHidden={false}
      showSoftInputOnFocus={false}
      selectionColor={appPalette.brand.primary}
      textAlignVertical="top"
      style={[
        {
          margin: 0,
          minHeight: 0,
          borderWidth: 0,
          backgroundColor: "transparent",
          padding: 0,
          paddingTop: 0,
          paddingBottom: 0,
          paddingVertical: 0,
          includeFontPadding: false,
        },
        style,
      ]}
    />
  );
}

function flattenText(children: React.ReactNode): string {
  if (children == null || typeof children === "boolean") {
    return "";
  }

  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map((child) => flattenText(child)).join("");
  }

  return "";
}
