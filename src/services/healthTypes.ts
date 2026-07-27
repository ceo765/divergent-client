export type HealthWorkout = {
  id: string;
  type: string;
  start: string;
  durationMin: number;
  calories?: number;
  distanceKm?: number;
};

export type HealthDaySteps = {
  date: string;
  steps: number;
};

export type HealthSummary = {
  available: boolean;
  authorized: boolean;
  steps: number;
  distanceKm: number;
  weekSteps: HealthDaySteps[];
  workouts: HealthWorkout[];
};

export const emptyHealthSummary: HealthSummary = {
  available: false,
  authorized: false,
  steps: 0,
  distanceKm: 0,
  weekSteps: [],
  workouts: [],
};

export type HealthStatDay = {
  date: string;
  steps: number;
  walkKm: number;
  runKm: number;
};

export type HealthStats = {
  available: boolean;
  days: HealthStatDay[]; // хронологически, до 30 дней (старые -> новые)
  runs: number; // число пробежек за период
};

export const emptyHealthStats: HealthStats = {
  available: false,
  days: [],
  runs: 0,
};

export interface HealthService {
  isAvailable(): Promise<boolean>;
  requestAuthorization(): Promise<boolean>;
  getSummary(): Promise<HealthSummary>;
  getStats(): Promise<HealthStats>;
}
