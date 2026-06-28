import assert from "node:assert/strict";
import test from "node:test";

import { formatChallengeReportError } from "./challengeErrors.ts";

test("translates challenge report timing errors", () => {
  assert.equal(formatChallengeReportError(new Error("Challenge has not started")), "Челлендж ещё не начался.");
  assert.equal(formatChallengeReportError(new Error("No report is required today")), "Сегодня отчёт сдавать не нужно.");
});

test("falls back to a safe generic report error", () => {
  assert.equal(
    formatChallengeReportError(new Error("Unknown")),
    "Не удалось отправить отчёт. Проверьте данные и попробуйте ещё раз.",
  );
});
