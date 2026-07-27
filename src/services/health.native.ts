import { Platform } from "react-native";
import {
  isHealthDataAvailable,
  queryStatisticsCollectionForQuantity,
  queryStatisticsForQuantity,
  queryWorkoutSamples,
  requestAuthorization,
} from "@kingstinct/react-native-healthkit";

import { emptyHealthSummary, type HealthDaySteps, type HealthService, type HealthStatDay, type HealthStats, type HealthSummary, type HealthWorkout } from "./healthTypes";

const STEP = "HKQuantityTypeIdentifierStepCount";
const DISTANCE = "HKQuantityTypeIdentifierDistanceWalkingRunning";
const ENERGY = "HKQuantityTypeIdentifierActiveEnergyBurned";
const WORKOUT = "HKWorkoutTypeIdentifier";

const READ = [STEP, DISTANCE, ENERGY, WORKOUT] as const;

let authorized = false;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function sumFor(identifier: string, unit: string, start: Date, end: Date): Promise<number> {
  try {
    const r = (await queryStatisticsForQuantity(
      identifier as never,
      ["cumulativeSum"],
      { filter: { date: { startDate: start, endDate: end } }, unit: unit as never },
    )) as { sumQuantity?: { quantity?: number } } | null;
    return r?.sumQuantity?.quantity ?? 0;
  } catch {
    return 0;
  }
}

async function weekSteps(): Promise<HealthDaySteps[]> {
  const days: HealthDaySteps[] = [];
  const base = startOfToday();
  const tasks: Promise<HealthDaySteps>[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(base);
    dayStart.setDate(base.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const key = dayStart.toISOString().slice(0, 10);
    tasks.push(sumFor(STEP, "count", dayStart, dayEnd).then((steps) => ({ date: key, steps: Math.round(steps) })));
  }
  for (const t of tasks) days.push(await t);
  return days;
}

const ACTIVITY_LABELS: Record<string, string> = {
  swimming: "Плавание",
  "46": "Плавание",
  running: "Бег",
  "37": "Бег",
  walking: "Ходьба",
  "52": "Ходьба",
  cycling: "Велосипед",
  "13": "Велосипед",
  traditionalStrengthTraining: "Силовая",
  "50": "Силовая",
  functionalStrengthTraining: "Силовая",
  "20": "Силовая",
  highIntensityIntervalTraining: "HIIT",
  "63": "HIIT",
  yoga: "Йога",
  "57": "Йога",
};

function workoutLabel(t: unknown): string {
  if (t == null) return "Тренировка";
  return ACTIVITY_LABELS[String(t)] ?? "Тренировка";
}

async function recentWorkouts(): Promise<HealthWorkout[]> {
  try {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const raw = (await queryWorkoutSamples({ limit: 20 } as never)) as unknown as Array<{
      uuid?: string;
      startDate?: string | Date;
      workoutActivityType?: unknown;
      duration?: { quantity?: number };
      totalDistance?: { quantity?: number };
      totalEnergyBurned?: { quantity?: number };
    }>;
    return (raw ?? [])
      .map((w, i) => {
        const start = w.startDate ? new Date(w.startDate) : new Date();
        return {
          id: w.uuid ?? `${start.toISOString()}-${i}`,
          type: workoutLabel(w.workoutActivityType),
          start: start.toISOString(),
          durationMin: Math.round((w.duration?.quantity ?? 0) / 60),
          calories: w.totalEnergyBurned?.quantity ? Math.round(w.totalEnergyBurned.quantity) : undefined,
          distanceKm: w.totalDistance?.quantity ? Math.round((w.totalDistance.quantity / 1000) * 10) / 10 : undefined,
        };
      })
      .filter((w) => new Date(w.start) >= monthAgo)
      .sort((a, b) => (a.start < b.start ? 1 : -1))
      .slice(0, 10);
  } catch {
    return [];
  }
}

async function dailyCollection(identifier: string, unit: string, from: Date, to: Date): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    const buckets = (await queryStatisticsCollectionForQuantity(
      identifier as never,
      ["cumulativeSum"],
      from,
      { day: 1 } as never,
      { filter: { date: { startDate: from, endDate: to } }, unit: unit as never },
    )) as unknown as Array<{ startDate?: string | Date; sumQuantity?: { quantity?: number } }>;
    for (const b of buckets ?? []) {
      if (!b.startDate) continue;
      const key = new Date(b.startDate).toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + (b.sumQuantity?.quantity ?? 0));
    }
  } catch {
    // ignore
  }
  return map;
}

const service: HealthService = {
  async isAvailable() {
    if (Platform.OS !== "ios") return false;
    try {
      return Boolean(isHealthDataAvailable());
    } catch {
      return false;
    }
  },

  async requestAuthorization() {
    if (Platform.OS !== "ios") return false;
    try {
      await requestAuthorization({ toRead: READ as never });
      authorized = true;
      return true;
    } catch {
      return false;
    }
  },

  async getSummary(): Promise<HealthSummary> {
    if (Platform.OS !== "ios" || !authorized) {
      return { ...emptyHealthSummary, available: Platform.OS === "ios" };
    }
    const now = new Date();
    const todayStart = startOfToday();
    const [steps, distanceMeters, week, workouts] = await Promise.all([
      sumFor(STEP, "count", todayStart, now),
      sumFor(DISTANCE, "m", todayStart, now),
      weekSteps(),
      recentWorkouts(),
    ]);
    return {
      available: true,
      authorized: true,
      steps: Math.round(steps),
      distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
      weekSteps: week,
      workouts,
    };
  },

  async getStats(): Promise<HealthStats> {
    if (Platform.OS !== "ios" || !authorized) {
      return { available: Platform.OS === "ios", days: [], runs: 0 };
    }
    const now = new Date();
    const from = startOfToday();
    from.setDate(from.getDate() - 29); // 30 дней включительно

    const runByDay = new Map<string, number>();
    let runs = 0;
    try {
      const raw = (await queryWorkoutSamples({ limit: 300 } as never)) as unknown as Array<{
        startDate?: string | Date;
        workoutActivityType?: unknown;
        totalDistance?: { quantity?: number };
      }>;
      for (const w of raw ?? []) {
        if (workoutLabel(w.workoutActivityType) !== "Бег") continue;
        const start = w.startDate ? new Date(w.startDate) : null;
        if (!start || start < from) continue;
        runs += 1;
        const key = start.toISOString().slice(0, 10);
        const km = (w.totalDistance?.quantity ?? 0) / 1000;
        runByDay.set(key, (runByDay.get(key) ?? 0) + km);
      }
    } catch {
      // ignore
    }

    const [stepMap, distMap] = await Promise.all([
      dailyCollection(STEP, "count", from, now),
      dailyCollection(DISTANCE, "m", from, now),
    ]);

    const days: HealthStatDay[] = [];
    const cursor = new Date(from);
    for (let i = 0; i < 30; i++) {
      const key = cursor.toISOString().slice(0, 10);
      const steps = Math.round(stepMap.get(key) ?? 0);
      const totalKm = (distMap.get(key) ?? 0) / 1000; // ходьба + бег
      const runKm = Math.round((runByDay.get(key) ?? 0) * 10) / 10;
      const walkKm = Math.max(0, Math.round((totalKm - runKm) * 10) / 10);
      days.push({ date: key, steps, walkKm, runKm });
      cursor.setDate(cursor.getDate() + 1);
    }

    return { available: true, days, runs };
  },
};

export default service;
export * from "./healthTypes";
