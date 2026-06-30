import test from "node:test";
import assert from "node:assert/strict";

import { parseNativeAppRoute, parseNativeAuthRoute, parseNativeRoute } from "./router.native.ts";

test("parses app routes from preview-style query urls", () => {
  assert.deepEqual(
    parseNativeAppRoute("https://localhost:8081/native-preview.html?tab=goals&id=goal-1"),
    {
      kind: "app",
      tab: "goals",
      goalId: "goal-1",
      reportTaskId: null,
      onboarding: null,
    },
  );

  assert.deepEqual(
    parseNativeAppRoute("https://localhost:8081/native-preview.html?tab=reminders&goalId=goal-1&id=reminder-1"),
    { kind: "app", tab: "reminders", goalId: "goal-1", reminderId: "reminder-1" },
  );
});

test("parses app routes from native scheme urls", () => {
  assert.deepEqual(
    parseNativeAppRoute("divergent://challenges?id=challenge-1&paymentId=payment-1"),
    { kind: "app", tab: "challenges", focusId: "challenge-1", paymentId: "payment-1" },
  );

  assert.deepEqual(
    parseNativeAppRoute("divergent://progress?goalId=goal-1"),
    { kind: "app", tab: "progress", goalId: "goal-1" },
  );

  assert.deepEqual(parseNativeAppRoute("divergent://missions"), { kind: "app", tab: "missions" });
});

test("parses auth routes including reset confirmation", () => {
  assert.deepEqual(
    parseNativeAuthRoute("divergent://reset?token=secret&email=user@example.com"),
    {
      kind: "auth",
      tab: "reset",
      resetMode: "confirm",
      email: "user@example.com",
      token: "secret",
      resetStatus: undefined,
      error: undefined,
      errorDetail: undefined,
    },
  );

  assert.deepEqual(
    parseNativeRoute("https://localhost:8081/native-preview.html?tab=signup&email=user@example.com"),
    {
      kind: "auth",
      tab: "signup",
      email: "user@example.com",
      resetMode: undefined,
      token: undefined,
      authToken: undefined,
      referrerId: undefined,
      referrerLinkId: undefined,
      resetStatus: undefined,
      error: undefined,
      errorDetail: undefined,
    },
  );
});

test("returns null for invalid urls", () => {
  assert.equal(parseNativeRoute("not-a-url"), null);
});
