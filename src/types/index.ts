import type {
  CategoryType,
  RewardIconType as SharedRewardIconType,
} from "@/shared/domain";

export type { CategoryType } from "@/shared/domain";

export enum UserRole {
  User = "user",
  Agent = "agent",
  Admin = "admin",
  SuperAgent = "superagent",
}

export const DAYS_OF_WEEK = [
  { key: "mon", label: "Пн" },
  { key: "tue", label: "Вт" },
  { key: "wed", label: "Ср" },
  { key: "thu", label: "Чт" },
  { key: "fri", label: "Пт" },
  { key: "sat", label: "Сб" },
  { key: "sun", label: "Вс" },
] as const;

export const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => i + 1);

export interface Task {
  id: string;
  title: string;
  lastCompletedAt: string;
  xpReward?: number;
  dueDate?: string;
  subtasks?: Task[];
  expanded?: boolean;
  parentId?: string | null;
  completions?: TaskCompletion[];
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: CategoryType;
  createdAt?: string;
  tasks: Task[];
  dueDate?: string;
  lastCompletedAt?: string;
  xpReward?: number;
  currentValue?: number;
  targetValue?: number;
  taskXpTarget?: number;
  goalType: GoalType;
  goalPeriod: GoalPeriod;
  challengeId?: string;
  challenge?: Challenge;
}

export interface Leader {
  xp: number;
  name: string;
  userId: string;
}

export interface ChallengeGoal {
  challengeId: string;
  goalId: string;
  challenge: Challenge;
  goal: Goal;
}

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  goals: Goal[];
  goalIds: string[];
  leaderboard: Leader[];
  requiresReport: boolean;
  personalGoalsEnabled?: boolean;
  metricName?: string;
  metricUnit?: string;
  reportingDays?: string[];
  reportDeadline?: string;
  reportTimeZone?: string;
  allowedMisses?: number;
  creatorId: string;
  rules?: string;
  link?: string;
  isPublic: boolean;
  startsAt?: string;
  endsAt?: string;
  price?: number;
  participants: ChallengeParticipant[];
  reports: Report[];
}

export type ChallengeInput = Omit<
  Challenge,
  "goals" | "leaderboard" | "creatorId" | "participants"
>;

export interface ChallengeApi extends Omit<Challenge, "goals"> {
  goals: ChallengeGoal[];
}

export interface Report {
  id: string;
  challengeId: string;
  userId: string;
  challenge: Challenge;
  taskCompletion: TaskCompletion;
  user: User;
  fileType: string;
  fileUrl: string;
  comment?: string;
  createdAt: string;
}

export interface TaskCompletion {
  id: string;
  userId: string;
  user: User;
  taskId: string;
  task: Task;
  createdAt: string;
  report?: Report;
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  challenge: Challenge;
  user: User;
  goalTitle?: string;
  targetValue?: number;
  currentValue: number;
  unit?: string;
  onboardingAnswers?: Record<string, unknown>;
  plan?: Record<string, unknown>;
  status: "ACTIVE" | "LEFT" | "REMOVED";
  missCount: number;
}

export interface PersonalChallengeGoalInput {
  goalTitle: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  onboardingAnswers?: Record<string, unknown>;
  plan?: Record<string, unknown>;
}

export interface ChallengeCheckIn {
  id: string;
  challengeId: string;
  participantId: string;
  userId: string;
  reportDate: string;
  planValue?: number;
  factValue?: number;
  doneToday: string[];
  tasksTomorrow: string[];
  submittedAt: string;
  isLate: boolean;
  user: Pick<User, "id" | "name" | "photoUrl">;
}

export interface ChallengeCheckInInput {
  factValue: number;
  doneToday: string[];
  tasksTomorrow: string[];
}

export interface ChallengeGroupMessage {
  id: string;
  challengeId: string;
  authorId?: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  editedAt?: string;
  deletedAt?: string;
  imageUrl?: string;
  imageMimeType?: string;
  imageSize?: number;
  imageOriginalName?: string;
  author?: Pick<User, "id" | "name" | "photoUrl"> | null;
}

export type GoalType = "TASK" | "PROGRESS";
export type GoalPeriod = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
export type OnboardingStepKey =
  | "created_first_goal"
  | "added_first_task"
  | "created_first_numeric_goal"
  | "set_completion_threshold"
  | "started_first_streak"
  | "created_first_reminder"
  | "used_ai"
  | "completed_first_task";
export type OnboardingState = Partial<Record<OnboardingStepKey, string | null>>;

export type MissionKey =
  | "used_ai"
  | "created_first_goal"
  | "added_first_task"
  | "added_first_subtask"
  | "created_first_reminder"
  | "completed_first_task"
  | "created_recurring_goal"
  | "created_first_numeric_goal"
  | "viewed_progress"
  | "created_linked_artifact";

export interface MissionProgress {
  key: MissionKey;
  order: number;
  xpReward: number;
  completedAt: string | null;
  claimedAt: string | null;
}

export interface MissionState {
  missions: MissionProgress[];
  activeKey: MissionKey | null;
  pendingRewardKey: MissionKey | null;
  badgeCount: number;
  introSeen: boolean;
}

export interface GoalFormData extends Goal {
  rewardId?: string | null;
}

export interface CategoryOption {
  value: string;
  label: string;
}

export interface FriendSummary {
  id: string;
  name: string;
  level: number;
  avatarUrl?: string;
  currentXp: number;
  totalGoals: number;
  completedGoals: number;
  streak: number;
  rank?: number;
}

export interface FriendInput {
  name: string;
  level: number;
  currentXp: number;
}

export interface Reminder {
  id: string;
  title: string;
  time: string;
  daysOfWeek: string[];
  daysOfMonth: number[];
  isActive: boolean;
  goalId?: string;
  taskId?: string;
  goal?: Goal;
  task?: Task;
}

export type RewardIcon = SharedRewardIconType;

export interface Reward {
  id: string;
  title: string;
  description: string;
  icon: RewardIcon;
  isUnlocked: boolean;
  goalId?: string;
  goal?: Goal;
  xpRequires?: number;
  sourceKey?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string | null;
  hasPassword?: boolean;
  role: string;
  xp: number;
  level: number;
  xpInCurrentLevel: number;
  requiredXp: number;
  photoUrl: string;
  language: string | null;
  timeZone: string;
  onboardingState?: OnboardingState | null;
}

export type PaymentMethod = "YOUKASSA";

export type ReportUploadPayload = {
  file: Blob;
  fileName: string;
  mimeType?: string;
  comment?: string;
};

export type GridItem = {
  periodStart: string;
  completed: number;
  total: number;
  status: "empty" | "partial" | "full";
  xp: number;
};

export type GoalActivity = {
  currentStreak: number;
  longestStreak: number;
  period: GoalPeriod;
  data: GridItem[];
};

export type Draft = {
  goal: {
    title: string;
    description: string | null;
    goalPeriod: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
    category: string;
    dueDate: string | null;
  };
  tasks: Task[];
  reminders: {
    title: string;
    time: string;
    daysOfWeek: string[];
    daysOfMonth: number[];
  }[];
  reward: {
    title: string;
    description?: string | null;
    icon?: string | null;
    xpRequires?: number | null;
  };
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  goalDraft?: Draft | null;
  id?: string;
  isDraftAdded: boolean;
};

export type AIChatResponse = {
  id: string;
  message: string;
  goalDraft: Draft | null;
  isDraftAdded: boolean;
};
