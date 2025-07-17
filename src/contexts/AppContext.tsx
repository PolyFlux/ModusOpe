import { nanoid } from 'nanoid';
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Event, Project, Task, CalendarView, ScheduleTemplate, RecurringClass, KanbanColumn, Subtask } from '../types';

function generateProjectDeadlineEvents(projects: Project[]): Event[] {
  return projects
    .filter(project => project.endDate && project.type !== 'course')
    .map(project => ({
      id: `project-deadline-${project.id}`,
      title: `${project.name}`,
      date: project.endDate!,
      type: 'deadline',
      color: '#EF4444',
      projectId: project.id,
    }));
}

function generateTaskDeadlineEvents(projects: Project[]): Event[] {
    const allTasks = projects.flatMap(p => p.tasks);
    return allTasks
        .filter(task => task.dueDate)
        .map(task => ({
            id: `task-deadline-${task.id}`,
            title: task.title,
            date: task.dueDate!,
            type: 'deadline',
            color: '#F59E0B',
            projectId: task.projectId,
        }));
}

export const GENERAL_TASKS_PROJECT_ID = 'general_tasks_project';

const generalTasksProject: Project = {
  id: GENERAL_TASKS_PROJECT_ID,
  name: 'Yleiset tehtävät',
  description: 'Tänne kerätään kaikki tehtävät, joita ei ole liitetty mihinkään tiettyyn projektiin.',
  type: 'none',
  color: '#6B7280',
  startDate: new Date(),
  tasks: [],
  columns: [
    { id: 'todo', title: 'Suunnitteilla' },
    { id: 'inProgress', title: 'Työn alla' },
    { id: 'done', title: 'Valmis' },
  ],
};

const initialProjects: Project[] = [generalTasksProject];
const initialEvents: Event[] = [];

interface ConfirmationModalState {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface AppState {
  events: Event[];
  projects: Project[];
  scheduleTemplates: ScheduleTemplate[];
  recurringClasses: RecurringClass[];
  currentView: CalendarView;
  selectedDate: Date;
  showEventModal: boolean;
  showProjectModal: boolean;
  showCourseModal: boolean;
  showScheduleTemplateModal: boolean;
  showRecurringClassModal: boolean;
  showTaskModal: boolean;
  selectedEvent?: Event;
  selectedProjectId?: string;
  courseModalInfo?: { id?: string };
  selectedScheduleTemplate?: ScheduleTemplate;
  selectedRecurringClass?: RecurringClass;
  selectedTask?: Task;
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  selectedKanbanProjectId?: string | null;
  confirmationModal: ConfirmationModalState;
}

type AppAction =
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: Event }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_TASK'; payload: { projectId: string; task: Task } }
  | { type: 'UPDATE_TASK'; payload: { projectId: string; task: Task } }
  | { type: 'DELETE_TASK'; payload: { projectId: string; taskId: string } }
  | { type: 'ADD_SUBTASK'; payload: { projectId: string; taskId: string; subtask: Subtask } }
  | { type: 'UPDATE_SUBTASK'; payload: { projectId: string; taskId: string; subtask: Subtask } }
  | { type: 'DELETE_SUBTASK'; payload: { projectId: string; taskId: string; subtaskId: string } }
  | { type: 'ADD_SCHEDULE_TEMPLATE'; payload: ScheduleTemplate }
  | { type: 'UPDATE_SCHEDULE_TEMPLATE'; payload: ScheduleTemplate }
  | { type: 'DELETE_SCHEDULE_TEMPLATE'; payload: string }
  | { type: 'ADD_RECURRING_CLASS'; payload: RecurringClass }
  | { type: 'UPDATE_RECURRING_CLASS'; payload: RecurringClass }
  | { type: 'DELETE_RECURRING_CLASS'; payload: string }
  | { type: 'SET_VIEW'; payload: CalendarView }
  | { type: 'SET_SELECTED_DATE'; payload: Date }
  | { type: 'TOGGLE_EVENT_MODAL'; payload?: Event }
  | { type: 'TOGGLE_PROJECT_MODAL'; payload?: string }
  | { type: 'TOGGLE_COURSE_MODAL'; payload?: { id?: string } }
  | { type: 'TOGGLE_SCHEDULE_TEMPLATE_MODAL'; payload?: ScheduleTemplate }
  | { type: 'TOGGLE_RECURRING_CLASS_MODAL'; payload?: RecurringClass }
  | { type: 'TOGGLE_TASK_MODAL'; payload?: Task }
  | { type: 'CLOSE_MODALS' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_MOBILE_MENU' }
  | { type: 'SET_KANBAN_PROJECT'; payload: string | null }
  | { type: 'UPDATE_TASK_STATUS'; payload: { projectId: string; taskId: string; newStatus: string } }
  | { type: 'ADD_COLUMN'; payload: { projectId: string; title: string } }
  | { type: 'UPDATE_COLUMN'; payload: { projectId: string; column: KanbanColumn } }
  | { type: 'DELETE_COLUMN'; payload: { projectId: string; columnId: string } }
  | { type: 'SHOW_CONFIRMATION_MODAL'; payload: Omit<ConfirmationModalState, 'isOpen'> }
  | { type: 'CLOSE_CONFIRMATION_MODAL' };

const initialConfirmationState: ConfirmationModalState = {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
};

const initialState: AppState = {
  events: [
    ...initialEvents,
    ...generateProjectDeadlineEvents(initialProjects),
    ...generateTaskDeadlineEvents(initialProjects)
  ],
  projects: initialProjects,
  scheduleTemplates: [],
  recurringClasses: [],
  currentView: 'month',
  selectedDate: new Date(),
  showEventModal: false,
  showProjectModal: false,
  showCourseModal: false,
  showScheduleTemplateModal: false,
  showRecurringClassModal: false,
  showTaskModal: false,
  isSidebarCollapsed: false,
  isMobileMenuOpen: false,
  selectedKanbanProjectId: null,
  confirmationModal: initialConfirmationState,
};


function generateRecurringEvents(recurringClass: RecurringClass, template: ScheduleTemplate): Event[] {
  const events: Event[] = [];
  const startDate = new Date(recurringClass.startDate);
  const endDate = new Date(recurringClass.endDate);
  const targetDay = template.dayOfWeek;
  const currentDate = new Date(startDate);
  const currentDay = (currentDate.getDay() + 6) % 7;
  const daysToAdd = (targetDay - currentDay + 7) % 7;
  currentDate.setDate(currentDate.getDate() + daysToAdd);

  while (currentDate <= endDate) {
    const eventDate = new Date(currentDate);
    const [startHour, startMinute] = template.startTime.split(':').map(Number);
    eventDate.setHours(startHour, startMinute, 0, 0);
    events.push({
      id: `recurring-${recurringClass.id}-${eventDate.getTime()}`,
      title: recurringClass.title,
      description: recurringClass.description,
      date: eventDate,
      startTime: template.startTime,
      endTime: template.endTime,
      type: 'class',
      color: recurringClass.color,
      scheduleTemplateId: template.id,
      groupName: recurringClass.groupName
    });
    currentDate.setDate(currentDate.getDate() + 7);
  }
  return events;
}

function updateAllEvents(state: AppState, updatedProjects: Project[]): Event[] {
    const nonDeadlineEvents = state.events.filter(e => !e.id.startsWith('project-deadline-') && !e.id.startsWith('task-deadline-'));
    const projectDeadlines = generateProjectDeadlineEvents(updatedProjects);
    const taskDeadlines = generateTaskDeadlineEvents(updatedProjects);
    return [...nonDeadlineEvents, ...projectDeadlines, ...taskDeadlines];
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    case 'UPDATE_EVENT':
      return { ...state, events: state.events.map(event => event.id === action.payload.id ? action.payload : event) };
    case 'DELETE_EVENT':
      return { ...state, events: state.events.filter(event => event.id !== action.payload) };

    case 'ADD_PROJECT': {
      type AddProjectPayload = Omit<Project, 'columns'> & { templateGroupName?: string };
      const payload = action.payload as AddProjectPayload;
      
      const { templateGroupName, ...projectData } = payload;
      
      const defaultColumns: KanbanColumn[] = [
        { id: 'todo', title: 'Suunnitteilla' },
        { id: 'inProgress', title: 'Työn alla' },
        { id: 'done', title: 'Valmis' },
      ];
      
      const newProject: Project = {
        ...(projectData as Project),
        id: projectData.id || nanoid(),
        tasks: projectData.tasks || [],
        columns: defaultColumns,
      };

      const newProjects = [...state.projects, newProject];
      
      let newRecurringClasses = [...state.recurringClasses];
      let eventsWithNewRecurring = [...state.events];

      if (templateGroupName && newProject.startDate) {
        const templatesInGroup = state.scheduleTemplates.filter(t => t.name === templateGroupName);
        
        const recurringEndDate = newProject.endDate 
            ? newProject.endDate 
            : new Date(newProject.startDate.getFullYear(), 11, 31);

        templatesInGroup.forEach(template => {
            const recurringClass: RecurringClass = {
                id: `${newProject.id}-${template.id}`,
                title: newProject.name,
                scheduleTemplateId: template.id,
                startDate: newProject.startDate,
                endDate: recurringEndDate,
                color: newProject.color,
                groupName: template.name,
                projectId: newProject.id
            };
            newRecurringClasses.push(recurringClass);
            eventsWithNewRecurring.push(...generateRecurringEvents(recurringClass, template));
        });
      }

      const finalEvents = updateAllEvents({ ...state, events: eventsWithNewRecurring }, newProjects);
      
      return { 
        ...state, 
        projects: newProjects, 
        recurringClasses: newRecurringClasses,
        events: finalEvents
      };
    }
      
    case 'UPDATE_PROJECT': {
      const newProjects = state.projects.map(p => {
        if (p.id === action.payload.id) {
          return { ...p, ...action.payload };
        }
        return p;
      });
      return { ...state, projects: newProjects, events: updateAllEvents(state, newProjects) };
    }
      
    case 'DELETE_PROJECT': {
      const newProjects = state.projects.filter(project => project.id !== action.payload);
      const remainingEvents = state.events.filter(event => event.projectId !== action.payload);
      const nonDeadlineEvents = remainingEvents.filter(e => !e.id.startsWith('project-deadline-') && !e.id.startsWith('task-deadline-'));
      const projectDeadlines = generateProjectDeadlineEvents(newProjects);
      const taskDeadlines = generateTaskDeadlineEvents(newProjects);
      return { ...state, projects: newProjects, events: [...nonDeadlineEvents, ...projectDeadlines, ...taskDeadlines] };
    }

    case 'ADD_TASK': {
        const { projectId, task } = action.payload;
        const targetProjectId = projectId || GENERAL_TASKS_PROJECT_ID;
        const newProjects = state.projects.map(project =>
            project.id === targetProjectId 
            ? { ...project, tasks: [...project.tasks, {...task, projectId: targetProjectId}] } 
            : project
        );
        return { ...state, projects: newProjects, events: updateAllEvents(state, newProjects) };
    }
    case 'UPDATE_TASK': {
        const newProjects = state.projects.map(project =>
            project.id === action.payload.projectId ? { ...project, tasks: project.tasks.map(task => task.id === action.payload.task.id ? action.payload.task : task) } : project
        );
        return { ...state, projects: newProjects, events: updateAllEvents(state, newProjects) };
    }
    case 'DELETE_TASK': {
        const newProjects = state.projects.map(project =>
            project.id === action.payload.projectId ? { ...project, tasks: project.tasks.filter(task => task.id !== action.payload.taskId) } : project
        );
        return { ...state, projects: newProjects, events: updateAllEvents(state, newProjects) };
    }
    
    case 'ADD_SUBTASK': {
      const { projectId, taskId, subtask } = action.payload;
      const newProjects = state.projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              tasks: p.tasks.map(t =>
                t.id === taskId
                  ? { ...t, subtasks: [...(t.subtasks || []), subtask] }
                  : t
              ),
            }
          : p
      );
      return { ...state, projects: newProjects };
    }

    case 'UPDATE_SUBTASK': {
      const { projectId, taskId, subtask } = action.payload;
      const newProjects = state.projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              tasks: p.tasks.map(t =>
                t.id === taskId
                  ? {
                      ...t,
                      subtasks: t.subtasks?.map(st =>
                        st.id === subtask.id ? subtask : st
                      ),
                    }
                  : t
              ),
            }
          : p
      );
      return { ...state, projects: newProjects };
    }

    case 'DELETE_SUBTASK': {
      const { projectId, taskId, subtaskId } = action.payload;
      const newProjects = state.projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              tasks: p.tasks.map(t =>
                t.id === taskId
                  ? {
                      ...t,
                      subtasks: t.subtasks?.filter(st => st.id !== subtaskId),
                    }
                  : t
              ),
            }
          : p
      );
      return { ...state, projects: newProjects };
    }


    case 'ADD_SCHEDULE_TEMPLATE':
      return { ...state, scheduleTemplates: [...state.scheduleTemplates, action.payload] };

    case 'UPDATE_SCHEDULE_TEMPLATE':
      return {
        ...state,
        scheduleTemplates: state.scheduleTemplates.map(template =>
          template.id === action.payload.id ? action.payload : template
        )
      };

    case 'DELETE_SCHEDULE_TEMPLATE':
      return {
        ...state,
        scheduleTemplates: state.scheduleTemplates.filter(template => template.id !== action.payload),
        recurringClasses: state.recurringClasses.filter(rc => rc.scheduleTemplateId !== action.payload),
        events: state.events.filter(event => event.scheduleTemplateId !== action.payload)
      };

    case 'ADD_RECURRING_CLASS': {
      const template = state.scheduleTemplates.find(t => t.id === action.payload.scheduleTemplateId);
      if (!template) return state;
      const newEvents = generateRecurringEvents(action.payload, template);
      return { ...state, recurringClasses: [...state.recurringClasses, action.payload], events: [...state.events, ...newEvents] };
    }

    case 'UPDATE_RECURRING_CLASS': {
      const template = state.scheduleTemplates.find(t => t.id === action.payload.scheduleTemplateId);
      if (!template) return state;
      const eventsWithoutOldRecurring = state.events.filter(event => !event.scheduleTemplateId || !event.id.startsWith(`recurring-${action.payload.id}-`));
      const newEvents = generateRecurringEvents(action.payload, template);
      return { ...state, recurringClasses: state.recurringClasses.map(rc => rc.id === action.payload.id ? action.payload : rc), events: [...eventsWithoutOldRecurring, ...newEvents] };
    }

    case 'DELETE_RECURRING_CLASS':
      return { ...state, recurringClasses: state.recurringClasses.filter(rc => rc.id !== action.payload), events: state.events.filter(event => !event.id.startsWith(`recurring-${action.payload}-`)) };
    
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload };
    
    case 'TOGGLE_EVENT_MODAL':
      return { ...state, showEventModal: !state.showEventModal, selectedEvent: action.payload };
    
    case 'TOGGLE_PROJECT_MODAL':
      return { ...state, showProjectModal: !state.showProjectModal, selectedProjectId: action.payload };

    case 'TOGGLE_COURSE_MODAL':
      return { ...state, showCourseModal: !state.showCourseModal, courseModalInfo: action.payload };
    
    case 'TOGGLE_SCHEDULE_TEMPLATE_MODAL':
      return { ...state, showScheduleTemplateModal: !state.showScheduleTemplateModal, selectedScheduleTemplate: action.payload };
    
    case 'TOGGLE_RECURRING_CLASS_MODAL':
      return { ...state, showRecurringClassModal: !state.showRecurringClassModal, selectedRecurringClass: action.payload };

    case 'TOGGLE_TASK_MODAL':
      return { ...state, showTaskModal: !state.showTaskModal, selectedTask: action.payload };
      
    case 'CLOSE_MODALS':
      return {
        ...state,
        showEventModal: false,
        showProjectModal: false,
        showCourseModal: false,
        showScheduleTemplateModal: false,
        showRecurringClassModal: false,
        showTaskModal: false,
        selectedEvent: undefined,
        selectedProjectId: undefined,
        courseModalInfo: undefined,
        selectedScheduleTemplate: undefined,
        selectedRecurringClass: undefined,
        selectedTask: undefined,
      };

    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };

    case 'TOGGLE_MOBILE_MENU':
      return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };

    case 'SET_KANBAN_PROJECT':
      return { ...state, selectedKanbanProjectId: action.payload };

    case 'UPDATE_TASK_STATUS': {
      const { projectId, taskId, newStatus } = action.payload;
      const newProjects = state.projects.map(project => {
        if (project.id === projectId) {
          const newTasks = project.tasks.map(task => {
            if (task.id === taskId) {
              return {
                ...task,
                columnId: newStatus,
                completed: newStatus === 'done'
              };
            }
            return task;
          });
          return { ...project, tasks: newTasks };
        }
        return project;
      });
      return { ...state, projects: newProjects, events: updateAllEvents(state, newProjects) };
    }

    case 'ADD_COLUMN': {
      const { projectId, title } = action.payload;
      const newProjects = state.projects.map(project => {
        if (project.id === projectId) {
          const newColumn: KanbanColumn = { id: nanoid(), title };
          return {
            ...project,
            columns: [...(project.columns || []), newColumn],
          };
        }
        return project;
      });
      return { ...state, projects: newProjects };
    }
      
    case 'UPDATE_COLUMN': {
      const { projectId, column } = action.payload;
      const newProjects = state.projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            columns: p.columns.map(c => c.id === column.id ? column : c),
          };
        }
        return p;
      });
      return { ...state, projects: newProjects };
    }

    case 'DELETE_COLUMN': {
      const { projectId, columnId } = action.payload;
      const newProjects = state.projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            columns: p.columns.filter(c => c.id !== columnId),
            tasks: p.tasks.filter(t => t.columnId !== columnId),
          };
        }
        return p;
      });
      return { ...state, projects: newProjects, events: updateAllEvents(state, newProjects) };
    }
    
    case 'SHOW_CONFIRMATION_MODAL':
      return {
        ...state,
        confirmationModal: {
          ...action.payload,
          isOpen: true,
        },
      };

    case 'CLOSE_CONFIRMATION_MODAL':
      return {
        ...state,
        confirmationModal: initialConfirmationState,
      };

    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction>; } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (<AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>);
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) { throw new Error('useApp must be used within AppProvider'); }
  return context;
}
