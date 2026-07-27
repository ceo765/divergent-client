import { emptyHealthSummary, type HealthService, type HealthSummary } from "./healthTypes";

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
};

export default service;
export * from "./healthTypes";
