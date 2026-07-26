import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, Text, View } from "react-native";
import dayjs from "dayjs";

import { HapticPressable as Pressable } from "@/components/native/HapticPressable";
import { SurfaceCard } from "@/components/native/SurfaceCard";
import { categoryConfig } from "@/components/native/GoalCardParts";
import { Activity, CircleCheck, Flame, Footprints, Target, X } from "@/components/native/icons";
import { useAppStore } from "@/stores/useAppStore";
import { appPalette } from "@/theme/palette";
import type { CategoryOption, CategoryType, ProgressDayDetail, ProgressOverview } from "@/types";
import type { HealthSummary } from "@/services/health";

const CELL = 13;
const CELL_GAP = 3;

function cellColor(status: string) {
  switch (status) {
    case "full":
      return appPalette.semantic.successStrong; // зелёный - все цели дня
    case "partial":
      return "#eab308"; // жёлтый - часть
    case "missed":
      return appPalette.semantic.dangerStrong; // красный - ничего
    default:
      return appPalette.semantic.borderSubtle; // серый - целей не было
  }
}

function StatPill({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <View style={{ flex: 1, gap: 4, backgroundColor: appPalette.semantic.neutralSurfaceStrong, borderRadius: 14, borderWidth: 1, borderColor: appPalette.semantic.borderSubtle, paddingHorizontal: 12, paddingVertical: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {icon}
        <Text style={{ color: appPalette.semantic.textStrong, fontSize: 20, fontWeight: "700", fontFamily: "Montserrat", lineHeight: 24 }}>{value}</Text>
      </View>
      <Text style={{ color: appPalette.semantic.textMuted, fontSize: 11, fontWeight: "500", fontFamily: "Montserrat", lineHeight: 15 }}>{label}</Text>
    </View>
  );
}

function ConsistencyCalendar({ days, selectedDate, onSelectDay }: { days: ProgressOverview["days"]; selectedDate?: string; onSelectDay: (date: string) => void }) {
  const weeks = useMemo(() => {
    if (!days.length) return [] as (ProgressOverview["days"][number] | null)[][];
    const leading = (dayjs(days[0].date).day() + 6) % 7; // Monday-first index
    const cells: (ProgressOverview["days"][number] | null)[] = [
      ...Array.from({ length: leading }, () => null),
      ...days,
    ];
    const result: (ProgressOverview["days"][number] | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }
    return result;
  }, [days]);

  return (
    <View style={{ flexDirection: "row", gap: CELL_GAP }}>
      {weeks.map((week, wi) => (
        <View key={wi} style={{ gap: CELL_GAP }}>
          {week.map((day, di) =>
            day ? (
              <Pressable
                key={day.date}
                onPress={() => onSelectDay(day.date)}
                hitSlop={2}
                style={{
                  width: CELL,
                  height: CELL,
                  borderRadius: 3,
                  backgroundColor: cellColor(day.status),
                  borderWidth: selectedDate === day.date ? 1.5 : 0,
                  borderColor: appPalette.semantic.textStrong,
                }}
              />
            ) : (
              <View key={`${wi}-${di}`} style={{ width: CELL, height: CELL }} />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

function Legend() {
  const items: { label: string; status: string }[] = [
    { label: "все", status: "full" },
    { label: "часть", status: "partial" },
    { label: "ничего", status: "missed" },
    { label: "нет цели", status: "empty" },
  ];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      {items.map((item) => (
        <View key={item.status} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: cellColor(item.status) }} />
          <Text style={{ color: appPalette.semantic.textSubtle, fontSize: 11, fontFamily: "Montserrat", lineHeight: 15 }}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function StepsBars({ week }: { week: HealthSummary["weekSteps"] }) {
  const max = Math.max(1, ...week.map((d) => d.steps));
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 56, gap: 6 }}>
      {week.map((d) => (
        <View key={d.date} style={{ flex: 1, alignItems: "center", gap: 4 }}>
          <View style={{ width: "100%", height: Math.max(4, (d.steps / max) * 44), borderRadius: 4, backgroundColor: appPalette.brand.primary, opacity: d.steps > 0 ? 1 : 0.25 }} />
          <Text style={{ color: appPalette.semantic.textSubtle, fontSize: 9, fontFamily: "Montserrat" }}>{dayjs(d.date).format("dd")[0]}</Text>
        </View>
      ))}
    </View>
  );
}

function ActivityBlock({ health, onConnect }: { health: ReturnType<typeof useHealthShape>; onConnect: () => void }) {
  const { summary, available, authorized, loading } = health;

  return (
    <SurfaceCard gap={12} padding={16} radius={16}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Activity size={18} color={appPalette.brand.primary} />
        <Text style={{ color: appPalette.semantic.textStrong, fontSize: 15, fontWeight: "700", fontFamily: "Montserrat", lineHeight: 20 }}>Активность</Text>
      </View>

      {!available ? (
        <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontFamily: "Montserrat", lineHeight: 18 }}>
          Шаги и тренировки из Здоровья появятся после ближайшего обновления приложения.
        </Text>
      ) : !authorized ? (
        <View style={{ gap: 10 }}>
          <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontFamily: "Montserrat", lineHeight: 18 }}>
            Подключи Здоровье - и здесь будут твои шаги, дистанция и тренировки.
          </Text>
          <Pressable
            onPress={onConnect}
            style={{ alignSelf: "flex-start", borderRadius: 12, backgroundColor: appPalette.brand.primary, paddingHorizontal: 16, paddingVertical: 10 }}
          >
            <Text style={{ color: appPalette.semantic.textInverse, fontSize: 13, fontWeight: "600", fontFamily: "Montserrat", lineHeight: 18 }}>
              {loading ? "Подключаю…" : "Подключить Здоровье"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <StatPill icon={<Footprints size={16} color={appPalette.brand.primary} />} value={summary.steps.toLocaleString("ru-RU")} label="шагов сегодня" />
            <StatPill icon={<Activity size={16} color={appPalette.semantic.successStrong} />} value={summary.distanceKm.toFixed(1)} label="км сегодня" />
          </View>
          {summary.weekSteps.length > 0 && <StepsBars week={summary.weekSteps} />}
          {summary.workouts.length > 0 && (
            <View style={{ gap: 6 }}>
              <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontWeight: "600", fontFamily: "Montserrat", lineHeight: 16 }}>Тренировки</Text>
              {summary.workouts.slice(0, 4).map((w) => (
                <View key={w.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: appPalette.semantic.neutralSurfaceStrong, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }}>
                  <Text style={{ color: appPalette.semantic.textStrong, fontSize: 12, fontFamily: "Montserrat", lineHeight: 16 }}>{w.type}</Text>
                  <Text style={{ color: appPalette.semantic.textSubtle, fontSize: 11, fontFamily: "Montserrat", lineHeight: 15 }}>
                    {dayjs(w.start).format("D MMM")} · {Math.round(w.durationMin)} мин
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </SurfaceCard>
  );
}

function AreaSummaries({ categories, resolveLabel }: { categories: ProgressOverview["categories"]; resolveLabel: (value: string) => string }) {
  const visible = categories.filter((c) => c.completed > 0 || c.goals > 0).slice(0, 8);
  if (!visible.length) return null;
  const max = Math.max(1, ...visible.map((c) => c.completed));

  return (
    <SurfaceCard gap={12} padding={16} radius={16}>
      <Text style={{ color: appPalette.semantic.textStrong, fontSize: 15, fontWeight: "700", fontFamily: "Montserrat", lineHeight: 20 }}>По сферам</Text>
      <View style={{ gap: 10 }}>
        {visible.map((c) => {
          const palette = categoryConfig[(c.category as CategoryType)] ?? categoryConfig.custom;
          return (
            <View key={c.category} style={{ gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ color: appPalette.semantic.textStrong, fontSize: 12, fontWeight: "500", fontFamily: "Montserrat", lineHeight: 16 }}>{resolveLabel(c.category)}</Text>
                <Text style={{ color: appPalette.semantic.textSubtle, fontSize: 11, fontFamily: "Montserrat", lineHeight: 15 }}>{c.completed} · {c.goals} цел.</Text>
              </View>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: appPalette.semantic.borderSubtle, overflow: "hidden" }}>
                <View style={{ width: `${Math.round((c.completed / max) * 100)}%`, height: "100%", borderRadius: 4, backgroundColor: palette.textColor }} />
              </View>
            </View>
          );
        })}
      </View>
    </SurfaceCard>
  );
}

function DayDetailSheet({
  date,
  detail,
  loading,
  resolveLabel,
  onClose,
}: {
  date: string | null;
  detail?: ProgressDayDetail;
  loading: boolean;
  resolveLabel: (value: string) => string;
  onClose: () => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, { goalTitle: string; category: string; items: ProgressDayDetail["completed"] }>();
    for (const c of detail?.completed ?? []) {
      const entry = map.get(c.goalId) ?? { goalTitle: c.goalTitle, category: c.category, items: [] };
      entry.items.push(c);
      map.set(c.goalId, entry);
    }
    return Array.from(map.values());
  }, [detail]);

  return (
    <Modal visible={!!date} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: appPalette.surface.overlay, justifyContent: "flex-end" }}>
        <View style={{ maxHeight: "80%", backgroundColor: appPalette.surface.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat", lineHeight: 24 }}>
              {date ? dayjs(date).format("D MMMM, dd") : ""}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color={appPalette.semantic.textMuted} />
            </Pressable>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 28, alignItems: "center" }}>
              <ActivityIndicator size="large" color={appPalette.brand.primary} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <CircleCheck size={16} color={appPalette.semantic.successStrong} />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat", lineHeight: 18 }}>
                    Выполнено ({detail?.completed.length ?? 0})
                  </Text>
                </View>
                {grouped.length === 0 ? (
                  <Text style={{ fontSize: 12, color: appPalette.semantic.textSubtle, fontFamily: "Montserrat", lineHeight: 18 }}>В этот день отметок не было.</Text>
                ) : (
                  grouped.map((g) => (
                    <View key={g.goalTitle} style={{ backgroundColor: appPalette.semantic.neutralSurfaceStrong, borderRadius: 12, padding: 10, gap: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: appPalette.semantic.textStrong, fontFamily: "Montserrat", lineHeight: 16 }}>{g.goalTitle}</Text>
                      {g.items.map((it) => (
                        <View key={it.completionId} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <Text style={{ flex: 1, fontSize: 12, color: appPalette.semantic.textMuted, fontFamily: "Montserrat", lineHeight: 16 }}>
                            {it.taskTitle}
                            {it.weight != null ? `  ·  ${it.weight}${it.reps != null ? `×${it.reps}` : ""}` : ""}
                          </Text>
                          <Text style={{ fontSize: 11, color: appPalette.semantic.textSubtle, fontFamily: "Montserrat", lineHeight: 15 }}>{it.time}</Text>
                        </View>
                      ))}
                    </View>
                  ))
                )}
              </View>

              {(detail?.missed.length ?? 0) > 0 && (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <X size={16} color={appPalette.semantic.dangerStrong} />
                    <Text style={{ fontSize: 13, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat", lineHeight: 18 }}>
                      Пропущено ({detail?.missed.length ?? 0})
                    </Text>
                  </View>
                  {detail?.missed.map((m) => (
                    <View key={m.goalId} style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: appPalette.semantic.dangerSurface, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: appPalette.semantic.dangerStrong }} />
                      <Text style={{ flex: 1, fontSize: 12, color: appPalette.semantic.dangerText, fontFamily: "Montserrat", lineHeight: 16 }}>{m.goalTitle}</Text>
                      <Text style={{ fontSize: 11, color: appPalette.semantic.textSubtle, fontFamily: "Montserrat", lineHeight: 15 }}>{resolveLabel(m.category)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// local shape helper so ActivityBlock can be typed without importing the hook here
type useHealthShape = {
  summary: HealthSummary;
  available: boolean;
  authorized: boolean;
  loading: boolean;
};

export function ProgressOverviewSection({
  overview,
  loading,
  health,
  onConnectHealth,
  categories,
}: {
  overview?: ProgressOverview;
  loading: boolean;
  health: useHealthShape;
  onConnectHealth: () => void;
  categories: CategoryOption[];
}) {
  const resolveLabel = (value: string) => categories.find((c) => c.value === value)?.label ?? value;
  const { getProgressDay } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDetail, setDayDetail] = useState<ProgressDayDetail>();
  const [dayLoading, setDayLoading] = useState(false);

  useEffect(() => {
    if (!selectedDate) return;
    let active = true;
    setDayLoading(true);
    setDayDetail(undefined);
    getProgressDay(selectedDate)
      .then((detail) => {
        if (active) setDayDetail(detail);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setDayLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedDate, getProgressDay]);

  if (loading && !overview) {
    return (
      <View style={{ paddingVertical: 32, alignItems: "center" }}>
        <ActivityIndicator size="large" color={appPalette.brand.primary} />
      </View>
    );
  }

  if (!overview) return null;

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <StatPill icon={<Flame size={16} color={appPalette.semantic.warningStrong} />} value={overview.currentStreak} label="дней подряд" />
        <StatPill icon={<Target size={16} color={appPalette.semantic.successStrong} />} value={overview.longestStreak} label="лучший стрик" />
        <StatPill icon={<Activity size={16} color={appPalette.brand.primary} />} value={overview.completedToday} label="сегодня" />
      </View>

      <SurfaceCard gap={12} padding={16} radius={16}>
        <Text style={{ color: appPalette.semantic.textStrong, fontSize: 15, fontWeight: "700", fontFamily: "Montserrat", lineHeight: 20 }}>Стабильность</Text>
        <Text style={{ color: appPalette.semantic.textSubtle, fontSize: 11, fontFamily: "Montserrat", lineHeight: 15 }}>Нажми на день, чтобы посмотреть детали</Text>
        <ConsistencyCalendar days={overview.days} selectedDate={selectedDate ?? undefined} onSelectDay={setSelectedDate} />
        <Legend />
      </SurfaceCard>

      <ActivityBlock health={health} onConnect={onConnectHealth} />

      <AreaSummaries categories={overview.categories} resolveLabel={resolveLabel} />

      <DayDetailSheet
        date={selectedDate}
        detail={dayDetail}
        loading={dayLoading}
        resolveLabel={resolveLabel}
        onClose={() => setSelectedDate(null)}
      />
    </View>
  );
}
