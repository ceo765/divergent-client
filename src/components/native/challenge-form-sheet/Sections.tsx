import { useMemo, useState } from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";
import { useTranslation } from "react-i18next";

import { ActionChip } from "@/components/native/ActionChip";
import { FieldInput } from "@/components/native/FieldInput";
import { Calendar, ChevronDown } from "@/components/native/icons";
import { SectionTabs } from "@/components/native/SectionTabs";
import { formSectionLabelStyle } from "@/components/native/form-sheet/Layout";
import { appPalette } from "@/theme/palette";
import type { Goal } from "@/types";

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

function CalendarModal(props: {
  open: boolean;
  title: string;
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
        <View style={{ backgroundColor: appPalette.surface.background, borderRadius: 20, padding: 16, gap: 12 }}>
          <Text style={{ color: appPalette.semantic.textStrong, fontSize: 18, fontWeight: "600", fontFamily: "Montserrat" }}>
            {props.title}
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

function DateField(props: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const valueLabel = formatDisplayDate(props.value) ?? props.placeholder;

  return (
    <View style={{ gap: 8 }}>
      <Text style={formSectionLabelStyle}>{props.label}</Text>
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
              color: props.value ? appPalette.semantic.textStrong : appPalette.semantic.textSubtle,
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
      <CalendarModal
        open={open}
        title={props.label}
        value={props.value || undefined}
        onClose={() => setOpen(false)}
        onChange={(value) => props.onChange(value ?? "")}
      />
    </View>
  );
}

function GoalsMultiSelectModal(props: {
  open: boolean;
  goals: Goal[];
  selectedGoalIds: string[];
  onClose: () => void;
  onToggleGoal: (goalId: string) => void;
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
            {t("challenges.selection.goals")}
          </Text>
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8 }} showsVerticalScrollIndicator={false}>
            {props.goals.map((goal) => {
              const active = props.selectedGoalIds.includes(goal.id);

              return (
                <Pressable
                  key={goal.id}
                  onPress={() => props.onToggleGoal(goal.id)}
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
                    {goal.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <ActionChip onPress={props.onClose}>{t("common.save")}</ActionChip>
        </View>
      </View>
    </Modal>
  );
}

export function ChallengeFieldsSection(props: {
  title: string;
  description: string;
  rules: string;
  link: string;
  startsAt: string;
  endsAt: string;
  onChangeTitle: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeRules: (value: string) => void;
  onChangeLink: (value: string) => void;
  onChangeStartsAt: (value: string) => void;
  onChangeEndsAt: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <FieldInput label={t("challenges.fields.title")} value={props.title} onChangeText={props.onChangeTitle} placeholder={t("challenges.placeholders.title")} autoCapitalize="sentences" />
      <FieldInput
        label={t("challenges.fields.description")}
        value={props.description}
        onChangeText={props.onChangeDescription}
        placeholder={t("challenges.placeholders.description")}
        autoCapitalize="sentences"
        multiline
        numberOfLines={4}
      />
      <FieldInput
        label={t("challenges.fields.rules")}
        value={props.rules}
        onChangeText={props.onChangeRules}
        placeholder={t("challenges.placeholders.rules")}
        autoCapitalize="sentences"
        multiline
        numberOfLines={4}
      />
      <FieldInput label={t("challenges.fields.link")} value={props.link} onChangeText={props.onChangeLink} placeholder={t("challenges.placeholders.link")} keyboardType="url" autoCapitalize="none" />
      <DateField label={t("challenges.fields.start_date")} value={props.startsAt} placeholder={t("challenges.placeholders.start_date")} onChange={props.onChangeStartsAt} />
      <DateField label={t("challenges.fields.end_date")} value={props.endsAt} placeholder={t("challenges.placeholders.end_date")} onChange={props.onChangeEndsAt} />
    </>
  );
}

export function ChallengeVisibilitySection(props: { isPublic: boolean; onChange: (value: boolean) => void }) {
  const { t } = useTranslation();

  return (
    <View style={{ gap: 8 }}>
      <Text style={formSectionLabelStyle}>{t("challenges.fields.visibility")}</Text>
      <SectionTabs
        tabs={[
          { key: "public", label: t("challenges.visibility.public") },
          { key: "private", label: t("challenges.visibility.private") },
        ]}
        activeTab={props.isPublic ? "public" : "private"}
        onChange={(tab) => props.onChange(tab === "public")}
      />
    </View>
  );
}

export function ChallengeReportsSection(props: { requiresReport: boolean; onChange: (value: boolean) => void }) {
  const { t } = useTranslation();

  return (
    <View style={{ gap: 8 }}>
      <Text style={formSectionLabelStyle}>{t("challenges.fields.requiresReport")}</Text>
      <SectionTabs
        tabs={[{ key: "yes", label: t("common.yes") }, { key: "no", label: t("common.no") }]}
        activeTab={props.requiresReport ? "yes" : "no"}
        onChange={(tab) => props.onChange(tab === "yes")}
      />
    </View>
  );
}

export function ChallengeFoundationSection(props: {
  personalGoalsEnabled: boolean;
  metricName: string;
  metricUnit: string;
  reportDeadline: string;
  reportTimeZone: string;
  allowedMisses: string;
  reportingDays: string[];
  onChangePersonalGoalsEnabled: (value: boolean) => void;
  onChangeMetricName: (value: string) => void;
  onChangeMetricUnit: (value: string) => void;
  onChangeReportDeadline: (value: string) => void;
  onChangeReportTimeZone: (value: string) => void;
  onChangeAllowedMisses: (value: string) => void;
  onToggleReportingDay: (value: string) => void;
}) {
  return (
    <View style={{ gap: 12, borderWidth: 1, borderColor: appPalette.semantic.borderSubtle, borderRadius: 16, padding: 14 }}>
      <Text style={{ ...formSectionLabelStyle, fontSize: 16 }}>Личные цели и отчёты</Text>
      <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>
        Каждый участник задаёт свой результат, а форма отчёта и сроки остаются общими.
      </Text>
      <SectionTabs
        tabs={[{ key: "personal", label: "Личные цели" }, { key: "shared", label: "Общие цели" }]}
        activeTab={props.personalGoalsEnabled ? "personal" : "shared"}
        onChange={(tab) => props.onChangePersonalGoalsEnabled(tab === "personal")}
      />
      <FieldInput label="Что измеряем" value={props.metricName} onChangeText={props.onChangeMetricName} placeholder="Выручка, страницы, тренировки" />
      <FieldInput label="Единица результата" value={props.metricUnit} onChangeText={props.onChangeMetricUnit} placeholder="₽, страниц, дней" />
      <FieldInput label="Отчёт до" value={props.reportDeadline} onChangeText={props.onChangeReportDeadline} placeholder="23:00" />
      <FieldInput label="Часовой пояс" value={props.reportTimeZone} onChangeText={props.onChangeReportTimeZone} placeholder="Europe/Moscow" autoCapitalize="none" />
      <FieldInput label="Допустимо пропусков" value={props.allowedMisses} onChangeText={props.onChangeAllowedMisses} keyboardType="numeric" />
      <View style={{ gap: 8 }}>
        <Text style={formSectionLabelStyle}>Дни отчётности</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[["mon","Пн"],["tue","Вт"],["wed","Ср"],["thu","Чт"],["fri","Пт"],["sat","Сб"],["sun","Вс"]].map(([value, label]) => (
            <ActionChip key={value} tone={props.reportingDays.includes(value) ? "primary" : "secondary"} onPress={() => props.onToggleReportingDay(value)}>{label}</ActionChip>
          ))}
        </View>
      </View>
    </View>
  );
}

export function ChallengeGoalsSection(props: {
  goals: Goal[];
  selectedGoalIds: string[];
  onToggleGoal: (goalId: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const valueLabel = useMemo(() => {
    if (props.selectedGoalIds.length === 0) {
      return t("challenges.fields.select_goals");
    }

    return props.goals
      .filter((goal) => props.selectedGoalIds.includes(goal.id))
      .map((goal) => goal.title)
      .join(", ");
  }, [props.goals, props.selectedGoalIds, t]);

  return (
    <View style={{ gap: 8 }}>
      <Text style={formSectionLabelStyle}>{t("challenges.selection.goals")}</Text>
      <PickerTrigger value={valueLabel} onPress={() => setOpen(true)} />
      <GoalsMultiSelectModal
        open={open}
        goals={props.goals}
        selectedGoalIds={props.selectedGoalIds}
        onToggleGoal={props.onToggleGoal}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}
