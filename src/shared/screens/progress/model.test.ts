import assert from "node:assert/strict";
import test from "node:test";

import dayjs from "dayjs";
import type { GoalActivity } from "../../../types/index.ts";

import { buildProgressActivityView, getActivityCellStatus } from "./model.ts";

const makeWeeklyActivity = (): GoalActivity => {
  const previousWeek = dayjs().subtract(1, "week").startOf("isoWeek");
  const currentWeek = dayjs().startOf("isoWeek");

  return {
    currentStreak: 0,
    longestStreak: 0,
    period: "DAILY",
    data: [
      { periodStart: previousWeek.format("YYYY-MM-DD"), completed: 1, total: 2, status: "partial", xp: 5 },
      { periodStart: previousWeek.add(1, "day").format("YYYY-MM-DD"), completed: 1, total: 2, status: "partial", xp: 5 },
      { periodStart: currentWeek.format("YYYY-MM-DD"), completed: 1, total: 2, status: "partial", xp: 5 },
      { periodStart: currentWeek.add(1, "day").format("YYYY-MM-DD"), completed: 1, total: 2, status: "partial", xp: 5 },
    ],
  };
};

const makeMonthlyActivity = (): GoalActivity => {
  const month = dayjs().startOf("month");
  return {
    currentStreak: 0,
    longestStreak: 0,
    period: "DAILY",
    data: [
      { periodStart: month.add(1, "day").format("YYYY-MM-DD"), completed: 1, total: 2, status: "partial", xp: 5 },
      { periodStart: month.add(2, "day").format("YYYY-MM-DD"), completed: 1, total: 2, status: "partial", xp: 5 },
    ],
  };
};

test("groups weekly activity into one shared bucket for coloring", () => {
  const activity = makeWeeklyActivity();
  const view = buildProgressActivityView(activity, "WEEKLY", "en");

  for (const item of activity.data) assert.equal(view.dateStatusMap.get(item.periodStart), "full");
  assert.equal(view.currentStreak, 2);
  assert.equal(view.longestStreak, 2);
  assert.deepEqual(view.streakItems.map((item) => item.active), [false, false, false, false, false, true, true]);
  assert.equal(view.streakItems[0].label.length > 0, true);
});

test("groups monthly activity into one shared bucket for coloring", () => {
  const activity = makeMonthlyActivity();
  const view = buildProgressActivityView(activity, "MONTHLY", "ru");

  for (const item of activity.data) assert.equal(view.dateStatusMap.get(item.periodStart), "full");
  assert.equal(view.currentStreak, 1);
  assert.equal(view.longestStreak, 1);
  assert.equal(view.streakItems.length, 7);
  assert.equal(view.streakItems[6].label.length > 0, true);
});

test("marks missed periods red only after goal creation and outside the current period", () => {
  const goal = {
    id: "goal-1",
    title: "Goal",
    category: "work",
    goalType: "TASK",
    goalPeriod: "WEEKLY",
    tasks: [],
    createdAt: dayjs().subtract(2, "week").toISOString(),
  } as never;

  const dateStatusMap = new Map<string, "empty" | "partial" | "full">();
  const missedDay = dayjs().subtract(1, "week");
  const beforeCreationDay = dayjs().subtract(3, "week");
  const currentPeriodDay = dayjs();

  assert.equal(getActivityCellStatus(missedDay, goal, dateStatusMap), "missed");
  assert.equal(getActivityCellStatus(beforeCreationDay, goal, dateStatusMap), "empty");
  assert.equal(getActivityCellStatus(currentPeriodDay, goal, dateStatusMap), "empty");
});
