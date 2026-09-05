import type { StateCreator } from "zustand";

import type {
  AIChatResponse,
  CategoryOption,
  Challenge,
  ChallengeParticipant,
  PersonalChallengeGoalInput,
  ChatMessage,
  FriendInput,
  FriendSummary,
  Goal,
  GoalActivity,
  ProgressOverview,
  ProgressDayDetail,
  Leader,
  Note,
  CollectionItem,
  PaymentMethod,
  PaymentMethodType,
  SubscriptionPlan,
  SubscriptionPlans,
  OnboardingStepKey,
  Reminder,
  Report,
  ReportUploadPayload,
  Reward,
  MissionKey,
  MissionState,
  User,
} from "@/types";
import type { ChallengeInput } from "@/types";

type AIChatStreamHandlers = {
  onAccepted?: () => void;
  onMessage?: (message: string) => void;
  onStatus?: (status: "started" | "streaming" | "completed") => void;
  onDraftStatus?: (status: "preparing") => void;
};

export interface AppStoreState {
  initialized: boolean;
  loading: boolean;
  user: User | null;
  token: string | null;
  goals: Goal[];
  archivedGoals: Goal[];
  notes: Note[];
  collections: CollectionItem[];
  challenges: Challenge[];
  rewards: Reward[];
  reminders: Reminder[];
  friends: FriendSummary[];
  categories: CategoryOption[];
  reports: Record<string, Report[]>;
  // Экран «Сегодня»: отмеченные многозадачные цели + стрик «идеальных дней».
  todayChecks: string[];
  todayStreak: number;
  todayLongest: number;
  nativeToast: {
    id: number;
    title: string;
    message?: string;
    tone: "success" | "danger" | "info";
  } | null;
  missionState: MissionState | null;
  missionsLoading: boolean;
  subscriptionPlans: SubscriptionPlans | null;
}

export interface AuthSlice {
  initialize: () => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  loginWithTelegramIdToken: (idToken: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    name?: string,
    referrerId?: string,
    referrerLinkId?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
  setCredentials: (password: string, email?: string, currentPassword?: string) => Promise<void>;
  passwordReset: (email: string) => Promise<{ resetUrl?: string }>;
  confirmPasswordReset: (token: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshAppData: () => Promise<void>;
}

export interface AppStoreActions {
  addChallenge: (challenge: ChallengeInput) => Promise<void>;
  updateChallenge: (challenge: ChallengeInput) => Promise<void>;
  getLeaderboard: (id: string) => Promise<Leader[]>;
  acceptChallenge: (challenge: Challenge) => Promise<void>;
  joinChallengeWithPersonalGoal: (challenge: Challenge, goal: PersonalChallengeGoalInput) => Promise<void>;
  leaveChallenge: (id: string) => Promise<void>;
  deleteChallenge: (id: string) => Promise<void>;
  payChallenge: (challenge: Challenge, method: PaymentMethod, methodType?: PaymentMethodType) => Promise<void>;
  syncPaymentStatus: (paymentId: string) => Promise<"PENDING" | "SUCCESS" | "FAILED" | "CANCELLED">;
  loadSubscriptionPlans: () => Promise<void>;
  startSubscriptionCheckout: (plan: SubscriptionPlan) => Promise<string | null>;
  refreshSubscription: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  resumeSubscription: () => Promise<void>;
  detachPaymentMethod: (id: string) => Promise<void>;
  addCategory: (category: CategoryOption) => void;
  addGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (goal: Goal) => Promise<void>;
  loadArchivedGoals: () => Promise<void>;
  archiveGoal: (id: string) => Promise<void>;
  unarchiveGoal: (id: string) => Promise<void>;
  loadNotes: () => Promise<void>;
  addNote: (input: { title?: string | null; body: string }) => Promise<Note | null>;
  editNote: (id: string, input: { title?: string | null; body?: string }) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  loadCollections: () => Promise<void>;
  addCollectionItem: (input: {
    type: string;
    title: string;
    author?: string | null;
    status?: CollectionItem["status"];
    note?: string | null;
    eventDate?: string | null;
    location?: string | null;
    reminderAt?: string | null;
  }) => Promise<CollectionItem | null>;
  editCollectionItem: (
    id: string,
    input: Partial<Pick<CollectionItem, "title" | "author" | "status" | "rating" | "note" | "eventDate" | "location" | "reminderAt">>
  ) => Promise<void>;
  removeCollectionItem: (id: string) => Promise<void>;
  sendCollectionToGoal: (id: string, goalId: string) => Promise<void>;
  loadTodayState: (date: string) => Promise<void>;
  setTodayCheck: (goalId: string, on: boolean, date: string) => Promise<void>;
  setPerfectDay: (date: string, on: boolean) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  updateGoalProgress: (goalId: string, delta: number) => Promise<void>;
  completeOnboardingStep: (step: OnboardingStepKey) => Promise<void>;
  getActivity: (goalId: string) => Promise<GoalActivity>;
  getGoalXp: (goalId: string) => Promise<number>;
  getProgressOverview: () => Promise<ProgressOverview>;
  getProgressDay: (date: string) => Promise<ProgressDayDetail>;
  toggleTask: (taskId: string, setLog?: { weight?: number | null; reps?: number | null }) => Promise<void>;
  addReport: (taskId: string, data: ReportUploadPayload) => Promise<void>;
  getReports: (challengeId: string) => Promise<Report[]>;
  getParticipants: (challengeId: string) => Promise<ChallengeParticipant[]>;
  kickParticipant: (challengeId: string, userId: string) => Promise<void>;
  downloadReport: (report: Report) => Promise<void>;
  chatAI: (prompt: string) => Promise<AIChatResponse>;
  chatAIStream: (prompt: string, handlers?: AIChatStreamHandlers, category?: string | null) => Promise<AIChatResponse>;
  getChatHistory: (category?: string | null) => Promise<ChatMessage[]>;
  addDraft: (messageId: string) => Promise<Goal>;
  addReward: (reward: Reward) => Promise<void>;
  deleteReward: (reward: Reward) => Promise<void>;
  updateReward: (reward: Reward) => Promise<void>;
  updateRewardGoal: (goalId: string, rewardId?: string) => Promise<void>;
  claimReward: (id: string) => Promise<void>;
  addReminder: (reminder: Reminder) => Promise<void>;
  deleteReminder: (reminder: Reminder) => Promise<void>;
  updateReminder: (reminder: Reminder) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  addFriend: (friend: FriendInput) => Promise<void>;
  showNativeToast: (toast: {
    title: string;
    message?: string;
    tone?: "success" | "danger" | "info";
    durationMs?: number;
  }) => void;
  hideNativeToast: () => void;
  loadMissions: () => Promise<void>;
  markMissionIntroSeen: () => Promise<void>;
  claimMissionReward: (key: MissionKey) => Promise<void>;
  recordProgressViewed: () => Promise<void>;
}

export type AppStore = AppStoreState & AuthSlice & AppStoreActions;

export type StoreSlice<T> = StateCreator<AppStore, [], [], T>;
