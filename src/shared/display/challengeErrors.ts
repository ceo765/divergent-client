const REPORT_ERROR_MESSAGES: Record<string, string> = {
  "Challenge has not started": "Челлендж ещё не начался.",
  "Challenge has ended": "Челлендж уже завершён.",
  "No report is required today": "Сегодня отчёт сдавать не нужно.",
  "Challenge participation required": "Для отправки отчёта нужно участвовать в челлендже.",
};

export function formatChallengeReportError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Не удалось отправить отчёт.";
  }

  return REPORT_ERROR_MESSAGES[error.message] || "Не удалось отправить отчёт. Проверьте данные и попробуйте ещё раз.";
}
