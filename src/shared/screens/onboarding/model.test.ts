import assert from "node:assert/strict";
import test from "node:test";

import { buildOnboardingChecklist } from "./model.ts";

test("builds onboarding checklist from goals, reminders and streaks", () => {
  const checklist = buildOnboardingChecklist(
    [
      {
        id: "goal-1",
        title: "Goal",
        category: "work",
        goalType: "TASK",
        goalPeriod: "DAILY",
        tasks: [
          {
            id: "task-1",
            title: "Task",
            lastCompletedAt: "",
          },
        ],
      } as never,
      {
        id: "goal-2",
        title: "Numeric",
        category: "personal",
        goalType: "PROGRESS",
        goalPeriod: "NONE",
        tasks: [],
      } as never,
    ],
    [
      {
        id: "reminder-1",
        title: "Reminder",
        time: "09:00",
        daysOfWeek: [],
        daysOfMonth: [],
        isActive: true,
      } as never,
    ],
    undefined,
    true,
  );

  assert.equal(checklist.completedCount, 4);
  assert.equal(checklist.totalCount, 5);
  assert.equal(checklist.nextStep, "set_completion_threshold");
  assert.equal(checklist.isComplete, false);
  assert.deepEqual(
    checklist.steps.map((step) => [step.key, step.completed]),
    [
      ["created_first_goal", true],
      ["created_first_numeric_goal", true],
      ["set_completion_threshold", false],
      ["started_first_streak", true],
      ["created_first_reminder", true],
    ],
  );
});

test("marks checklist complete when all onboarding steps are done", () => {
  const checklist = buildOnboardingChecklist(
    [
      {
        id: "goal-1",
        title: "Goal",
        category: "work",
        goalType: "TASK",
        goalPeriod: "DAILY",
        tasks: [
          {
            id: "task-1",
            title: "Task",
            lastCompletedAt: "2026-06-08T10:00:00.000Z",
            xpReward: 10,
          },
        ],
        taskXpTarget: 10,
      } as never,
      {
        id: "goal-2",
        title: "Numeric",
        category: "personal",
        goalType: "PROGRESS",
        goalPeriod: "NONE",
        tasks: [],
      } as never,
    ],
    [
      {
        id: "reminder-1",
        title: "Reminder",
        time: "09:00",
        daysOfWeek: [],
        daysOfMonth: [],
        isActive: true,
      } as never,
    ],
    undefined,
    true,
  );

  assert.equal(checklist.isComplete, true);
  assert.equal(checklist.nextStep, null);
});

test("prefers persisted onboarding state over derived fallback", () => {
  const checklist = buildOnboardingChecklist(
    [],
    [],
    {
      created_first_goal: "2026-06-08T10:00:00.000Z",
      created_first_numeric_goal: "2026-06-08T10:01:00.000Z",
      set_completion_threshold: "2026-06-08T10:02:00.000Z",
      started_first_streak: "2026-06-08T10:03:00.000Z",
    },
    false,
  );

  assert.equal(checklist.completedCount, 4);
  assert.equal(checklist.nextStep, "created_first_reminder");
  assert.deepEqual(
    checklist.steps.map((step) => [step.key, step.completed]),
    [
      ["created_first_goal", true],
      ["created_first_numeric_goal", true],
      ["set_completion_threshold", true],
      ["started_first_streak", true],
      ["created_first_reminder", false],
    ],
  );
});
