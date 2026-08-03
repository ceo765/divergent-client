import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, TextInput, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";

import { useNativeNavigation } from "@/app/native/NativeNavigation";
import { buildChallengesPath, buildRewardsPath } from "@/app/routes";
import {
  AlarmClock,
  BarChart2,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Edit,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Palette,
  Rocket,
  Swords,
  Target,
} from "@/components/native/icons";
import { getSetHistory } from "@/shared/api/client";
import { useAppStore } from "@/stores/useAppStore";
import { formatGoalDate } from "@/shared/display/goals";
import { isTaskCompletedThisPeriod, sumCompletedTaskXp } from "@/shared/screens/goals/model";
import type { CategoryType } from "@/shared/domain";
import { appPalette } from "@/theme/palette";
import type { Goal, GoalPeriod, Reward, Task } from "@/types";

export const categoryConfig: Record<
  CategoryType,
  {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    icon: React.ComponentType<{ size?: string | number; color?: string }>;
  }
> = {
  work: { backgroundColor: appPalette.categories.work.background, textColor: appPalette.categories.work.text, borderColor: appPalette.categories.work.border, icon: Briefcase },
  health: { backgroundColor: appPalette.categories.health.background, textColor: appPalette.categories.health.text, borderColor: appPalette.categories.health.border, icon: Heart },
  learning: { backgroundColor: appPalette.categories.learning.background, textColor: appPalette.categories.learning.text, borderColor: appPalette.categories.learning.border, icon: GraduationCap },
  fitness: { backgroundColor: appPalette.categories.fitness.background, textColor: appPalette.categories.fitness.text, borderColor: appPalette.categories.fitness.border, icon: Dumbbell },
  creative: { backgroundColor: appPalette.categories.creative.background, textColor: appPalette.categories.creative.text, borderColor: appPalette.categories.creative.border, icon: Palette },
  personal: { backgroundColor: appPalette.categories.personal.background, textColor: appPalette.categories.personal.text, borderColor: appPalette.categories.personal.border, icon: Home },
  custom: { backgroundColor: appPalette.categories.custom.background, textColor: appPalette.categories.custom.text, borderColor: appPalette.categories.custom.border, icon: Rocket },
};

function SmallPill({ children, tone = "neutral", icon, onPress }: { children: string; tone?: "neutral" | "success" | "warning" | "danger"; icon?: React.ReactNode; onPress?: () => void }) {
  const palette = {
    neutral: { backgroundColor: appPalette.semantic.neutralSurface, color: appPalette.semantic.neutralText },
    success: { backgroundColor: appPalette.semantic.successStrong, color: appPalette.semantic.textInverse },
    warning: { backgroundColor: appPalette.semantic.warningStrong, color: appPalette.semantic.textInverse },
    danger: { backgroundColor: appPalette.semantic.dangerStrong, color: appPalette.semantic.textInverse },
  }[tone];

  const content = (
    <View style={{ alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: palette.backgroundColor, flexDirection: "row", alignItems: "center", gap: 4 }}>
      {icon ? <View style={{ width: 12, height: 12, flexShrink: 0, alignItems: "center", justifyContent: "center" }}>{icon}</View> : null}
      <Text style={{ color: palette.color, fontWeight: "500", fontSize: 12, lineHeight: 18, fontFamily: "Montserrat", flexShrink: 1 }}>{children}</Text>
    </View>
  );

  if (!onPress) return content;
  return <Pressable onPress={onPress} hitSlop={6}>{content}</Pressable>;
}

function SmallAction({ icon, onPress }: { icon: React.ReactNode; onPress?: () => void }) {
  if (!onPress) return null;
  return <Pressable onPress={onPress} hitSlop={8} style={{ width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" }}>{icon}</Pressable>;
}

function WorkoutSetRow({ task, goalId, goalPeriod, onTaskToggle, disabled }: { task: Task; goalId: string; goalPeriod: GoalPeriod; onTaskToggle: (goalId: string, taskId: string, setLog?: { weight?: number | null; reps?: number | null }) => Promise<void>; disabled: boolean }) {
  const completed = isTaskCompletedThisPeriod(task, goalPeriod);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [last, setLast] = useState<{ weight: number | null; reps: number | null } | null>(null);

  useEffect(() => {
    let alive = true;
    getSetHistory(task.id)
      .then((h) => {
        if (!alive) return;
        setLast(h.last);
        if (!completed && h.last) {
          if (h.last.weight != null) setWeight(String(h.last.weight));
          if (h.last.reps != null) setReps(String(h.last.reps));
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [task.id, completed]);

  const parse = (v: string, int = false) => {
    const s = v.trim().replace(",", ".");
    if (s === "") return null;
    const n = int ? parseInt(s, 10) : Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const onToggle = () => {
    if (disabled) return;
    void onTaskToggle(goalId, task.id, { weight: parse(weight), reps: parse(reps, true) });
  };

  const inputStyle = { flex: 1, minWidth: 0, height: 34, borderWidth: 1, borderColor: appPalette.semantic.borderSubtle, borderRadius: 8, backgroundColor: appPalette.surface.background, paddingHorizontal: 8, color: appPalette.semantic.textStrong, fontSize: 13, textAlign: "center" as const, fontFamily: "Montserrat" };

  return (
    <View style={{ borderWidth: 1, borderColor: completed ? appPalette.brand.primary : appPalette.semantic.borderSubtle, borderRadius: 14, backgroundColor: appPalette.semantic.neutralSurfaceStrong, paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable onPress={onToggle} hitSlop={8}>
          <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: completed ? appPalette.brand.primary : appPalette.semantic.textSubtle, backgroundColor: completed ? appPalette.brand.primary : appPalette.surface.background, alignItems: "center", justifyContent: "center" }}>
            {completed && <Text style={{ color: appPalette.semantic.textInverse, fontSize: 13, fontWeight: "700", fontFamily: "Montserrat", lineHeight: 18 }}>✓</Text>}
          </View>
        </Pressable>
        <Text style={{ flex: 1, color: appPalette.semantic.textStrong, fontSize: 12, fontWeight: "400", lineHeight: 16, fontFamily: "Montserrat" }}>{task.title}</Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="кг" placeholderTextColor={appPalette.semantic.textSubtle} editable={!disabled} style={inputStyle} />
          <Text style={{ color: appPalette.semantic.textSubtle, fontSize: 10, textAlign: "center", fontFamily: "Montserrat" }}>{last?.weight != null ? `пр. раз ${last.weight}` : "вес, кг"}</Text>
        </View>
        <Text style={{ color: appPalette.semantic.textSubtle, fontSize: 14, marginTop: 8, fontFamily: "Montserrat" }}>×</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <TextInput value={reps} onChangeText={setReps} keyboardType="number-pad" placeholder="повт" placeholderTextColor={appPalette.semantic.textSubtle} editable={!disabled} style={inputStyle} />
          <Text style={{ color: appPalette.semantic.textSubtle, fontSize: 10, textAlign: "center", fontFamily: "Montserrat" }}>{last?.reps != null ? `пр. раз ${last.reps}` : "повторы"}</Text>
        </View>
      </View>
    </View>
  );
}

function TaskTree({ tasks, goalPeriod, onTaskToggle, goalId, level = 0, disabled = false, isWorkout = false }: { tasks: Task[]; goalPeriod: GoalPeriod; onTaskToggle: (goalId: string, taskId: string, setLog?: { weight?: number | null; reps?: number | null }) => Promise<void>; goalId: string; level?: number; disabled?: boolean; isWorkout?: boolean }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <View style={{ gap: 8 }}>
      {tasks.map((task) => {
        const completed = isTaskCompletedThisPeriod(task, goalPeriod);
        const hasSubtasks = Boolean(task.subtasks?.length);
        const isOpen = Boolean(expanded[task.id]);
        const isWorkoutSet = isWorkout && !hasSubtasks;

        return (
          <View key={task.id} style={{ gap: 8, marginLeft: level * 12 }}>
            {isWorkoutSet ? (
              <WorkoutSetRow task={task} goalId={goalId} goalPeriod={goalPeriod} onTaskToggle={onTaskToggle} disabled={disabled} />
            ) : (
            <View style={{ borderWidth: 1, borderColor: appPalette.semantic.borderSubtle, borderRadius: 14, backgroundColor: appPalette.semantic.neutralSurfaceStrong, paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                {hasSubtasks ? (
                  <Pressable onPress={() => setExpanded((current) => ({ ...current, [task.id]: !current[task.id] }))}>
                    {isOpen ? <ChevronUp size={16} color={appPalette.semantic.textMuted} /> : <ChevronDown size={16} color={appPalette.semantic.textMuted} />}
                  </Pressable>
                ) : null}

                <Pressable onPress={() => { if (!disabled) void onTaskToggle(goalId, task.id); }} style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: completed ? appPalette.brand.primary : appPalette.semantic.textSubtle, backgroundColor: completed ? appPalette.brand.primary : appPalette.surface.background, alignItems: "center", justifyContent: "center" }}>
                    {completed && <Text style={{ color: appPalette.semantic.textInverse, fontSize: 12, fontWeight: "700", fontFamily: "Montserrat", lineHeight: 18 }}>✓</Text>}
                  </View>

                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: completed ? appPalette.semantic.textMuted : appPalette.semantic.textStrong, textDecorationLine: completed ? "line-through" : "none", fontSize: 12, fontWeight: "400", lineHeight: 18, fontFamily: "Montserrat" }}>{task.title}</Text>
                    {!!task.dueDate && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Calendar size={12} color={appPalette.semantic.textSubtle} />
                        <Text style={{ color: appPalette.semantic.textSubtle, fontSize: 12, fontWeight: "400", lineHeight: 18, fontFamily: "Montserrat" }}>{task.dueDate}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>

                {typeof task.xpReward === "number" && task.xpReward > 0 && (
                  <View style={{ backgroundColor: appPalette.semantic.borderSubtle, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ color: appPalette.semantic.text, fontWeight: "500", fontSize: 12, lineHeight: 18, fontFamily: "Montserrat" }}>+{task.xpReward} XP</Text>
                  </View>
                )}
              </View>
            </View>
            )}

            {hasSubtasks && isOpen && <TaskTree tasks={task.subtasks ?? []} goalPeriod={goalPeriod} onTaskToggle={onTaskToggle} goalId={goalId} level={level + 1} disabled={disabled} isWorkout={isWorkout} />}
          </View>
        );
      })}
    </View>
  );
}

export function GoalCardHeader({ goal, categoryLabel, statusLabel }: { goal: Goal; categoryLabel: string; statusLabel?: string | null }) {
  const { t } = useTranslation();
  const categoryPalette = categoryConfig[(goal.category as CategoryType) || "custom"] ?? categoryConfig.custom;
  const CategoryIcon = categoryPalette.icon;
  const completedLabel = t("goals.task_status_completed");

  return (
    <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0 }}>
        <Target size={20} color={appPalette.brand.primary} />
        <Text style={{ fontSize: 12, fontWeight: "500", color: appPalette.semantic.textStrong, flex: 1, minWidth: 0, fontFamily: "Montserrat", lineHeight: 12 }} numberOfLines={2}>{goal.title}</Text>
      </View>
      <View style={{ alignSelf: "flex-start", maxWidth: "100%", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, backgroundColor: categoryPalette.backgroundColor, borderColor: categoryPalette.borderColor, flexDirection: "row", alignItems: "center", gap: 6 }}>
        <CategoryIcon size={12} color={categoryPalette.textColor} />
        <Text style={{ color: categoryPalette.textColor, fontWeight: "500", fontSize: 12, lineHeight: 18, fontFamily: "Montserrat", flexShrink: 1 }}>{categoryLabel}</Text>
      </View>
      {!!goal.description && <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontWeight: "400", lineHeight: 18, fontFamily: "Montserrat", flexShrink: 1, minWidth: 0 }} numberOfLines={3}>{goal.description}</Text>}
      {!!statusLabel && <SmallPill tone={statusLabel === completedLabel ? "success" : "danger"}>{statusLabel}</SmallPill>}
    </View>
  );
}

export function GoalCardActions({ goal, onEdit, onAddReminder, onGoToProgress }: { goal: Goal; onEdit?: (id: string) => void; onAddReminder?: (id: string) => void; onGoToProgress?: (id: string) => void }) {
  return (
    <View>
      {!goal.challenge && !!onEdit && <SmallAction icon={<Edit size={14} color={appPalette.semantic.textMuted} />} onPress={() => onEdit(goal.id)} />}
      {!!onAddReminder && <SmallAction icon={<AlarmClock size={14} color={appPalette.semantic.textMuted} />} onPress={() => onAddReminder(goal.id)} />}
      {!!onGoToProgress && <SmallAction icon={<BarChart2 size={14} color={appPalette.semantic.textMuted} />} onPress={() => onGoToProgress(goal.id)} />}
    </View>
  );
}

export function GoalProgressSection({ goal, progress, completedTasks, totalTasks }: { goal: Goal; progress: number; completedTasks: number; totalTasks: number }) {
  const { t } = useTranslation();
  const completedTaskXp = sumCompletedTaskXp(goal.tasks, goal.goalPeriod);
  const isXpBasedTaskGoal = goal.goalType === "TASK" && goal.taskXpTarget != null;

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontWeight: "400", lineHeight: 18, fontFamily: "Montserrat" }}>{t("goals.progress")}</Text>
        {isXpBasedTaskGoal ? (
          <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontWeight: "400", lineHeight: 18, fontFamily: "Montserrat" }}>{completedTaskXp} / {goal.taskXpTarget} XP</Text>
        ) : goal.goalType === "TASK" ? (
          <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontWeight: "400", lineHeight: 18, fontFamily: "Montserrat" }}>{completedTasks} / {totalTasks} {t("goals.tasks_count")}</Text>
        ) : (
          <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontWeight: "400", lineHeight: 18, fontFamily: "Montserrat" }}>{goal.currentValue ?? 0} / {goal.targetValue ?? 0}</Text>
        )}
      </View>
      <View style={{ height: 8, backgroundColor: appPalette.semantic.borderSubtle, borderRadius: 999, overflow: "hidden" }}>
        <View style={{ width: `${progress}%`, height: "100%", backgroundColor: appPalette.brand.primary }} />
      </View>
    </View>
  );
}

export function GoalNumericProgressInput({ progressDelta, onChangeProgressDelta, onAddProgress }: { progressDelta: string; onChangeProgressDelta: (value: string) => void; onAddProgress: () => void }) {
  const { t } = useTranslation();

  return (
    <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
      <TextInput
        value={progressDelta}
        onChangeText={onChangeProgressDelta}
        placeholder={t("goals.add_value_placeholder")}
        keyboardType="numeric"
        style={{
          flex: 1,
          minHeight: 40,
          borderWidth: 1,
          borderColor: appPalette.semantic.borderStrong,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: appPalette.semantic.textInverse,
          color: appPalette.semantic.textStrong,
          fontFamily: "Montserrat",
          fontSize: 12,
          lineHeight: 18,
        }}
        placeholderTextColor={appPalette.semantic.textSubtle}
      />
      <Pressable
        onPress={onAddProgress}
        style={{
          minHeight: 40,
          minWidth: 40,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: appPalette.semantic.infoBorder,
          backgroundColor: appPalette.semantic.infoSurface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: appPalette.semantic.infoText, fontWeight: "500", fontSize: 16, lineHeight: 18, fontFamily: "Montserrat" }}>+</Text>
      </Pressable>
    </View>
  );
}

export function GoalTaskSection({ goal, isOpen, onToggleOpen, onTaskToggle, disabledTasks }: { goal: Goal; isOpen: boolean; onToggleOpen: () => void; onTaskToggle: (goalId: string, taskId: string, setLog?: { weight?: number | null; reps?: number | null }) => Promise<void>; disabledTasks: boolean }) {
  const { t } = useTranslation();

  return (
    <View style={{ gap: 10 }}>
      <Pressable onPress={onToggleOpen} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: appPalette.semantic.textStrong, fontSize: 12, fontWeight: "500", lineHeight: 18, fontFamily: "Montserrat" }}>{t("goals.tasks")}</Text>
        {isOpen ? <ChevronUp size={18} color={appPalette.semantic.textMuted} /> : <ChevronDown size={18} color={appPalette.semantic.textMuted} />}
      </Pressable>
      {isOpen && <TaskTree tasks={goal.tasks ?? []} goalPeriod={goal.goalPeriod} onTaskToggle={onTaskToggle} goalId={goal.id} disabled={disabledTasks} isWorkout={Boolean(goal.isWorkout)} />}
    </View>
  );
}

export function GoalFooter({ goal, reward, cycleLabel }: { goal: Goal; reward?: Reward | null; cycleLabel: string | null }) {
  const { navigateToPath } = useNativeNavigation();

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: appPalette.semantic.borderSubtle, paddingTop: 8, flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
        {!!cycleLabel && <SmallPill>{cycleLabel}</SmallPill>}
        {!!goal.challenge && (
          <SmallPill tone="warning" icon={<Swords size={12} color={appPalette.semantic.textInverse} />} onPress={() => navigateToPath(buildChallengesPath({ id: goal.challenge?.id }))}>
            {goal.challenge.title}
          </SmallPill>
        )}
        {!!goal.dueDate && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Calendar size={14} color={appPalette.semantic.textSubtle} />
            <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontWeight: "400", lineHeight: 18, fontFamily: "Montserrat" }}>{formatGoalDate(goal.dueDate)}</Text>
          </View>
        )}
      </View>
      {!!reward && (
        <View style={{ maxWidth: "50%", alignItems: "flex-end" }}>
          <SmallPill tone="success" icon={<Gift size={12} color={appPalette.semantic.textInverse} />} onPress={() => { if (!reward.id) return; navigateToPath(buildRewardsPath({ id: reward.id })); }}>
            {reward.title}
          </SmallPill>
        </View>
      )}
    </View>
  );
}

function fmtFinished(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`;
}

// Книги/фильмы из Коллекций, привязанные к этой цели (напр. книга к цели «Чтение»).
// Это ЗАПИСЬ на цели («читается такая-то книга»), а не задача.
export function GoalLinkedItems({ goalId }: { goalId: string }) {
  const collections = useAppStore((s) => s.collections);
  const loadCollections = useAppStore((s) => s.loadCollections);

  useEffect(() => {
    if (collections.length === 0) void loadCollections();
  }, [collections.length, loadCollections]);

  const items = collections.filter((c) => c.goalId === goalId);
  if (items.length === 0) return null;

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 12, fontWeight: "600", color: appPalette.semantic.textMuted, fontFamily: "Montserrat" }}>Из коллекций</Text>
      {items.map((it) => {
        const done = it.status === "done";
        return (
          <View key={it.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: appPalette.semantic.neutralSurfaceStrong, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: done ? appPalette.semantic.successStrong : appPalette.brand.primary }} />
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>{it.title}</Text>
            <Text style={{ fontSize: 11, color: appPalette.semantic.textSubtle, fontFamily: "Montserrat" }}>
              {done ? (it.finishedAt ? `прочитано ${fmtFinished(it.finishedAt)}` : "прочитано") : "читаю"}
            </Text>
          </View>
        );
      })}
    </View>
  );
}


