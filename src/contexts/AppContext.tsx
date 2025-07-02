import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Event, Project, Task, CalendarView, ScheduleTemplate, RecurringClass } from '../types';

function generateProjectDeadlineEvents(projects: Project[]): Event[] {
  return projects
    .filter(project => project.endDate)
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

const initialProjects: Project[] = [];
const initialEvents: Event[] = [];

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
  selectedEvent?: Event;
  selectedProjectId?: string;
  courseModalInfo?: { id?: string };
  selectedScheduleTemplate?: ScheduleTemplate;
  selectedRecurringClass?: RecurringClass;
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
  | { type: 'CLOSE_MODALS' };

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
  showRecurringClassModal: false
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
  const newProject = action.payload as any; // Käytetään 'any' väliaikaisesti
  const templateGroupName = newProject.templateGroupName;
  delete newProject.templateGroupName; // Poistetaan ylimääräinen kenttä

  const newProjects = [...state.projects, newProject];

  let newRecurringClasses = [...state.recurringClasses];
  let newEvents = [...state.events];

  // Jos templateGroupName on annettu, luodaan oppitunnit
  if (templateGroupName) {
    const templatesInGroup = state.scheduleTemplates.filter(t => t.name === templateGroupName);

    templatesInGroup.forEach(template => {
        const recurringClass: RecurringClass = {
            id: `${newProject.id}-${template.id}`,
            title: newProject.name, // Käytetään kurssin nimeä
            scheduleTemplateId: template.id,
            startDate: newProject.startDate,
            endDate: newProject.endDate,
            color: newProject.color,
            groupName: template.name,
            projectId: newProject.id
        };
        newRecurringClasses.push(recurringClass);
        newEvents.push(...generateRecurringEvents(recurringClass, template));
    });
  }

  // Päivitetään kaikki kerralla
  const finalEvents = updateAllEvents({ ...state, events: newEvents }, newProjects);

  return { 
    ...state, 
    projects: newProjects, 
    recurringClasses: newRecurringClasses,
    events: finalEvents
  };
}
    case 'UPDATE_PROJECT': {
      const newProjects = state.projects.map(p => p.id === action.payload.id ? action.payload : p);
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
        const newProjects = state.projects.map(project =>
            project.id === action.payload.projectId ? { ...project, tasks: [...project.tasks, action.payload.task] } : project
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

    // ... loput reducer-funktiosta pysyy ennallaan
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
    
    case 'CLOSE_MODALS':
      return {
        ...state,
        showEventModal: false,
        showProjectModal: false,
        showCourseModal: false,
        showScheduleTemplateModal: false,
        showRecurringClassModal: false,
        selectedEvent: undefined,
        selectedProjectId: undefined,
        courseModalInfo: undefined,
        selectedScheduleTemplate: undefined,
        selectedRecurringClass: undefined
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
