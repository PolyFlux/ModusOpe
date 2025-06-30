import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Event, Project, Task, CalendarView, ScheduleTemplate, RecurringClass } from '../types';

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
    {
      id: '1',
      title: 'Matematiikka - Algebra',
      description: 'Johdatus toisen asteen yhtälöihin',
      date: new Date(2025, 0, 15, 9, 0),
      startTime: '09:00',
      endTime: '10:30',
      type: 'class',
      color: '#3B82F6',
      projectId: 'math-course'
    },
    {
      id: '2',
      title: 'Tiedekuntakokous',
      description: 'Kuukausittainen osastokokous',
      date: new Date(2025, 0, 16, 14, 0),
      startTime: '14:00',
      endTime: '15:30',
      type: 'meeting',
      color: '#8B5CF6'
    },
    {
      id: '3',
      title: 'Tehtävä: Essee',
      description: 'Kirjallisuusanalyysi esseet',
      date: new Date(2025, 0, 18),
      type: 'deadline',
      color: '#EF4444',
      projectId: 'literature-course'
    }
  ],
  projects: [
    {
      id: 'math-course',
      name: 'Matematiikan kurssi',
      description: 'Algebra ja geometria 10. luokalle',
      color: '#3B82F6',
      type: 'course',
      startDate: new Date(2025, 0, 1),
      endDate: new Date(2025, 5, 30),
      tasks: [
        {
          id: 'task-1',
          title: 'Valmistele välikoe',
          description: 'Luo kysymyksiä luvuista 1-5',
          completed: false,
          priority: 'high',
          dueDate: new Date(2025, 0, 25),
          projectId: 'math-course'
        },
        {
          id: 'task-2',
          title: 'Arvioi kotitehtävät',
          description: 'Tarkista ja arvioi viikon 2 tehtävät',
          completed: true,
          priority: 'medium',
          dueDate: new Date(2025, 0, 14),
          projectId: 'math-course'
        }
      ]
    },
    {
      id: 'literature-course',
      name: 'Kirjallisuuden kurssi',
      description: 'Modernin kirjallisuuden analyysi',
      color: '#10B981',
      type: 'course',
      startDate: new Date(2025, 0, 1),
      endDate: new Date(2025, 5, 30),
      tasks: [
        {
          id: 'task-3',
          title: 'Suunnittele kirjakeskustelu',
          description: 'Valmistele keskustelukysymyksiä "Gatsby"-kirjalle',
          completed: false,
          priority: 'medium',
          dueDate: new Date(2025, 0, 20),
          projectId: 'literature-course'
        }
      ]
    }
  ],
  scheduleTemplates: [
    {
      id: 'math-9a',
      name: 'Matematiikka 9A',
      description: 'Algebra ja geometria',
      dayOfWeek: 0, // Monday
      startTime: '08:00',
      endTime: '09:30',
      color: '#3B82F6'
    },
    {
      id: 'math-9b',
      name: 'Matematiikka 9A',
      description: 'Algebra ja geometria',
      dayOfWeek: 2, // Wednesday
      startTime: '10:00',
      endTime: '11:30',
      color: '#3B82F6'
    },
    {
      id: 'math-9c',
      name: 'Matematiikka 9A',
      description: 'Algebra ja geometria',
      dayOfWeek: 4, // Friday
      startTime: '13:00',
      endTime: '14:30',
      color: '#3B82F6'
    }
  ],
  recurringClasses: [
    {
      id: 'recurring-math-9a-0',
      title: 'Matematiikka 9A - Syksy',
      description: 'Syksyn matematiikan tunnit',
      scheduleTemplateId: 'math-9a',
      startDate: new Date(2025, 0, 6), // First Monday of year
      endDate: new Date(2025, 4, 30), // End of May
      color: '#3B82F6',
      groupName: 'Matematiikka 9A'
    },
    {
      id: 'recurring-math-9a-1',
      title: 'Matematiikka 9A - Syksy',
      description: 'Syksyn matematiikan tunnit',
      scheduleTemplateId: 'math-9b',
      startDate: new Date(2025, 0, 6),
      endDate: new Date(2025, 4, 30),
      color: '#3B82F6',
      groupName: 'Matematiikka 9A'
    },
    {
      id: 'recurring-math-9a-2',
      title: 'Matematiikka 9A - Syksy',
      description: 'Syksyn matematiikan tunnit',
      scheduleTemplateId: 'math-9c',
      startDate: new Date(2025, 0, 6),
      endDate: new Date(2025, 4, 30),
      color: '#3B82F6',
      groupName: 'Matematiikka 9A'
    }
  ],
  currentView: 'month',
  selectedDate: new Date(),
  showEventModal: false,
  showProjectModal: false,
  showScheduleTemplateModal: false,
  showRecurringClassModal: false
};

// Helper function to generate recurring events
function generateRecurringEvents(recurringClass: RecurringClass, template: ScheduleTemplate): Event[] {
  const events: Event[] = [];
  const startDate = new Date(recurringClass.startDate);
  const endDate = new Date(recurringClass.endDate);
  
  // Find the first occurrence of the target day
  const targetDay = template.dayOfWeek; // 0 = Monday, 1 = Tuesday, etc.
  const currentDate = new Date(startDate);
  
  // Adjust to first Monday (since our week starts with Monday = 0)
  const currentDay = (currentDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0 system
  const daysToAdd = (targetDay - currentDay + 7) % 7;
  currentDate.setDate(currentDate.getDate() + daysToAdd);
  
  // Generate events for each week
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
      groupName: recurringClass.groupName // Lisää ryhmänimi tapahtumaan!
    });
    
    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return events;
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
    
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? action.payload : project
        )
      };
    
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        events: state.events.filter(event => event.projectId !== action.payload)
      };
    
    case 'ADD_TASK':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.projectId
            ? { ...project, tasks: [...project.tasks, action.payload.task] }
            : project
        )
      };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.projectId
            ? {
                ...project,
                tasks: project.tasks.map(task =>
                  task.id === action.payload.task.id ? action.payload.task : task
                )
              }
            : project
        )
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.projectId
            ? {
                ...project,
                tasks: project.tasks.filter(task => task.id !== action.payload.taskId)
              }
            : project
        )
      };
    
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
      
      return {
        ...state,
        recurringClasses: [...state.recurringClasses, action.payload],
        events: [...state.events, ...newEvents]
      };
    }
    
    case 'UPDATE_RECURRING_CLASS': {
      const template = state.scheduleTemplates.find(t => t.id === action.payload.scheduleTemplateId);
      if (!template) return state;
      
      // Remove old recurring events
      const eventsWithoutOldRecurring = state.events.filter(event => 
        !event.scheduleTemplateId || 
        !event.id.startsWith(`recurring-${action.payload.id}-`)
      );
      
      // Generate new recurring events
      const newEvents = generateRecurringEvents(action.payload, template);
      
      return {
        ...state,
        recurringClasses: state.recurringClasses.map(rc =>
          rc.id === action.payload.id ? action.payload : rc
        ),
        events: [...eventsWithoutOldRecurring, ...newEvents]
      };
    }
    
    case 'DELETE_RECURRING_CLASS':
      return {
        ...state,
        recurringClasses: state.recurringClasses.filter(rc => rc.id !== action.payload),
        events: state.events.filter(event => 
          !event.id.startsWith(`recurring-${action.payload}-`)
        )
      };
    
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload };
    
    case 'TOGGLE_EVENT_MODAL':
      return {
        ...state,
        showEventModal: !state.showEventModal,
        selectedEvent: action.payload
      };
    
    case 'TOGGLE_PROJECT_MODAL':
      return {
        ...state,
        showProjectModal: !state.showProjectModal,
        selectedProjectId: action.payload
      };
    
    case 'TOGGLE_SCHEDULE_TEMPLATE_MODAL':
      return {
        ...state,
        showScheduleTemplateModal: !state.showScheduleTemplateModal,
        selectedScheduleTemplate: action.payload
      };
    
    case 'TOGGLE_RECURRING_CLASS_MODAL':
      return {
        ...state,
        showRecurringClassModal: !state.showRecurringClassModal,
        selectedRecurringClass: action.payload
      };
    
    case 'CLOSE_MODALS':
      return {
        ...state,
        showEventModal: false,
        showProjectModal: false,
        showScheduleTemplateModal: false,
        showRecurringClassModal: false,
        selectedEvent: undefined,
        selectedProjectId: undefined,
        selectedScheduleTemplate: undefined,
        selectedRecurringClass: undefined
      };
    
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}