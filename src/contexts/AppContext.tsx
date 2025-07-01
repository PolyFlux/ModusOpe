import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Event, Project, Task, CalendarView, ScheduleTemplate, RecurringClass } from '../types';

// APUFUNKTIO 1: Luo tapahtumat projektien määräajoista
function generateProjectDeadlineEvents(projects: Project[]): Event[] {
  return projects
    .filter(project => project.endDate)
    .map(project => ({
      id: `project-deadline-${project.id}`,
      title: `${project.name}`, // "DL:"-etuliite poistettu
      date: project.endDate!,
      type: 'deadline',
      color: '#EF4444',
      projectId: project.id,
    }));
}

// APUFUNKTIO 2: Luo tapahtumat tehtävien määräajoista
function generateTaskDeadlineEvents(projects: Project[]): Event[] {
    const allTasks = projects.flatMap(p => p.tasks);
    return allTasks
        .filter(task => task.dueDate)
        .map(task => ({
            id: `task-deadline-${task.id}`,
            title: task.title,
            date: task.dueDate!,
            type: 'deadline',
            color: '#F59E0B', // Keltainen väri tehtävän määräajoille
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
  showScheduleTemplateModal: boolean;
  showRecurringClassModal: boolean;
  selectedEvent?: Event;
  selectedProjectId?: string;
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

// Yhdistetty funktio kaikkien kalenteritapahtumien päivittämiseen
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
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id ? action.payload : event
        )
      };

    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload)
      };

    case 'ADD_PROJECT': {
      const newProjects = [...state.projects, action.payload];
      return {
        ...state,
        projects: newProjects,
        events: updateAllEvents(state, newProjects)
      };
    }

    case 'UPDATE_PROJECT': {
      const newProjects = state.projects.map(p =>
        p.id === action.payload.id ? action.payload : p
      );
      return {
        ...state,
        projects: newProjects,
        events: updateAllEvents(state, newProjects)
      };
    }

    case 'DELETE_PROJECT': {
      const newProjects = state.projects.filter(
        project => project.id !== action.payload
      );
      const otherEvents = state.events.filter(
        event => event.projectId !== action.payload
      );
      const nonDeadlineEvents = otherEvents.filter(e => !e.id.startsWith('project-deadline-') && !e.id.startsWith('task-deadline-'));
      const projectDeadlines
