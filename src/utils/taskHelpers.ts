import { TaskCategory } from '../config/tasks';

export function getTaskPoints(taskId: string, categories: TaskCategory[]): number {
  const task = categories.find(t => t.id === taskId);
  return task?.points || 0;
}

export function getTaskByHashtag(hashtag: string, categories: TaskCategory[]): TaskCategory | undefined {
  return categories.find(t => t.hashtag === hashtag);
}

export function getTasksByType(type: TaskCategory['type'], categories: TaskCategory[]): TaskCategory[] {
  return categories.filter(t => t.type === type);
}

export function isTaskCompleted(taskId: string, completions: any[]): boolean {
  return completions.some(c => c.metadata?.task_id === taskId);
}

export function getTaskCompletionCount(type: string, completions: any[]): number {
  return completions.filter(c => c.task_type === type).length;
}