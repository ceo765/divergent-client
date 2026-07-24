import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek.js";

import { formatStreakPeriodLabel } from "../../display/streak.ts";
import type { Goal, GoalActivity, GoalPeriod, GridItem } from "../../../types/index.ts";

dayjs.extend(isoWeek);

type PeriodBucket = {
  periodStart: string;
  completed: number;
  total: number;
  xp: number;
};

export type ProgressActivityView = {
  dateStatusMap: Map<string, GridItem["status"]>;
  periodData: GridItem[];
  currentStreak: number;
  longestStreak: number;
  streakItems: { active: boolean; label: string }[];
  streakDays: boolean[];
};

export type ActivityCellStatus = GridItem["status"] | "missed";

function getPeriodStart(date: dayjs.Dayjs, goalPeriod: GoalPeriod) {
  if (goalPeriod === "WEEKLY") {
    return date.startOf("isoWeek");
  }

  if (goalPeriod === "MONTHLY") {
    return date.startOf("month");
  }

  return date.startOf("day");
}

function getBucketStatus(completed: number, total: number): GridItem["status"] {
  if (completed === 0) {
    return "empty";
  }

  if (completed >= total) {
    return "full";
  }

  return "partial";
}

function getPeriodData(activity: GoalActivity | undefined, goalPeriod: GoalPeriod | undefined | null) {
  if (!activity || !goalPeriod || goalPeriod === "NONE" || activity.data.length === 0) {
    return [];
  }

  const buckets = new Map<string, PeriodBucket>();

  for (const item of activity.data) {
    const date = dayjs(item.periodStart);
    const periodStart = getPeriodStart(date, goalPeriod);
    const key = periodStart.format("YYYY-MM-DD");
    const bucket = buckets.get(key) ?? {
      periodStart: key,
      completed: 0,
      total: item.total,
      xp: 0,
    };

    bucket.completed += item.completed;
    bucket.total = Math.max(bucket.total, item.total);
    bucket.xp += item.xp;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values())
    .sort((left, right) => dayjs(left.periodStart).valueOf() - dayjs(right.periodStart).valueOf())
    .map((bucket) => ({
      periodStart: bucket.periodStart,
      completed: bucket.completed,
      total: bucket.total,
      xp: bucket.xp,
      status: getBucketStatus(bucket.completed, bucket.total),
    }));
}

function getStreaks(periodData: GridItem[]) {
  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;

  for (const item of periodData) {
    if (item.status === "full") {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }
  }

  for (let index = periodData.length - 1; index >= 0; index--) {
    if (periodData[index].status === "full") {
      currentStreak++;
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak };
}

function getStreakReferenceDate(goalPeriod: GoalPeriod, offset: number) {
  if (goalPeriod === "WEEKLY") {
    return dayjs().subtract(offset, "week");
  }

  if (goalPeriod === "MONTHLY") {
    return dayjs().subtract(offset, "month");
  }

  return dayjs().subtract(offset, "day");
}

function isSameOrAfterStart(date: dayjs.Dayjs, start: dayjs.Dayjs) {
  return date.valueOf() >= start.valueOf();
}

function isInPastPeriod(date: dayjs.Dayjs, goalPeriod: GoalPeriod) {
  const currentPeriodStart = getPeriodStart(dayjs(), goalPeriod);
  const datePeriodStart = getPeriodStart(date, goalPeriod);
  return datePeriodStart.valueOf() < currentPeriodStart.valueOf();
}

function getGoalCreationDate(goal: Goal) {
  return goal.createdAt ? dayjs(goal.createdAt) : null;
}

export function getActivityCellStatus(
  date: dayjs.Dayjs,
  goal: Goal,
  dateStatusMap: Map<string, GridItem["status"]>,
): ActivityCellStatus {
  const status = dateStatusMap.get(date.format("YYYY-MM-DD")) || "empty";

  if (status !== "empty") {
    return status;
  }

  if (!goal.createdAt) {
    return status;
  }

  const goalCreatedAt = getGoalCreationDate(goal);
  if (!goalCreatedAt) {
    return status;
  }

  const createdAtDay = goalCreatedAt.startOf("day");
  if (!isSameOrAfterStart(date, createdAtDay)) {
    return status;
  }

  if (!isInPastPeriod(date, goal.goalPeriod)) {
    return status;
  }

  return "missed";
}

export function buildProgressActivityView(
  activity: GoalActivity | undefined,
  goalPeriod: GoalPeriod | undefined | null,
  language?: string,
): ProgressActivityView {
  const periodData = getPeriodData(activity, goalPeriod);
  const dateStatusMap = new Map<string, GridItem["status"]>();

  if (!activity || !goalPeriod || goalPeriod === "NONE" || periodData.length === 0) {
    return {
      dateStatusMap,
      periodData,
      currentStreak: 0,
      longestStreak: 0,
      streakItems: Array.from({ length: 7 }, (_, index) => {
        const period = goalPeriod ?? "DAILY";
        const periodStartDate = getPeriodStart(getStreakReferenceDate(period, 6 - index), period);
        return {
          active: false,
          label: formatStreakPeriodLabel(period, periodStartDate, language),
        };
      }),
      streakDays: Array.from({ length: 7 }, () => false),
    };
  }

  const periodStatusByStart = new Map(periodData.map((item) => [item.periodStart, item.status] as const));

  for (const item of activity.data) {
    const date = dayjs(item.periodStart);
    const periodStart = getPeriodStart(date, goalPeriod).format("YYYY-MM-DD");
    dateStatusMap.set(date.format("YYYY-MM-DD"), periodStatusByStart.get(periodStart) ?? "empty");
  }

  const { currentStreak, longestStreak } = getStreaks(periodData);
  const streakItems = Array.from({ length: 7 }, (_, index) => {
    const referenceDate = getStreakReferenceDate(goalPeriod, 6 - index);
    const periodStartDate = getPeriodStart(referenceDate, goalPeriod);
    const periodStart = periodStartDate.format("YYYY-MM-DD");
    const status = periodStatusByStart.get(periodStart) ?? "empty";

    return {
      active: status === "full",
      label: formatStreakPeriodLabel(goalPeriod, periodStartDate, language),
    };
  });
  const streakDays = streakItems.map((item) => item.active);

  return {
    dateStatusMap,
    periodData,
    currentStreak,
    longestStreak,
    streakItems,
    streakDays,
  };
}
