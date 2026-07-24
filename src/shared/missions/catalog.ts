import type { MissionKey } from "@/types";

export const MISSION_DEFINITIONS: Array<{
  key: MissionKey;
  titleKey: string;
  descriptionKey: string;
  actionKey: string;
  exampleKey: string;
  path: string;
}> = [
  { key: "used_ai", titleKey: "missions.items.used_ai.title", descriptionKey: "missions.items.used_ai.description", actionKey: "missions.items.used_ai.action", exampleKey: "missions.items.used_ai.example", path: "/goals" },
  { key: "created_first_goal", titleKey: "missions.items.created_first_goal.title", descriptionKey: "missions.items.created_first_goal.description", actionKey: "missions.items.created_first_goal.action", exampleKey: "missions.items.created_first_goal.example", path: "/goals" },
  { key: "added_first_task", titleKey: "missions.items.added_first_task.title", descriptionKey: "missions.items.added_first_task.description", actionKey: "missions.items.added_first_task.action", exampleKey: "missions.items.added_first_task.example", path: "/goals" },
  { key: "added_first_subtask", titleKey: "missions.items.added_first_subtask.title", descriptionKey: "missions.items.added_first_subtask.description", actionKey: "missions.items.added_first_subtask.action", exampleKey: "missions.items.added_first_subtask.example", path: "/goals" },
  { key: "created_first_reminder", titleKey: "missions.items.created_first_reminder.title", descriptionKey: "missions.items.created_first_reminder.description", actionKey: "missions.items.created_first_reminder.action", exampleKey: "missions.items.created_first_reminder.example", path: "/reminders" },
  { key: "completed_first_task", titleKey: "missions.items.completed_first_task.title", descriptionKey: "missions.items.completed_first_task.description", actionKey: "missions.items.completed_first_task.action", exampleKey: "missions.items.completed_first_task.example", path: "/goals" },
  { key: "created_recurring_goal", titleKey: "missions.items.created_recurring_goal.title", descriptionKey: "missions.items.created_recurring_goal.description", actionKey: "missions.items.created_recurring_goal.action", exampleKey: "missions.items.created_recurring_goal.example", path: "/goals" },
  { key: "created_first_numeric_goal", titleKey: "missions.items.created_first_numeric_goal.title", descriptionKey: "missions.items.created_first_numeric_goal.description", actionKey: "missions.items.created_first_numeric_goal.action", exampleKey: "missions.items.created_first_numeric_goal.example", path: "/goals" },
  { key: "viewed_progress", titleKey: "missions.items.viewed_progress.title", descriptionKey: "missions.items.viewed_progress.description", actionKey: "missions.items.viewed_progress.action", exampleKey: "missions.items.viewed_progress.example", path: "/progress" },
  { key: "created_linked_artifact", titleKey: "missions.items.created_linked_artifact.title", descriptionKey: "missions.items.created_linked_artifact.description", actionKey: "missions.items.created_linked_artifact.action", exampleKey: "missions.items.created_linked_artifact.example", path: "/rewards" },
];

export function getMissionDefinition(key: MissionKey) {
  return MISSION_DEFINITIONS.find((mission) => mission.key === key);
}
