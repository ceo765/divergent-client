import { useMemo, useState } from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";
import { useTranslation } from "react-i18next";

import { ActionChip } from "@/components/native/ActionChip";
import { FieldInput } from "@/components/native/FieldInput";
import { Calendar, ChevronDown, ChevronUp, Plus, X } from "@/components/native/icons";
import { SectionTabs } from "@/components/native/SectionTabs";
import { formHelperStyle, formSectionLabelStyle } from "@/components/native/form-sheet/Layout";
import { appPalette } from "@/theme/palette";
import type { CategoryOption, GoalPeriod, GoalType, Reward, Task } from "@/types";

const ONBOARDING_REWARD_SOURCE_KEY = "onboarding_completion";

function formatDisplayDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return value;
  }

  return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value?: string | null) {
  if (!value) {
    return new Date();
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
}

function PickerTrigger(props: { value: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={props.onPress}
      style={{
        borderWidth: 1,
        borderColor: appPalette.semantic.borderStrong,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: appPalette.surface.background,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <Text
        style={{
          color: props.value ? appPalette.semantic.textStrong : appPalette.semantic.textSubtle,
          fontFamily: "Montserrat",
          fontSize: 14,
          lineHeight: 20,
          flex: 1,
        }}
      >
        {props.value}
      </Text>
      <ChevronDown size={16} color={appPalette.semantic.textSubtle} />
    </Pressable>
  );
}

function OptionPickerModal<T extends string>(props: {
  open: boolean;
  title: string;
  options: Array<{ key: T; label: string }>;
  selectedKey?: T | null;
  onClose: () => void;
  onSelect: (key: T) => void;
}) {
  const { t } = useTranslation();

  return (
    <Modal visible={props.open} transparent animationType="none" onRequestClose={props.onClose}>
      <View style={{ flex: 1, backgroundColor: appPalette.surface.overlay, justifyContent: "center", padding: 20 }}>
        <View
          style={{
            backgroundColor: appPalette.surface.background,
            borderRadius: 20,
            padding: 16,
            gap: 12,
            maxHeight: "80%",
          }}
        >
          <Text style={{ color: appPalette.semantic.textStrong, fontSize: 18, fontWeight: "600", fontFamily: "Montserrat" }}>
            {props.title}
          </Text>
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8 }} showsVerticalScrollIndicator={false}>
            {props.options.map((option) => {
              const active = option.key === props.selectedKey;

              return (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    props.onSelect(option.key);
                    props.onClose();
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: active ? appPalette.semantic.infoBorder : appPalette.semantic.borderSubtle,
                    backgroundColor: active ? appPalette.semantic.infoSurface : appPalette.surface.background,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <Text
                    style={{
                      color: active ? appPalette.semantic.infoText : appPalette.semantic.textStrong,
                      fontFamily: "Montserrat",
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <ActionChip onPress={props.onClose}>{t("common.close")}</ActionChip>
        </View>
      </View>
    </Modal>
  );
}

function buildCalendarRows(visibleMonth: Date) {
  const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - startOffset + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return null;
    }

    return new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), dayNumber);
  });

  return Array.from({ length: cells.length / 7 }, (_, rowIndex) => cells.slice(rowIndex * 7, rowIndex * 7 + 7));
}

function DueDatePickerModal(props: {
  open: boolean;
  value?: string;
  onClose: () => void;
  onChange: (value: string | undefined) => void;
}) {
  const { t } = useTranslation();
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const baseDate = parseDateKey(props.value);
    return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  });

  const selectedKey = props.value ?? null;
  const monthLabel = visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const calendarRows = buildCalendarRows(visibleMonth);
  const weekdayLabels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <Modal visible={props.open} transparent animationType="none" onRequestClose={props.onClose}>
      <View style={{ flex: 1, backgroundColor: appPalette.surface.overlay, justifyContent: "center", padding: 20 }}>
        <View
          style={{
            backgroundColor: appPalette.surface.background,
            borderRadius: 20,
            padding: 16,
            gap: 12,
          }}
        >
          <Text style={{ color: appPalette.semantic.textStrong, fontSize: 18, fontWeight: "600", fontFamily: "Montserrat" }}>
            {t("goals.dialog.due_date_label")}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <ActionChip onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}>{"<"}</ActionChip>
            <Text
              style={{
                color: appPalette.semantic.textStrong,
                fontFamily: "Montserrat",
                fontSize: 14,
                lineHeight: 20,
                flex: 1,
                textAlign: "center",
                textTransform: "capitalize",
              }}
            >
              {monthLabel}
            </Text>
            <ActionChip onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}>{">"}</ActionChip>
          </View>

          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row" }}>
              {weekdayLabels.map((day) => (
                <View key={day} style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}>
                  <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 11 }}>{day}</Text>
                </View>
              ))}
            </View>

            {calendarRows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={{ flexDirection: "row" }}>
                {row.map((date, cellIndex) => {
                  if (!date) {
                    return (
                      <View key={`empty-${rowIndex}-${cellIndex}`} style={{ flex: 1, padding: 2 }}>
                        <View style={{ aspectRatio: 1 }} />
                      </View>
                    );
                  }

                  const dateKey = toDateKey(date);
                  const active = dateKey === selectedKey;

                  return (
                    <View key={dateKey} style={{ flex: 1, padding: 2 }}>
                      <Pressable
                        onPress={() => {
                          props.onChange(dateKey);
                          props.onClose();
                        }}
                        style={{
                          aspectRatio: 1,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 10,
                          backgroundColor: active ? appPalette.semantic.infoSurface : appPalette.surface.background,
                          borderWidth: 1,
                          borderColor: active ? appPalette.semantic.infoBorder : appPalette.semantic.borderSubtle,
                        }}
                      >
                        <Text
                          style={{
                            color: active ? appPalette.semantic.infoText : appPalette.semantic.textStrong,
                            fontFamily: "Montserrat",
                            fontSize: 13,
                          }}
                        >
                          {date.getDate()}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <ActionChip onPress={() => props.onChange(undefined)}>{t("common.not_specified")}</ActionChip>
            <ActionChip onPress={props.onClose}>{t("common.close")}</ActionChip>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function IconButton(props: { onPress: () => void; children: React.ReactNode; tone?: "default" | "danger" }) {
  const tone = props.tone ?? "default";

  return (
    <Pressable
      onPress={props.onPress}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: tone === "danger" ? appPalette.semantic.dangerBorder : appPalette.semantic.infoBorder,
        backgroundColor: tone === "danger" ? appPalette.semantic.dangerSurface : appPalette.semantic.infoSurface,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {props.children}
    </Pressable>
  );
}

function TaskEditorItem(props: {
  task: Task;
  depth?: number;
  expandedTasks: Record<string, boolean>;
  onToggleExpand: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  newSubTaskTitle: string;
  newSubTaskXp: string;
  onChangeNewSubTaskTitle: (taskId: string, value: string) => void;
  onChangeNewSubTaskXp: (taskId: string, value: string) => void;
  onAddSubTask: (taskId: string) => void;
}) {
  const { t } = useTranslation();
  const depth = props.depth ?? 0;
  const hasSubtasks = (props.task.subtasks?.length ?? 0) > 0;
  const isExpanded = !!props.expandedTasks[props.task.id];

  return (
    <View style={{ gap: 8, marginLeft: depth * 14 }}>
      <View
        style={{
          borderWidth: 1,
          borderColor: appPalette.semantic.borderSubtle,
          borderRadius: 14,
          padding: 12,
          gap: 10,
          backgroundColor: appPalette.semantic.neutralSurfaceStrong,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable
            onPress={() => props.onToggleExpand(props.task.id)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: appPalette.semantic.borderSubtle,
              backgroundColor: appPalette.surface.background,
            }}
          >
            {isExpanded ? (
              <ChevronUp size={16} color={appPalette.semantic.textSubtle} />
            ) : (
              <ChevronDown size={16} color={appPalette.semantic.textSubtle} />
            )}
          </Pressable>

          <Text style={{ color: appPalette.semantic.textStrong, fontWeight: "600", fontFamily: "Montserrat", flex: 1 }}>
            {props.task.title}
          </Text>

          <IconButton onPress={() => props.onRemoveTask(props.task.id)} tone="danger">
            <X size={16} color={appPalette.semantic.dangerText} />
          </IconButton>
        </View>

        {isExpanded && (
          <View style={{ gap: 8 }}>
            {hasSubtasks ? (
              <View style={{ gap: 8 }}>
                {props.task.subtasks?.map((subtask) => (
                  <TaskEditorItem
                    key={subtask.id}
                    task={subtask}
                    depth={depth + 1}
                    expandedTasks={props.expandedTasks}
                    onToggleExpand={props.onToggleExpand}
                    onRemoveTask={props.onRemoveTask}
                    newSubTaskTitle={props.newSubTaskTitle}
                    newSubTaskXp={props.newSubTaskXp}
                    onChangeNewSubTaskTitle={props.onChangeNewSubTaskTitle}
                    onChangeNewSubTaskXp={props.onChangeNewSubTaskXp}
                    onAddSubTask={props.onAddSubTask}
                  />
                ))}
              </View>
            ) : null}

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <FieldInput
                  value={props.newSubTaskTitle}
                  onChangeText={(value) => props.onChangeNewSubTaskTitle(props.task.id, value)}
                  placeholder={t("goals.subtask_placeholder")}
                  autoCapitalize="sentences"
                />
              </View>
              <View style={{ width: 88 }}>
                <FieldInput
                  value={props.newSubTaskXp}
                  onChangeText={(value) => props.onChangeNewSubTaskXp(props.task.id, value)}
                  placeholder={t("common.xp")}
                  keyboardType="numeric"
                />
              </View>
              <IconButton onPress={() => props.onAddSubTask(props.task.id)}>
                <Plus size={16} color={appPalette.semantic.infoText} />
              </IconButton>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

export function GoalTypeSection(props: { goalType: GoalType; onChange: (value: GoalType) => void }) {
  const { t } = useTranslation();

  return (
    <View style={{ gap: 8 }}>
      <Text style={formSectionLabelStyle}>{t("goals.dialog.goal_type_label")}</Text>
      <SectionTabs
        tabs={[{ key: "TASK", label: t("goals.dialog.goal_type_tasks") }, { key: "PROGRESS", label: t("goals.dialog.goal_type_progress") }]}
        activeTab={props.goalType}
        onChange={(value) => props.onChange(value as GoalType)}
      />
    </View>
  );
}

export function WorkoutToggleSection(props: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <Pressable onPress={() => props.onChange(!props.value)} style={{ flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: props.value ? appPalette.brand.primary : appPalette.semantic.borderSubtle, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: props.value ? appPalette.semantic.infoSurface : appPalette.semantic.neutralSurfaceStrong }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: appPalette.semantic.textStrong, fontSize: 13, fontWeight: "500", fontFamily: "Montserrat" }}>Это тренировка</Text>
        <Text style={{ color: appPalette.semantic.textMuted, fontSize: 11, fontFamily: "Montserrat" }}>У подходов появятся поля веса и повторов</Text>
      </View>
      <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: props.value ? appPalette.brand.primary : appPalette.semantic.borderSubtle, justifyContent: "center", paddingHorizontal: 3 }}>
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: appPalette.surface.background, alignSelf: props.value ? "flex-end" : "flex-start" }} />
      </View>
    </Pressable>
  );
}

export function NutritionToggleSection(props: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <Pressable onPress={() => props.onChange(!props.value)} style={{ flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: props.value ? appPalette.brand.primary : appPalette.semantic.borderSubtle, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: props.value ? appPalette.semantic.infoSurface : appPalette.semantic.neutralSurfaceStrong }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: appPalette.semantic.textStrong, fontSize: 13, fontWeight: "500", fontFamily: "Montserrat" }}>Питание (калории по фото)</Text>
        <Text style={{ color: appPalette.semantic.textMuted, fontSize: 11, fontFamily: "Montserrat" }}>Цель - ккал в день. Внутри цели можно фотографировать еду</Text>
      </View>
      <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: props.value ? appPalette.brand.primary : appPalette.semantic.borderSubtle, justifyContent: "center", paddingHorizontal: 3 }}>
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: appPalette.surface.background, alignSelf: props.value ? "flex-end" : "flex-start" }} />
      </View>
    </Pressable>
  );
}

export function GoalPeriodSection(props: { goalPeriod: GoalPeriod; onChange: (value: GoalPeriod) => void }) {
  const { t } = useTranslation();

  return (
    <View style={{ gap: 8 }}>
      <Text style={formSectionLabelStyle}>{t("goals.dialog.period_label")}</Text>
      <SectionTabs
        tabs={[
          { key: "NONE", label: t("goals.dialog.period_none") },
          { key: "DAILY", label: t("goals.dialog.period_day") },
          { key: "WEEKLY", label: t("goals.dialog.period_week") },
          { key: "MONTHLY", label: t("goals.dialog.period_month") },
        ]}
        activeTab={props.goalPeriod}
        onChange={(value) => props.onChange(value as GoalPeriod)}
      />
    </View>
  );
}

export function DueDateSection(props: { dueDate: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const valueLabel = formatDisplayDate(props.dueDate) ?? t("common.not_specified");

  return (
    <View style={{ gap: 8 }}>
      <Text style={formSectionLabelStyle}>{t("goals.dialog.due_date_label")}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          borderWidth: 1,
          borderColor: appPalette.semantic.borderStrong,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: appPalette.surface.background,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          <Calendar size={16} color={appPalette.semantic.textSubtle} />
          <Text
            style={{
              color: props.dueDate ? appPalette.semantic.textStrong : appPalette.semantic.textSubtle,
              fontFamily: "Montserrat",
              fontSize: 14,
              lineHeight: 20,
              flex: 1,
            }}
          >
            {valueLabel}
          </Text>
        </View>
        <ChevronDown size={16} color={appPalette.semantic.textSubtle} />
      </Pressable>
      <DueDatePickerModal
        open={open}
        value={props.dueDate || undefined}
        onClose={() => setOpen(false)}
        onChange={(value) => props.onChange(value ?? "")}
      />
    </View>
  );
}

export function CategorySection(props: {
  categories: CategoryOption[];
  category: string;
  onChange: (value: string) => void;
  onAddCategory: (category: CategoryOption) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [createdCategoryLabel, setCreatedCategoryLabel] = useState<string | null>(null);
  const activeLabel = useMemo(
    () =>
      props.categories.find((item) => item.value === props.category)?.label ??
      createdCategoryLabel ??
      t("goals.dialog.category_placeholder"),
    [props.categories, props.category, createdCategoryLabel, t],
  );

  const handleAddCategory = () => {
    const nextName = newCategoryName.trim();
    if (!nextName) {
      return;
    }

    const value = nextName.toLowerCase().replace(/\s+/g, "-");
    props.onAddCategory({ value, label: nextName });
    props.onChange(value);
    setCreatedCategoryLabel(nextName);
    setNewCategoryName("");
    setIsCreatingCategory(false);
  };

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <Text style={formSectionLabelStyle}>{t("goals.dialog.category_label")}</Text>
        {!isCreatingCategory ? (
          <ActionChip onPress={() => setIsCreatingCategory(true)}>{t("goals.dialog.create_category")}</ActionChip>
        ) : (
          <ActionChip onPress={() => setIsCreatingCategory(false)}>{t("goals.dialog.cancel_category")}</ActionChip>
        )}
      </View>

      {isCreatingCategory ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <FieldInput
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder={t("goals.dialog.category_placeholder")}
              autoCapitalize="sentences"
            />
          </View>
          <ActionChip onPress={handleAddCategory} disabled={!newCategoryName.trim()}>
            OK
          </ActionChip>
        </View>
      ) : (
        <PickerTrigger value={activeLabel} onPress={() => setOpen(true)} />
      )}

      <OptionPickerModal
        open={open}
        title={t("goals.dialog.category_label")}
        options={props.categories.map((item) => ({ key: item.value, label: item.label }))}
        selectedKey={props.category}
        onClose={() => setOpen(false)}
        onSelect={props.onChange}
      />
    </View>
  );
}

export function RewardSection(props: {
  rewards: Reward[];
  activeRewardId: string | null;
  onChange: (value: string | null) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const selectableRewards = props.rewards.filter((reward) => reward.sourceKey !== ONBOARDING_REWARD_SOURCE_KEY);
  const activeLabel = useMemo(() => {
    if (!props.activeRewardId) {
      return t("common.no_reward");
    }

    return selectableRewards.find((reward) => reward.id === props.activeRewardId)?.title ?? t("common.no_reward");
  }, [props.activeRewardId, selectableRewards, t]);

  return (
    <View style={{ gap: 8 }}>
      <Text style={formSectionLabelStyle}>{t("goals.dialog.reward_label")}</Text>
      <PickerTrigger value={activeLabel} onPress={() => setOpen(true)} />
      <OptionPickerModal
        open={open}
        title={t("goals.dialog.reward_label")}
        options={[
          { key: "__none__", label: t("common.no_reward") },
          ...selectableRewards.map((reward) => ({ key: reward.id, label: reward.title })),
        ]}
        selectedKey={props.activeRewardId ?? "__none__"}
        onClose={() => setOpen(false)}
        onSelect={(value) => props.onChange(value === "__none__" ? null : value)}
      />
    </View>
  );
}

export function ProgressFieldsSection(props: {
  currentValue: string;
  targetValue: string;
  onChangeCurrentValue: (value: string) => void;
  onChangeTargetValue: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={{ gap: 12 }}>
      <FieldInput label={t("goals.dialog.current_progress")} value={props.currentValue} onChangeText={props.onChangeCurrentValue} placeholder="0" keyboardType="numeric" />
      <FieldInput label={t("goals.dialog.target_value")} value={props.targetValue} onChangeText={props.onChangeTargetValue} placeholder="100" keyboardType="numeric" />
    </View>
  );
}

export function TaskXpTargetSection(props: {
  taskXpTarget: string;
  totalTaskXp: number;
  onChangeTaskXpTarget: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <FieldInput
            label={t("goals.dialog.task_xp_target_label")}
            value={props.taskXpTarget}
            onChangeText={props.onChangeTaskXpTarget}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1 }}>
          <FieldInput
            label={t("goals.dialog.task_xp_total_label")}
            value={String(props.totalTaskXp)}
            editable={false}
          />
        </View>
      </View>
    </View>
  );
}

export function TasksSection(props: {
  tasks: Task[];
  newTaskTitle: string;
  newTaskXp: string;
  onChangeNewTaskTitle: (value: string) => void;
  onChangeNewTaskXp: (value: string) => void;
  onAddTask: () => void;
  onRemoveTask: (taskId: string) => void;
  expandedTasks: Record<string, boolean>;
  onToggleExpand: (taskId: string) => void;
  newSubTaskTitles: Record<string, string>;
  newSubTaskXps: Record<string, string>;
  onChangeNewSubTaskTitle: (taskId: string, value: string) => void;
  onChangeNewSubTaskXp: (taskId: string, value: string) => void;
  onAddSubTask: (taskId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={{ gap: 12 }}>
      <Text style={formSectionLabelStyle}>{t("goals.dialog.tasks_label")}</Text>

      {props.tasks.length === 0 ? (
        <Text style={formHelperStyle}>{t("goals.dialog.empty_tasks")}</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {props.tasks.map((task) => (
            <TaskEditorItem
              key={task.id}
              task={task}
              expandedTasks={props.expandedTasks}
              onToggleExpand={props.onToggleExpand}
              onRemoveTask={props.onRemoveTask}
              newSubTaskTitle={props.newSubTaskTitles[task.id] ?? ""}
              newSubTaskXp={props.newSubTaskXps[task.id] ?? ""}
              onChangeNewSubTaskTitle={props.onChangeNewSubTaskTitle}
              onChangeNewSubTaskXp={props.onChangeNewSubTaskXp}
              onAddSubTask={props.onAddSubTask}
            />
          ))}
        </View>
      )}

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <FieldInput
            value={props.newTaskTitle}
            onChangeText={props.onChangeNewTaskTitle}
            placeholder={t("goals.dialog.task_placeholder")}
            autoCapitalize="sentences"
          />
        </View>
        <View style={{ width: 88 }}>
          <FieldInput
            value={props.newTaskXp}
            onChangeText={props.onChangeNewTaskXp}
            placeholder={t("common.xp")}
            keyboardType="numeric"
          />
        </View>
        <IconButton onPress={props.onAddTask}>
          <Plus size={16} color={appPalette.semantic.infoText} />
        </IconButton>
      </View>
    </View>
  );
}
