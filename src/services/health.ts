import { emptyHealthStats, emptyHealthSummary, type HealthService, type HealthStats, type HealthSummary } from "./healthTypes";

// Web / default fallback: no health data source.
const service: HealthService = {
  async isAvailable() {
    return false;
  },
  async requestAuthorization() {
    return false;
  },
  async getSummary(): Promise<HealthSummary> {
    return emptyHealthSummary;
  },
  async getStats(): Promise<HealthStats> {
    return emptyHealthStats;
  },
};

export default service;
export * from "./healthTypes";
