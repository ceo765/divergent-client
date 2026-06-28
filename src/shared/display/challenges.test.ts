import test from "node:test";
import assert from "node:assert/strict";

import { calculateChallengeProgress, formatChallengeDate, getChallengeDerivedState, getChallengeStatusTranslationKey, goalCompleted } from "./challenges.ts";

const baseTaskGoal = {
  id: "goal-task",
  title: "Task goal",
  goalType: "TASK",
  goalPeriod: "DAILY",
  tasks: [],
} as const;

const baseProgressGoal = {
  id: "goal-progress",
  title: "Progress goal",
  goalType: "PROGRESS",
  goalPeriod: "DAILY",
  tasks: [],
} as const;

test("formats challenge date and status translation keys", () => {
  assert.equal(formatChallengeDate("2026-04-29T00:00:00.000Z"), "29.04.2026");
  assert.equal(formatChallengeDate(undefined), "\u2014");
  assert.equal(getChallengeStatusTranslationKey("COMPLETED"), "challenges.status_completed");
  assert.equal(getChallengeStatusTranslationKey("FAILED"), "challenges.status_failed");
  assert.equal(getChallengeStatusTranslationKey("ACTIVE"), "challenges.status_active");
});

test("detects completed goals correctly", () => {
  assert.equal(goalCompleted({ ...baseTaskGoal, lastCompletedAt: "2026-04-29T00:00:00.000Z" } as never), true);
  assert.equal(goalCompleted({ ...baseTaskGoal, lastCompletedAt: undefined } as never), false);
  assert.equal(goalCompleted({ ...baseProgressGoal, currentValue: 5, targetValue: 10 } as never), false);
  assert.equal(goalCompleted({ ...baseProgressGoal, currentValue: 10, targetValue: 10 } as never), true);
});

test("calculates challenge progress across task and numeric goals", () => {
  const result = calculateChallengeProgress([
    { ...baseTaskGoal, lastCompletedAt: "2026-04-29T00:00:00.000Z" } as never,
    { ...baseProgressGoal, currentValue: 5, targetValue: 10 } as never,
  ]);

  assert.equal(result, 0.75);
});

test("derives challenge state for participant", () => {
  const state = getChallengeDerivedState(
    {
      id: "challenge-1",
      creatorId: "creator-1",
      title: "Challenge",
      description: "",
      goals: [{ ...baseTaskGoal, lastCompletedAt: "2026-04-29T00:00:00.000Z" } as never],
      participants: [{ userId: "user-1" }],
      startsAt: "2026-04-20T00:00:00.000Z",
      endsAt: "2026-05-20T00:00:00.000Z",
      isPublic: true,
      price: 0,
      rules: "",
    } as never,
    "user-1",
  );

  assert.equal(state.isParticipant, true);
  assert.equal(state.isCreator, false);
  assert.equal(state.completedGoals, 1);
  assert.equal(state.progress, 1);
  assert.equal(state.challengeStatus, "COMPLETED");
});

test("derives personal challenge progress from participant plan and fact", () => {
  const state = getChallengeDerivedState(
    {
      id: "challenge-personal",
      creatorId: "creator-1",
      title: "Sales sprint",
      goals: [],
      personalGoalsEnabled: true,
      participants: [{ userId: "user-1", targetValue: 10_000_000, currentValue: 7_000_000 }],
    } as never,
    "user-1",
  );

  assert.equal(state.progress, 0.7);
  assert.equal(state.challengeStatus, "ACTIVE");
});

test("does not complete an empty legacy challenge", () => {
  const state = getChallengeDerivedState(
    {
      id: "challenge-empty",
      creatorId: "creator-1",
      title: "Empty",
      goals: [],
      participants: [{ userId: "user-1" }],
    } as never,
    "user-1",
  );

  assert.equal(state.challengeStatus, "ACTIVE");
});

test("does not treat an excluded user as an active participant", () => {
  const state = getChallengeDerivedState(
    {
      id: "challenge-removed",
      creatorId: "creator-1",
      title: "Removed participant",
      goals: [],
      participants: [{ userId: "user-1", status: "REMOVED", missCount: 2 }],
    } as never,
    "user-1",
  );

  assert.equal(state.isParticipant, false);
  assert.equal(state.participant?.status, "REMOVED");
});
