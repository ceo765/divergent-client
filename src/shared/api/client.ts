import Config from "@/services/Config";
import { readDownloadResponse } from "@/platform/download";
import { streamFetch } from "@/platform/streamFetch";
import { clearSessionToken, readSessionToken, writeSessionToken } from "@/platform/session";
import { createChallengePhotoUploadBody, createReportUploadBody } from "@/platform/upload";
import type {
  AIChatResponse,
  Challenge,
  ChallengeApi,
  ChallengeCheckIn,
  ChallengeCheckInInput,
  ChallengeGroupMessage,
  ChallengeParticipant,
  ChallengeInput,
  FriendInput,
  FriendSummary,
  Goal,
  Note,
  CollectionItem,
  OnboardingStepKey,
  Reminder,
  ReportUploadPayload,
  Reward,
  User,
  ProgressOverview,
  ProgressDayDetail,
  PersonalChallengeGoalInput,
  MissionKey,
  MissionState,
} from "@/types";

const API_TIMEOUT_MS = 15000;
const AI_API_TIMEOUT_MS = 180000;
const AI_JOB_POLL_INTERVAL_MS = 1500;

type AIChatStreamHandlers = {
  onAccepted?: () => void;
  onMessage?: (message: string) => void;
  onStatus?: (status: "started" | "streaming" | "completed") => void;
  onDraftStatus?: (status: "preparing") => void;
};

export type RegisterPushDevicePayload = {
  platform: string;
  expoPushToken: string;
  deviceId?: string;
  appVersion?: string;
};

type AIChatJobStatus = "pending" | "running" | "completed" | "failed";

type AIChatJobResponse = {
  id: string;
  status: AIChatJobStatus;
  createdAt: string;
  updatedAt: string;
  result?: AIChatResponse;
  error?: string;
};

function isPublicAuthRoute(url: string) {
  return (
    url === "/api/auth/login" ||
    url === "/api/auth/register" ||
    url === "/api/auth/password-reset/request" ||
    url === "/api/auth/password-reset/confirm"
  );
}

function normalizeFriend(friend: Partial<FriendSummary> & { id: string; name: string; level: number; currentXp: number }): FriendSummary {
  return {
    id: friend.id,
    name: friend.name,
    level: friend.level,
    avatarUrl: friend.avatarUrl,
    currentXp: friend.currentXp ?? 0,
    totalGoals: friend.totalGoals ?? 0,
    completedGoals: friend.completedGoals ?? 0,
    streak: friend.streak ?? 0,
    rank: friend.rank ?? undefined,
  };
}

type FetchJSONOptions = RequestInit & {
  timeoutMs?: number;
};

async function fetchWithAuth(url: string, options: FetchJSONOptions = {}, fetchImpl: typeof fetch = fetch) {
  const { timeoutMs, ...requestOptions } = options;
  const isFormData = options.body instanceof FormData;
  const baseUrl = Config.data.api.http.baseURL;
  const publicAuthRoute = isPublicAuthRoute(url);
  const sessionToken = publicAuthRoute ? null : await readSessionToken();
  const controller = new AbortController();
  const requestTimeoutMs = timeoutMs ?? API_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetchImpl(baseUrl + url, {
      ...requestOptions,
      credentials: publicAuthRoute ? "omit" : "include",
      signal: controller.signal,
      headers: {
        ...(baseUrl.includes("ngrok-free.dev") ? { "ngrok-skip-browser-warning": "true" } : {}),
        ...(!isFormData ? { "Content-Type": "application/json" } : {}),
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        ...(requestOptions.headers || {}),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out for ${url}`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchJSON(url: string, options: FetchJSONOptions = {}) {
  const res = await fetchWithAuth(url, options);

  const nextSessionToken = res.headers.get("x-session-token");
  if (nextSessionToken) {
    await writeSessionToken(nextSessionToken);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    if (res.status === 401) {
      await clearSessionToken();
    }

    if (contentType.includes("application/json")) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error || `API error: ${res.status}`);
    }

    const text = await res.text();
    throw new Error(text || `API error: ${res.status}`);
  }

  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Expected JSON but received ${contentType || "unknown content type"}: ${text.slice(0, 120)}`);
  }

  return res.json();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function supportsStreamingAiRequests() {
  return typeof TextDecoder !== "undefined";
}

function shouldFallbackToAIJob(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message === "Streaming response body is not available" ||
    error.message.includes("getReader") ||
    error.message.includes("TextDecoder") ||
    error.message.includes("ReadableStream")
  );
}

function parseSseEventBlock(block: string) {
  const lines = block
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith(":")) {
      continue;
    }

    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }

  if (!dataLines.length) {
    return null;
  }

  try {
    return {
      event,
      data: JSON.parse(dataLines.join("\n")) as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}

export async function loginWithCredentials(email: string, password: string) {
  return fetchJSON("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string, name?: string) {
  return fetchJSON("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function loginWithTelegramIdToken(idToken: string) {
  return fetchJSON("/api/auth/telegram/native-login", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export async function registerPushDevice(payload: RegisterPushDevicePayload) {
  return fetchJSON("/api/push/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function unregisterPushDevice(payload: { expoPushToken?: string; deviceId?: string }) {
  return fetchJSON("/api/push/unregister", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logout() {
  const result = await fetchJSON("/api/auth/logout", {
    method: "POST",
  });
  await clearSessionToken();
  return result;
}

export async function requestPasswordReset(email: string): Promise<{ ok: true; resetUrl?: string }> {
  return fetchJSON("/api/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function confirmPasswordReset(token: string, password: string) {
  return fetchJSON("/api/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export async function fetchUser() {
  return fetchJSON("/api/user");
}

export async function updateUser(patch: Partial<User>) {
  return fetchJSON("/api/user", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function completeOnboardingStep(step: OnboardingStepKey) {
  return fetchJSON("/api/user/onboarding", {
    method: "PATCH",
    body: JSON.stringify({ step }),
  });
}

export async function deleteAccount() {
  const result = await fetchJSON("/api/user", {
    method: "DELETE",
  });
  await clearSessionToken();
  return result;
}

export async function setCredentials(password: string, email?: string, currentPassword?: string) {
  return fetchJSON("/api/user/credentials", {
    method: "POST",
    body: JSON.stringify({ email, password, currentPassword }),
  });
}

export async function fetchGoals(): Promise<Goal[]> {
  return fetchJSON("/api/goals");
}

export async function fetchArchivedGoals(): Promise<Goal[]> {
  return fetchJSON("/api/goals/archived");
}

export async function fetchNotes(): Promise<Note[]> {
  return fetchJSON("/api/notes");
}

export async function createNote(input: { title?: string | null; body: string }): Promise<Note> {
  return fetchJSON("/api/notes", { method: "POST", body: JSON.stringify(input) });
}

export async function updateNote(id: string, input: { title?: string | null; body?: string }): Promise<Note> {
  return fetchJSON(`/api/notes/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteNote(id: string) {
  return fetchJSON(`/api/notes/${id}`, { method: "DELETE" });
}

export async function fetchCollections(): Promise<CollectionItem[]> {
  return fetchJSON("/api/collections");
}

export async function createCollectionItem(input: {
  type: string;
  title: string;
  author?: string | null;
  status?: CollectionItem["status"];
  note?: string | null;
  eventDate?: string | null;
  location?: string | null;
  reminderAt?: string | null;
}): Promise<CollectionItem> {
  return fetchJSON("/api/collections", { method: "POST", body: JSON.stringify(input) });
}

export async function collectionToGoal(id: string, goalId: string): Promise<CollectionItem> {
  return fetchJSON(`/api/collections/${id}/to-goal`, { method: "POST", body: JSON.stringify({ goalId }) });
}

export async function updateCollectionItem(id: string, input: Partial<Pick<CollectionItem, "title" | "author" | "status" | "rating" | "note" | "eventDate" | "location" | "reminderAt">>): Promise<CollectionItem> {
  return fetchJSON(`/api/collections/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteCollectionItem(id: string) {
  return fetchJSON(`/api/collections/${id}`, { method: "DELETE" });
}

export async function archiveGoal(id: string) {
  return fetchJSON(`/api/goals/${id}/archive`, { method: "POST" });
}

export async function unarchiveGoal(id: string) {
  return fetchJSON(`/api/goals/${id}/unarchive`, { method: "POST" });
}

export async function healthCompleteGoal(goalId: string, workoutId: string): Promise<{ applied: boolean }> {
  return fetchJSON(`/api/goals/${goalId}/health-complete`, {
    method: "POST",
    body: JSON.stringify({ workoutId }),
  });
}

export async function createGoal(goal: Goal) {
  return fetchJSON("/api/goals", {
    method: "POST",
    body: JSON.stringify(goal),
  });
}

export async function updateGoal(goal: Goal) {
  return fetchJSON(`/api/goals/${goal.id}`, {
    method: "PUT",
    body: JSON.stringify(goal),
  });
}

export async function deleteGoal(id: string) {
  return fetchJSON(`/api/goals/${id}`, { method: "DELETE" });
}

export async function deleteReminder(id: string) {
  return fetchJSON(`/api/reminders/${id}`, { method: "DELETE" });
}

export async function deleteReward(id: string) {
  return fetchJSON(`/api/rewards/${id}`, { method: "DELETE" });
}

export async function toggleTask(
  taskId: string,
  setLog?: { weight?: number | null; reps?: number | null }
) {
  return fetchJSON(`/api/tasks/toggle`, {
    method: "POST",
    body: JSON.stringify({ taskId, ...(setLog ?? {}) }),
  });
}

export type SetHistory = {
  last: { weight: number | null; reps: number | null } | null;
  history: { id: string; weight: number | null; reps: number | null; createdAt: string }[];
};

export async function getSetHistory(taskId: string) {
  return fetchJSON(`/api/tasks/${taskId}/set-history`) as Promise<SetHistory>;
}

export async function updateCompletionSetLog(
  completionId: string,
  setLog: { weight?: number | null; reps?: number | null }
) {
  return fetchJSON(`/api/tasks/completion/${completionId}`, {
    method: "PATCH",
    body: JSON.stringify(setLog),
  });
}

export async function addReport(taskId: string, data: ReportUploadPayload) {
  const res = await fetchJSON(`/api/tasks/${taskId}/report`, {
    method: "POST",
    body: createReportUploadBody(data),
  });

  return res as Promise<{ goal: Goal; user: User }>;
}

export async function getReports(challengeId: string) {
  return await fetchJSON(`/api/challenges/${challengeId}/reports`, {
    method: "GET",
  });
}

export async function getParticipants(challengeId: string) {
  return await fetchJSON(`/api/challenges/${challengeId}/participants`, {
    method: "GET",
  });
}

export async function joinChallengeWithPersonalGoal(
  challengeId: string,
  goal: PersonalChallengeGoalInput,
): Promise<ChallengeParticipant> {
  return fetchJSON(`/api/challenges/${challengeId}/join`, {
    method: "POST",
    body: JSON.stringify(goal),
  });
}

export async function getMyChallengePlan(challengeId: string): Promise<ChallengeParticipant> {
  return fetchJSON(`/api/challenges/${challengeId}/my-plan`);
}

export async function updateMyChallengePlan(
  challengeId: string,
  goal: Partial<PersonalChallengeGoalInput>,
): Promise<ChallengeParticipant> {
  return fetchJSON(`/api/challenges/${challengeId}/my-plan`, {
    method: "PATCH",
    body: JSON.stringify(goal),
  });
}

export async function getChallengeCheckIns(challengeId: string): Promise<ChallengeCheckIn[]> {
  return fetchJSON(`/api/challenges/${challengeId}/check-ins`);
}

export async function submitChallengeCheckIn(
  challengeId: string,
  input: ChallengeCheckInInput,
): Promise<ChallengeCheckIn> {
  return fetchJSON(`/api/challenges/${challengeId}/check-ins`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getChallengeMessages(challengeId: string): Promise<ChallengeGroupMessage[]> {
  return fetchJSON(`/api/challenges/${challengeId}/messages`);
}

export async function sendChallengeMessage(challengeId: string, content: string): Promise<ChallengeGroupMessage> {
  return fetchJSON(`/api/challenges/${challengeId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function sendChallengePhoto(challengeId: string, photo: ReportUploadPayload): Promise<ChallengeGroupMessage> {
  return fetchJSON(`/api/challenges/${challengeId}/messages/photo`, {
    method: "POST",
    body: createChallengePhotoUploadBody(photo),
  });
}

export async function getMissions(): Promise<MissionState> {
  return fetchJSON("/api/missions");
}

export async function markMissionIntroSeen(): Promise<MissionState> {
  return fetchJSON("/api/missions/intro-seen", { method: "POST", body: JSON.stringify({}) });
}

export async function claimMissionReward(missionKey: MissionKey): Promise<MissionState & { user: Pick<User, "xp" | "level" | "xpInCurrentLevel" | "requiredXp"> }> {
  return fetchJSON(`/api/missions/${missionKey}/claim`, { method: "POST", body: JSON.stringify({}) });
}

export async function recordProgressViewed(): Promise<MissionState> {
  return fetchJSON("/api/missions/events/progress-viewed", { method: "POST", body: JSON.stringify({}) });
}

export async function getChallengePhoto(imageUrl: string): Promise<Blob> {
  const response = await fetchWithAuth(imageUrl);
  if (!response.ok) throw new Error(`Failed to load challenge photo: ${response.status}`);
  return response.blob();
}

export function resolveApiUrl(path?: string | null) {
  return path ? `${Config.data.api.http.baseURL}${path}` : "";
}

export async function editChallengeMessage(challengeId: string, messageId: string, content: string): Promise<ChallengeGroupMessage> {
  return fetchJSON(`/api/challenges/${challengeId}/messages/${messageId}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
}

export async function deleteChallengeMessage(challengeId: string, messageId: string): Promise<ChallengeGroupMessage> {
  return fetchJSON(`/api/challenges/${challengeId}/messages/${messageId}`, { method: "DELETE" });
}

export async function getActivity(goalId: string) {
  return await fetchJSON(`/api/goals/${goalId}/activity`, {
    method: "GET",
  });
}

export async function getGoalXp(goalId: string) {
  return await fetchJSON(`/api/goals/${goalId}/xp`, {
    method: "GET",
  });
}

export async function getProgressOverview() {
  return (await fetchJSON(`/api/progress/overview`, {
    method: "GET",
  })) as ProgressOverview;
}

export async function getProgressDay(date: string) {
  return (await fetchJSON(`/api/progress/day/${date}`, {
    method: "GET",
  })) as ProgressDayDetail;
}

export async function kickParticipant(challengeId: string, userId: string) {
  return await fetchJSON(`/api/challenges/${challengeId}/participants/${userId}`, {
    method: "DELETE",
  });
}

async function createAIChatJob(message: string, category?: string | null) {
  return (await fetchJSON(`/api/ai/chat`, {
    method: "POST",
    body: JSON.stringify({ message, category: category ?? undefined }),
  })) as AIChatJobResponse;
}

async function waitForAIChatJob(jobId: string) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < AI_API_TIMEOUT_MS) {
    const currentJob = (await fetchJSON(`/api/ai/chat/${jobId}`, {
      method: "GET",
    })) as AIChatJobResponse;

    if (currentJob.status === "completed" && currentJob.result) {
      return currentJob.result;
    }

    if (currentJob.status === "failed") {
      throw new Error(currentJob.error || "AI request failed");
    }

    await sleep(AI_JOB_POLL_INTERVAL_MS);
  }

  throw new Error("AI job timed out");
}

export async function chatAI(message: string) {
  const job = await createAIChatJob(message);
  return waitForAIChatJob(job.id);
}

export async function chatAIStream(message: string, handlers: AIChatStreamHandlers = {}, category?: string | null) {
  if (!supportsStreamingAiRequests()) {
    const job = await createAIChatJob(message, category);
    handlers.onAccepted?.();
    handlers.onStatus?.("started");
    return waitForAIChatJob(job.id);
  }

  try {
    const res = await fetchWithAuth(`/api/ai/chat/stream`, {
      method: "POST",
      body: JSON.stringify({ message, category: category ?? undefined }),
      timeoutMs: AI_API_TIMEOUT_MS,
    }, streamFetch);

    const nextSessionToken = res.headers.get("x-session-token");
    if (nextSessionToken) {
      await writeSessionToken(nextSessionToken);
    }

    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
      if (res.status === 401) {
        await clearSessionToken();
      }

      if (contentType.includes("application/json")) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || `API error: ${res.status}`);
      }

      const text = await res.text();
      throw new Error(text || `API error: ${res.status}`);
    }

    if (!contentType.includes("text/event-stream")) {
      throw new Error(`Expected event stream but received ${contentType || "unknown content type"}`);
    }

    if (!res.body) {
      throw new Error("Streaming response body is not available");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalResult: AIChatResponse | null = null;
    let streamError: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? "";

      for (const block of blocks) {
        const parsed = parseSseEventBlock(block);
        if (!parsed) {
          continue;
        }

        if (parsed.event === "status") {
          const status = parsed.data.status;
          if (status === "started" || status === "streaming" || status === "completed") {
            handlers.onStatus?.(status);
          }
          continue;
        }

        if (parsed.event === "ready") {
          handlers.onAccepted?.();
          continue;
        }

        if (parsed.event === "message" && typeof parsed.data.content === "string") {
          handlers.onMessage?.(parsed.data.content);
          continue;
        }

        if (parsed.event === "draft_status") {
          const status = parsed.data.status;
          if (status === "preparing") {
            handlers.onDraftStatus?.(status);
          }
          continue;
        }

        if (parsed.event === "result") {
          finalResult = parsed.data as unknown as AIChatResponse;
          continue;
        }

        if (parsed.event === "error" && typeof parsed.data.error === "string") {
          streamError = parsed.data.error;
          continue;
        }
      }

      if (done) {
        break;
      }
    }

    if (streamError) {
      throw new Error(streamError);
    }

    if (!finalResult) {
      throw new Error("AI stream ended without a final result");
    }

    return finalResult;
  } catch (error) {
    if (!shouldFallbackToAIJob(error)) {
      throw error;
    }

    const job = await createAIChatJob(message);
    handlers.onAccepted?.();
    handlers.onStatus?.("started");
    return waitForAIChatJob(job.id);
  }
}

export async function getChatHistory(category?: string | null) {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  return await fetchJSON(`/api/ai/chat${qs}`, {
    method: "GET",
  });
}

export type CoachPrompt = { category: string; label: string; basePrompt: string | null; recommended: string };

export async function getCoachPrompt(category: string) {
  return (await fetchJSON(`/api/ai/coach/${encodeURIComponent(category)}/prompt`, {
    method: "GET",
  })) as CoachPrompt;
}

export async function saveCoachPrompt(category: string, basePrompt: string | null) {
  return await fetchJSON(`/api/ai/coach/${encodeURIComponent(category)}/prompt`, {
    method: "PUT",
    body: JSON.stringify({ basePrompt }),
  });
}

export async function addDraft(messageId: string) {
  return await fetchJSON(`/api/ai/add_draft`, {
    method: "POST",
    body: JSON.stringify({ messageId }),
  });
}

export async function downloadReport(reportId: string): Promise<Blob> {
  const baseUrl = Config.data.api.http.baseURL;
  const sessionToken = await readSessionToken();
  const res = await fetch(baseUrl + `/api/reports/${reportId}/download`, {
    method: "GET",
    credentials: "include",
    headers: {
      ...(baseUrl.includes("ngrok-free.dev") ? { "ngrok-skip-browser-warning": "true" } : {}),
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Download error: ${res.status}`);
  }

  return await readDownloadResponse(res);
}

export async function updateGoalProgress(goalId: string, delta: number) {
  return fetchJSON(`/api/goals/${goalId}/progress`, {
    method: "POST",
    body: JSON.stringify({ delta }),
  });
}

export async function fetchChallenges(): Promise<Challenge[]> {
  return fetchJSON("/api/challenges");
}

export async function createChallenge(data: ChallengeInput): Promise<Challenge> {
  return fetchJSON("/api/challenges", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateChallenge(data: ChallengeInput): Promise<ChallengeApi> {
  return fetchJSON(`/api/challenges/${data.id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function fetchLeaderboard(id: string) {
  return fetchJSON(`/api/challenges/${id}/leaderboard`, {
    method: "GET",
  });
}

export async function leaveChallenge(id: string) {
  return fetchJSON(`/api/challenges/leave`, {
    method: "POST",
    body: JSON.stringify({ challengeId: id }),
  });
}

export async function payChallenge(id: string, method: string, returnUrl?: string) {
  return fetchJSON(`/api/payments/create`, {
    method: "POST",
    body: JSON.stringify({ challengeId: id, method, returnUrl }),
  });
}

export async function fetchPaymentStatus(paymentId: string) {
  return fetchJSON(`/api/payments/${paymentId}/status`, {
    method: "GET",
  });
}

export async function acceptChallenge(id: string) {
  return fetchJSON(`/api/challenges/accept`, {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function fetchRewards(): Promise<Reward[]> {
  return fetchJSON("/api/rewards");
}

export async function createReward(reward: Reward) {
  return fetchJSON("/api/rewards", {
    method: "POST",
    body: JSON.stringify(reward),
  });
}

export async function updateReward(reward: Reward) {
  return fetchJSON(`/api/rewards/${reward.id}`, {
    method: "PATCH",
    body: JSON.stringify(reward),
  });
}

export async function claimReward(id: string) {
  return fetchJSON(`/api/rewards/${id}/claim`, { method: "POST" });
}

export async function fetchReminders(): Promise<Reminder[]> {
  return fetchJSON("/api/reminders");
}

export async function createReminder(reminder: Reminder) {
  return fetchJSON("/api/reminders", {
    method: "POST",
    body: JSON.stringify(reminder),
  });
}

export async function updateReminder(reminder: Reminder) {
  return fetchJSON(`/api/reminders/${reminder.id}`, {
    method: "PATCH",
    body: JSON.stringify(reminder),
  });
}

export async function toggleReminder(id: string) {
  return fetchJSON(`/api/reminders/${id}/toggle`, { method: "PATCH" });
}

export async function markReminderDone(id: string) {
  return fetchJSON(`/api/reminders/${id}/done`, { method: "POST" });
}

export async function snoozeReminder(id: string, minutes = 10) {
  return fetchJSON(`/api/reminders/${id}/snooze`, {
    method: "POST",
    body: JSON.stringify({ minutes }),
  });
}

export async function skipReminder(id: string) {
  return fetchJSON(`/api/reminders/${id}/skip`, { method: "POST" });
}

export async function fetchFriends(): Promise<FriendSummary[]> {
  const friends = (await fetchJSON("/api/friends")) as FriendSummary[];
  return friends.map((friend) => normalizeFriend(friend));
}

export async function createFriend(friend: FriendInput): Promise<FriendSummary> {
  const createdFriend = (await fetchJSON("/api/friends", {
    method: "POST",
    body: JSON.stringify(friend),
  })) as FriendSummary;

  return normalizeFriend(createdFriend);
}

export async function fetchCategories(): Promise<{ value: string; label: string }[]> {
  return fetchJSON("/api/categories");
}
