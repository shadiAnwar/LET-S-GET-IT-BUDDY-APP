
export type Language = 'en' | 'es' | 'fr' | 'ar' | 'sv' | 'pt';
export type Theme = 'sunset' | 'ocean' | 'forest' | 'dream';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  dueDate?: number;
  subtasks: SubTask[];
  isExpanded: boolean; // For showing subtasks
  aiLoading: boolean; // If AI is currently generating subtasks
}

export enum FilterType {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED'
}
