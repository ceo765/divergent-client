import { useMemo } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import dayjs from "dayjs";

import { HapticPressable as Pressable } from "@/components/native/HapticPressable";
import { SurfaceCard } from "@/components/native/SurfaceCard";
import { categoryConfig } from "@/components/native/GoalCardParts";
import { Activity, Flame, Footprints, Target } from "@/components/native/icons";
import { appPalette } from "@/theme/palette";
import type { CategoryOption, CategoryType, ProgressOverview } from "@/types";
import type { HealthSummary } from "@/services/health";

const CELL = 13;
const CELL_GAP = 3;

function cellColor(status: string) {
  switch (status) {
    case "full":
      return appPalette.semantic.successStrong;
    case "missed":
      return appPalette.semantic.dangerBorder;
    default:
      return appPalette.semantic.borderSubtle;
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

function ConsistencyCalendar({ days }: { days: ProgressOverview["days"] }) {
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
          {week.map((day, di) => (
            <View
              key={day?.date ?? `${wi}-${di}`}
              style={{
                width: CELL,
                height: CELL,
                borderRadius: 3,
                backgroundColor: day ? cellColor(day.status) : "transparent",
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function Legend() {
  const items: { label: string; status: string }[] = [
    { label: "выполнено", status: "full" },
    { label: "пропуск", status: "missed" },
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
        <ConsistencyCalendar days={overview.days} />
        <Legend />
      </SurfaceCard>

      <ActivityBlock health={health} onConnect={onConnectHealth} />

      <AreaSummaries categories={overview.categories} resolveLabel={resolveLabel} />
    </View>
  );
}
