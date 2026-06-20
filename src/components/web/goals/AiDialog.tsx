import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Clock, Target } from "lucide-react";

import { AppLoader } from "@/components/shared/AppLoader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RewardIcon } from "@/components/shared/RewardIcon";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { formatElapsed } from "@/shared/ai/formatElapsed";
import { formatReminderDayLabel } from "@/shared/display/reminders";
import { useAiChatSession } from "@/shared/ai/useAiChatSession";
import { useAppStore } from "@/stores/useAppStore";
import type { Task, ChatMessage, Draft, Goal, RewardIcon as RewardIconType } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDraftAdded: (goal: Goal) => void;
  initialPrompt?: string;
}

export default function AiChatDialog({ open, onOpenChange, onDraftAdded, initialPrompt }: Props) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    prompt,
    setPrompt,
    history,
    historyLoading,
    loading,
    submitting,
    error,
    streamingMessageId,
    draftPendingMessageId,
    elapsedSeconds,
    allowAutoScrollRef,
    handleGenerate,
    handleDraftAdded,
    resetSession,
  } = useAiChatSession({ open, onDraftAdded, initialPrompt });

  useEffect(() => {
    if (!allowAutoScrollRef.current) {
      return;
    }

    const el = scrollRef.current?.lastElementChild as HTMLElement | null;
    el?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [history, allowAutoScrollRef]);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetSession();
    }
    onOpenChange(nextOpen);
  };

  const quickActions = [
    { label: t("ai.quick_action_capabilities"), prompt: t("ai.quick_prompt_capabilities") },
    { label: t("ai.quick_action_goal"), prompt: t("ai.quick_prompt_goal") },
    { label: t("ai.quick_action_progress"), prompt: t("ai.quick_prompt_progress") },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] text-sm flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("ai.title")}</DialogTitle>
        </DialogHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto rounded bg-gray-50 p-2 space-y-2">
          {historyLoading ? (
            <AppLoader />
          ) : history.length === 0 ? (
            <div className="space-y-3 rounded-xl border bg-white p-4">
              <div className="space-y-1">
                <div className="text-base font-semibold text-foreground">{t("ai.welcome_title")}</div>
                <div className="text-sm text-muted-foreground">{t("ai.welcome_description")}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <Button key={action.label} variant="secondary" size="sm" onClick={() => void handleGenerate(action.prompt)} disabled={loading || submitting}>
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            history.map((message, index) => (
              <ChatMessageItem
                key={index}
                message={message}
                messageId={message.id}
                onDraftAdded={handleDraftAdded}
                isDraftPending={message.id === streamingMessageId}
                isPreparingDraft={message.id === draftPendingMessageId}
                elapsedSeconds={message.id === streamingMessageId ? elapsedSeconds : 0}
              />
            ))
          )}
        </div>

        <div className="mt-2 space-y-2">
          <Textarea placeholder={t("ai.placeholder")} value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={loading} />
          {error && <div className="text-red-500">{error}</div>}
        </div>

        <DialogFooter>
          <Button onClick={() => void handleGenerate()} disabled={loading || !prompt.trim()} size="sm">
            {submitting ? t("ai.asking") : t("ai.ask")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChatMessageItem({
  message,
  messageId,
  onDraftAdded,
  isDraftPending,
  isPreparingDraft,
  elapsedSeconds,
}: {
  message: ChatMessage;
  messageId?: string;
  onDraftAdded: (goal: Goal) => void;
  isDraftPending: boolean;
  isPreparingDraft: boolean;
  elapsedSeconds: number;
}) {
  const { t } = useTranslation();
  const messageContent = message.content || (isDraftPending ? t("ai.thinking") : "");
  const showThinkingState = message.role === "assistant" && isDraftPending && !message.content;

  return (
    <div className="space-y-1">
      <div className={`whitespace-pre-wrap rounded p-2 ${message.role === "user" ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-800"}`}>
        {showThinkingState ? (
          <div className="flex items-center justify-between gap-3">
            <span>{messageContent}</span>
            <span className="shrink-0 text-xs text-gray-500">{formatElapsed(elapsedSeconds)}</span>
          </div>
        ) : (
          messageContent
        )}
      </div>

      {message.role === "assistant" && message.goalDraft && (
        <GoalDraftPreview draft={message.goalDraft} messageId={messageId} onAdd={onDraftAdded} isDraftAdded={message.isDraftAdded} />
      )}
      {message.role === "assistant" && !message.goalDraft && isPreparingDraft && (
        <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          {t("ai.preparing_draft")}
        </div>
      )}
    </div>
  );
}

function GoalDraftPreview({
  draft,
  isDraftAdded,
  messageId,
  onAdd,
}: {
  draft: Draft;
  isDraftAdded: boolean;
  messageId?: string;
  onAdd: (goal: Goal, messageId: string) => void;
}) {
  const { t } = useTranslation();
  const { addDraft, categories } = useAppStore();
  const draftGoal = draft.goal as Draft["goal"] & {
    goalType?: "TASK" | "PROGRESS";
    currentValue?: number | null;
    targetValue?: number | null;
  };

  const categoryLabel = categories.find((c) => c.value === draft.goal.category)?.label ?? draft.goal.category;
  const isProgressGoal = draftGoal.goalType === "PROGRESS";

  const handleAdd = async () => {
    if (!messageId) return;
    try {
      const goal = await addDraft(messageId);
      if (goal) {
        onAdd(goal, messageId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded border bg-gray-50 p-4">
      <div className="flex items-center gap-2 font-medium">
        <Target className="size-4 text-primary" />
        <span>{draft.goal.title}</span>
      </div>
      <CategoryBadge category={draft.goal.category} label={categoryLabel} />

      {draft.goal.description && <div>{draft.goal.description}</div>}

      <div className="flex items-center gap-2 font-medium">
        {draftGoal.goalType && (
          <Badge variant="secondary">
            {isProgressGoal ? t("goals.dialog.goal_type_progress") : t("goals.dialog.goal_type_tasks")}
          </Badge>
        )}

        {draft.goal.goalPeriod !== "NONE" && (
          <Badge variant="outline">
            {draft.goal.goalPeriod === "DAILY" && t("goal_period.daily")}
            {draft.goal.goalPeriod === "WEEKLY" && t("goal_period.weekly")}
            {draft.goal.goalPeriod === "MONTHLY" && t("goal_period.monthly")}
          </Badge>
        )}

        {draft.goal.dueDate && (
          <Badge variant="outline">
            <Calendar className="size-2" />
            <span className="whitespace-nowrap text-xs">{draft.goal.dueDate}</span>
          </Badge>
        )}
      </div>

      {isProgressGoal && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {t("goals.dialog.target_value")}: {draftGoal.targetValue ?? 0}
          </Badge>
        </div>
      )}

      {!isProgressGoal && draft.tasks?.length > 0 && (
        <div>
          <div className="mb-1 font-medium">{t("ai.tasks")}</div>
          <ul className="ml-4 list-disc space-y-1">
            {draft.tasks.map((task, i) => (
              <TaskItem key={i} task={task} />
            ))}
          </ul>
        </div>
      )}

      {draft.reminders?.length > 0 && (
        <div>
          <div className="mb-1 font-medium">{t("ai.reminders")}</div>
          <ul className="space-y-1">
            {draft.reminders.map((r, i) => (
              <li key={i} className="flex flex-col space-y-1">
                <div className="flex items-center gap-1">
                  <Clock className="size-3 shrink-0" />
                  <span>{r.title}</span>
                </div>
                {r.daysOfWeek?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {[...r.daysOfWeek].map((d) => (
                      <Badge key={d} variant="outline" className="px-1.5 py-0">
                        {formatReminderDayLabel(d, t)}
                      </Badge>
                    ))}
                  </div>
                )}

                {r.daysOfMonth?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {[...r.daysOfMonth]
                      .sort((a, b) => a - b)
                      .map((d) => (
                        <Badge key={d} variant="outline" className="px-1.5 py-0">
                          {d}
                        </Badge>
                      ))}
                  </div>
                )}
                <Badge variant="outline" className="px-1.5 py-0">
                  {r.time}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      {draft.reward && (
        <div>
          <div className="mb-1 font-medium">{t("ai.reward")}</div>

          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <RewardIcon icon={draft.reward.icon as RewardIconType} size={4} />
                {draft.reward.title}
              </div>

              {draft.reward.description && <div className="text-muted-foreground">{draft.reward.description}</div>}

              {draft.reward.xpRequires != null && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                  {t("ai.xp_required", { xp: draft.reward.xpRequires })}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={handleAdd} disabled={isDraftAdded}>
          {isDraftAdded ? t("common.added") : t("common.add")}
        </Button>
      </div>
    </div>
  );
}

function TaskItem({ task }: { task: Task }) {
  return (
    <li>
      <div className="flex items-center gap-2">
        <span>{task.title}</span>

        {task.xpReward != null && <Badge className="px-1.5 py-0">+{task.xpReward} XP</Badge>}
      </div>

      {task.subtasks && task.subtasks.length > 0 && (
        <ul className="mt-1 ml-4 list-disc space-y-1 border-l pl-2">
          {task.subtasks.map((sub: Task, i: number) => (
            <TaskItem key={i} task={sub} />
          ))}
        </ul>
      )}
    </li>
  );
}
