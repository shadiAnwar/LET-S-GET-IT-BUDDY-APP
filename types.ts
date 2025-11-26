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
  subtasks: SubTask[];
  isExpanded: boolean; // For showing subtasks
  aiLoading: boolean; // If AI is currently generating subtasks
}

export enum FilterType {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED'
}