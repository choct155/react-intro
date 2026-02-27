export type Priority = 'high' | 'medium' | 'low';
export type Filter = 'all' | 'active' | 'completed';
export type SortBy = 'created' | 'priority' | 'alpha';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  category: string;
  dueDate?: string;
  createdAt: string;
}
