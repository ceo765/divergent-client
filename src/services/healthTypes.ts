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

export interface HealthService {
  isAvailable(): Promise<boolean>;
  requestAuthorization(): Promise<boolean>;
  getSummary(): Promise<HealthSummary>;
}
