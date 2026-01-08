
export type Priority = 'Low' | 'Medium' | 'High';
export type Status = 'In Progress' | 'Not Started' | 'Done';

export interface AtomicTask {
  id: number;
  task_title: string;
  xp_weight: number; // 1 (Easy) to 5 (Hard) - Affects progress bar impact
  description: string;
  isCompleted: boolean;
  // New AI enriched fields
  ai_tip?: string; // Taktiksel ipucu
  estimated_minutes?: number; // Tahmini süre
}

export interface Roadmap {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji or Icon name
  category: string; // e.g., "Programming", "Health"
  tasks: AtomicTask[];
  totalXp: number; // Sum of all task weights
  currentXp: number; // Sum of completed task weights
  createdAt: number;
  dueDate: string;
  status: Status;
  priority: Priority;
  themeColor: string; // hex code
}

export interface AIRoadmapResponse {
  project_meta: {
    name: string;
    icon: string;
    description: string;
    priority: Priority;
    estimated_days: number;
    category: string;
  };
  roadmap: {
    id: number;
    task_title: string;
    xp_weight: number;
    description: string;
  }[];
}

export interface AILevelUpResponse {
  level_summary: string;
  new_tasks: {
    id: number;
    task_title: string;
    xp_weight: number;
    description: string;
  }[];
}

export interface DailyBriefing {
  headline: string;
  content: string;
  focus_suggestion: string;
}

export interface TaskIntelResponse {
    tip: string;
    minutes: number;
}

export enum ViewState {
  HOME = 'HOME',         // Dashboard
  PROJECTS = 'PROJECTS', // List of all roadmaps
  CREATE = 'CREATE',     // (Technically modal now)
  DETAIL = 'DETAIL',     // Project Detail
  PROFILE = 'PROFILE',   // User Profile & Settings
  FOCUS = 'FOCUS'        // Hyper-Focus Portal Mode
}
