export interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  type: 'class' | 'meeting' | 'deadline' | 'personal' | 'assignment';
  color: string;
  projectId?: string;
  scheduleTemplateId?: string; // Link to schedule template
  groupName?: string; // Ryhmänimi joukkomuokkausta varten
  files?: Array<{
    id: string;
    name: string;
    type: 'upload' | 'google-drive';
    url?: string;
    size?: number;
    uploadDate: Date;
  }>;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  type: 'none' | 'course' | 'administrative' | 'personal';
  startDate: Date;
  endDate?: Date;
  tasks: Task[];
  files?: Array<{
    id: string;
    name: string;
    type: 'upload' | 'google-drive';
    url?: string;
    size?: number;
    uploadDate: Date;
  }>;
  parentCourseId?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  status: 'todo' | 'inProgress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  projectId: string;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  color: string;
  dayOfWeek: number; // 0 = Monday, 1 = Tuesday, etc.
  startTime: string;
  endTime: string;
  description?: string;
}

export interface RecurringClass {
  id: string;
  title: string;
  description?: string;
  scheduleTemplateId: string;
  startDate: Date;
  endDate: Date;
  color: string;
  groupName?: string; // For grouping multiple recurring classes
  projectId?: string;
  files?: Array<{
    id: string;
    name: string;
    type: 'upload' | 'google-drive';
    url?: string;
    size?: number;
    uploadDate: Date;
  }>;
}

export type CalendarView = 'month' | 'week' | 'day' | 'schedule';
