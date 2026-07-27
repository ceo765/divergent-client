import { Platform } from "react-native";
import AppleHealthKit, {
  type HealthInputOptions,
  type HealthKitPermissions,
  type HealthValue,
} from "react-native-health";

import { emptyHealthSummary, type HealthDaySteps, type HealthService, type HealthSummary, type HealthWorkout } from "./healthTypes";

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.Workout,
    ],
    write: [],
  },
};

let initialized = false;

function initOnce(): Promise<boolean> {
  if (initialized) return Promise.resolve(true);
  return new Promise((resolve) => {
    try {
      AppleHealthKit.initHealthKit(permissions, (err: string) => {
        if (err) {
          resolve(false);
          return;
        }
        initialized = true;
        resolve(true);
      });
    } catch {
      resolve(false);
    }
  });
}

function todaySteps(): Promise<number> {
  return new Promise((resolve) => {
    AppleHealthKit.getStepCount({ date: new Date().toISOString() } as HealthInputOptions, (err: string, r: HealthValue) => {
      resolve(err ? 0 : Math.round(r?.value ?? 0));
    });
  });
}

function todayDistanceKm(): Promise<number> {
  return new Promise((resolve) => {
    AppleHealthKit.getDistanceWalkingRunning({ date: new Date().toISOString(), unit: "meter" } as HealthInputOptions, (err: string, r: HealthValue) => {
      resolve(err ? 0 : Math.round(((r?.value ?? 0) / 1000) * 10) / 10);
    });
  });
}

function weekSteps(): Promise<HealthDaySteps[]> {
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return new Promise((resolve) => {
    AppleHealthKit.getDailyStepCountSamples(
      { startDate: start.toISOString(), endDate: new Date().toISOString() } as HealthInputOptions,
      (err: string, results: HealthValue[]) => {
        if (err || !Array.isArray(results)) {
          resolve([]);
          return;
        }
        const byDay = new Map<string, number>();
        for (const s of results) {
          const key = new Date(s.startDate as unknown as string).toISOString().slice(0, 10);
          byDay.set(key, (byDay.get(key) ?? 0) + (s.value ?? 0));
        }
        const days: HealthDaySteps[] = [];
        const cursor = new Date(start);
        for (let i = 0; i < 7; i++) {
          const key = cursor.toISOString().slice(0, 10);
          days.push({ date: key, steps: Math.round(byDay.get(key) ?? 0) });
          cursor.setDate(cursor.getDate() + 1);
        }
        resolve(days);
      },
    );
  });
}

function recentWorkouts(): Promise<HealthWorkout[]> {
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return new Promise((resolve) => {
    AppleHealthKit.getAnchoredWorkouts(
      { startDate: start.toISOString(), type: "Workout" } as HealthInputOptions,
      (err: string, results: { data?: unknown[] }) => {
        if (err || !results?.data) {
          resolve([]);
          return;
        }
        const list = (results.data as Array<{ id: string; activityName: string; start: string; duration: number; calories: number; distance: number }>)
          .map((w) => ({
            id: w.id,
            type: w.activityName || "Тренировка",
            start: w.start,
            durationMin: Math.round((w.duration ?? 0) / 60),
            calories: w.calories ? Math.round(w.calories) : undefined,
            distanceKm: w.distance ? Math.round((w.distance / 1000) * 10) / 10 : undefined,
          }))
          .sort((a, b) => (a.start < b.start ? 1 : -1));
        resolve(list.slice(0, 10));
      },
    );
  });
}

const service: HealthService = {
  async isAvailable() {
    if (Platform.OS !== "ios") return false;
    return new Promise<boolean>((resolve) => {
      try {
        AppleHealthKit.isAvailable((err: object, available: boolean) => resolve(!err && !!available));
      } catch {
        resolve(false);
      }
    });
  },

  async requestAuthorization() {
    if (Platform.OS !== "ios") return false;
    return initOnce();
  },

  async getSummary(): Promise<HealthSummary> {
    if (Platform.OS !== "ios" || !initialized) {
      // Доступ ещё не выдан - показываем экран "Подключить", данные не тянем.
      return { ...emptyHealthSummary, available: Platform.OS === "ios" };
    }
    const [steps, distanceKm, week, workouts] = await Promise.all([
      todaySteps(),
      todayDistanceKm(),
      weekSteps(),
      recentWorkouts(),
    ]);
    return { available: true, authorized: true, steps, distanceKm, weekSteps: week, workouts };
  },
};

export default service;
export * from "./healthTypes";
