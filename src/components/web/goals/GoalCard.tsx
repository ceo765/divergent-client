import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Target, Edit, ChevronDown, ChevronUp, AlarmClock, BarChart2, Gift, Swords } from "lucide-react";
import { TaskItem } from "@/components/shared/TaskItem";
import { useEffect, useRef, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTranslation } from "react-i18next";

import { formatGoalDate, getGoalPeriodTranslationKey } from "@/shared/display/goals";
import { isTaskCompletedThisPeriod, sumCompletedTaskXp } from "@/shared/screens/goals/model";
import { Challenge, GoalPeriod, GoalType, Reward, Task } from "@/types";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/useAppStore.ts";

interface GoalCardProps {
  id: string;
  title: string;
  description?: string;
  category: string;
  goalType: GoalType;
  goalPeriod: GoalPeriod;
  challenge?: Challenge;
  currentValue?: number;
  targetValue?: number;
  taskXpTarget?: number;
  lastCompletedAt?: string;
  tasks?: Task[];
  dueDate?: string;
  xpReward?: number;
  reward?: Reward | null;
  editMode?: boolean;
  onEdit?: (id: string) => void;
  onTaskToggle?: (goalId: string, taskId: string, parentId?: string) => void;
  onAddReminder?: (id: string) => void;
  onAddProgress?: (goalId: string, delta: number) => void;
  onGoToProgress: (id: string) => void;
  autoExpand?: boolean;
}

export function GoalCard({ id, title, description, category, tasks, challenge, goalType, goalPeriod, currentValue, targetValue, taskXpTarget, dueDate, lastCompletedAt, reward, editMode = false, onEdit, onTaskToggle, onAddReminder, onAddProgress, onGoToProgress, autoExpand }: GoalCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [newSubTaskTitles, setNewSubTaskTitles] = useState<Record<string, string>>({});
  const [newSubTaskXps, setNewSubTaskXps] = useState<Record<string, string>>({});
  const [progressDelta, setProgressDelta] = useState<number>();
  const navigate = useNavigate();
  const { user, categories } = useAppStore();
  const isFromChallenge = Boolean(challenge);
  const { t } = useTranslation();
  const categoryLabel = categories.find((c) => c.value === category)!.label;
  const safeTasks = tasks ?? [];
  const completedTaskXp = sumCompletedTaskXp(safeTasks, goalPeriod);

  function countTasks(taskList?: Task[]): number {
    if (!taskList || taskList.length === 0) return 0;
    return taskList.reduce((sum, task) => sum + 1 + countTasks(task.subtasks), 0);
  }

  function countCompleted(taskList?: Task[], period?: GoalPeriod): number {
    if (!taskList || taskList.length === 0) return 0;
    return taskList.reduce((sum, task) => sum + (period && isTaskCompletedThisPeriod(task, period) ? 1 : 0) + countCompleted(task.subtasks, period), 0);
  }

  const isNumeric = goalType === "PROGRESS";
  const isXpBasedTaskGoal = goalType === "TASK" && taskXpTarget != null;
  const totalTasks = countTasks(safeTasks);
  const completedTasks = countCompleted(safeTasks, goalPeriod);
  const progress = isNumeric
    ? targetValue && targetValue > 0
      ? Math.min(((currentValue ?? 0) / targetValue) * 100, 100)
      : 0
    : isXpBasedTaskGoal
      ? taskXpTarget && taskXpTarget > 0
        ? Math.min((completedTaskXp / taskXpTarget) * 100, 100)
        : 100
      : totalTasks > 0
        ? (completedTasks / totalTasks) * 100
        : 0;

  const now = new Date();
  let due = null;
  if (dueDate) {
    due = new Date(dueDate);
    due.setDate(due.getDate() + 1);
  }
  const completedAt = lastCompletedAt ? new Date(lastCompletedAt) : null;
  const isExpired = due ? now > due : false;
  const wasCompleted = Boolean(completedAt);

  let goalStatus: "ACTIVE" | "COMPLETED" | "FAILED" = "ACTIVE";
  if (wasCompleted) {
    if (due && completedAt! > due) goalStatus = "FAILED";
    else goalStatus = "COMPLETED";
  } else if (isExpired) {
    goalStatus = "FAILED";
  }

  const handleToggleExpand = (taskId: string) => setExpandedTasks({ ...expandedTasks, [taskId]: !expandedTasks[taskId] });
  const handleAddSubTask = (parentId: string) => {
    setNewSubTaskTitles({ ...newSubTaskTitles, [parentId]: "" });
    setNewSubTaskXps({ ...newSubTaskXps, [parentId]: "" });
  };
  const handleRemoveTask = () => undefined;

  function hasChallengeStartedForUser(challengeStart: Date, userTimeZone: string) {
    if (!challengeStart) return true;
    const nowDate = new Date();
    const nowInUserTZ = new Date(new Intl.DateTimeFormat("en-US", { timeZone: userTimeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(nowDate));
    const startInUserTZ = new Date(new Intl.DateTimeFormat("en-US", { timeZone: userTimeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(challengeStart));
    return startInUserTZ <= nowInUserTZ;
  }

  const challengeHasStarted = challenge && challenge.startsAt ? hasChallengeStartedForUser(new Date(challenge.startsAt), user!.timeZone) : null;

  const renderTasks = (taskList: Task[], parentId?: string) => taskList.map((task) => (
    <TaskItem
      key={task.id}
      {...task}
      goalPeriod={goalPeriod ?? "NONE"}
      parentId={parentId}
      onToggle={(taskId, pId) => onTaskToggle?.(id, taskId, pId)}
      onRemove={handleRemoveTask}
      onToggleExpand={handleToggleExpand}
      newSubTaskTitles={newSubTaskTitles}
      newSubTaskXps={newSubTaskXps}
      setNewSubTaskTitles={setNewSubTaskTitles}
      setNewSubTaskXps={setNewSubTaskXps}
      handleAddSubTask={handleAddSubTask}
      expanded={expandedTasks[task.id]}
      editMode={editMode}
      disabled={isExpired || (challenge && !challengeHasStarted)}
    />
  ));

  const [highlight, setHighlight] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoExpand) return;
    if (goalType === "TASK") setIsOpen(true);
    if (cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlight(true);
      const timeout = setTimeout(() => setHighlight(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [autoExpand, goalType]);

  const periodLabelKey = getGoalPeriodTranslationKey(goalPeriod);
  const periodLabel = periodLabelKey ? t(periodLabelKey) : null;

  return (
    <Card className={`mb-2 break-inside-avoid hover:shadow-md transition-all border ${highlight ? "bg-blue-50" : "bg-white"}`} ref={cardRef}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2"><Target className="size-5 text-primary" /><CardTitle>{title}</CardTitle></div>
            <CategoryBadge category={category} label={categoryLabel} />
            {description && <CardDescription>{description}</CardDescription>}
            {goalStatus !== "ACTIVE" && <Badge className={`${goalStatus === "COMPLETED" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>{goalStatus === "COMPLETED" ? t("goals.task_status_completed") : t("goals.task_status_failed")}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <ProgressRing progress={progress} size={70} strokeWidth={6} />
            <div className="flex flex-col">
              {onEdit && !isFromChallenge && <Button variant="ghost" size="icon" onClick={() => onEdit(id)}><Edit className="size-4" /></Button>}
              {onAddReminder && <Button variant="ghost" size="icon" onClick={() => onAddReminder(id)} className="shrink-0" title={t("goals.add_reminder")}><AlarmClock className="size-4" /></Button>}
              <Button variant="ghost" size="icon" onClick={() => onGoToProgress(id)} className="shrink-0" title={t("goals.progress_title")}><BarChart2 className="size-4" /></Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">{t("goals.progress")}</span>
            {isXpBasedTaskGoal ? (
              <span className="text-muted-foreground">{completedTaskXp} / {taskXpTarget} XP</span>
            ) : goalType === "TASK" ? (
              <span className="text-muted-foreground">{completedTasks} / {totalTasks} {t("goals.tasks_count")}</span>
            ) : (
              <span className="text-muted-foreground">{currentValue ?? 0} / {targetValue ?? 0}</span>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {goalType === "PROGRESS" && (
          <div className="flex items-center gap-2 mt-2">
            <input type="number" className="border rounded px-2 py-1 w-full text-sm bg-transparent" value={progressDelta} onChange={(e) => setProgressDelta(Number(e.target.value))} placeholder={t("goals.add_value_placeholder")} min={0} />
            <Button size="sm" variant="transparent" onClick={() => { if (progressDelta !== 0) { onAddProgress?.(id, progressDelta!); setProgressDelta(0); } }}>+</Button>
          </div>
        )}

        {goalType === "TASK" && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="transparent" className="w-full justify-between"><span>{t("goals.tasks")}</span>{isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}</Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">{renderTasks(safeTasks)}</CollapsibleContent>
          </Collapsible>
        )}

        <div className="pt-2 border-t columns-2">
          <div className="flex gap-2 flex-col break-inside-avoid">
            {periodLabel && <Badge variant="outline">{periodLabel}</Badge>}
            {isFromChallenge && challenge && <div className="flex items-center flex-wrap justify-start mb-auto"><Badge className="cursor-pointer bg-orange-500 text-white hover:bg-orange-400" onClick={() => navigate({ pathname: "/challenges", search: `?id=${challenge.id}` })} title={t("goals.go_to_challenge")}><Swords size={14} className="shrink-0" />{challenge.title}</Badge></div>}
            {dueDate && <div className="flex items-center gap-1 text-muted-foreground"><Calendar className="size-4" /><span className="whitespace-nowrap">{formatGoalDate(dueDate)}</span></div>}
          </div>
          {reward && <div className="flex items-center flex-wrap justify-end mb-auto break-inside-avoid"><div className="flex flex-wrap justify-center"><Badge className="bg-green-500 cursor-pointer hover:bg-green-400" onClick={() => navigate({ pathname: "/rewards", search: `?id=${reward.id}` })} title={t("goals.go_to_reward")}><Gift size={14} />{reward.title}</Badge></div></div>}
        </div>
      </CardContent>
    </Card>
  );
}
