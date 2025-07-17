import { nanoid } from 'nanoid';
import { AppAction, AppState, GENERAL_TASKS_PROJECT_ID } from '../contexts/AppContext';
import { KanbanColumn } from '../types';
import { createProjectWithTemplates } from '../utils/projectUtils';
import { generateRecurringEvents } from '../utils/eventUtils';

export function projectReducerLogic(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_PROJECT': {
      const { project, newRecurringClasses } = createProjectWithTemplates(action.payload, state.scheduleTemplates);

      const newProjects = [...state.projects, project];
      const updatedRecurringClasses = [...state.recurringClasses, ...newRecurringClasses];
      
      let updatedEvents = [...state.events];
      newRecurringClasses.forEach(rc => {
        const template = state.scheduleTemplates.find(t => t.id === rc.scheduleTemplateId);
        if (template) updatedEvents.push(...generateRecurringEvents(rc, template));
      });

      return {
        ...state,
        projects: newProjects,
        recurringClasses: updatedRecurringClasses,
        events: updatedEvents
      };
    }
  
    case 'UPDATE_PROJECT': {
      const newProjects = state.projects.map(p => 
        p.id === action.payload.id ? { ...p, ...action.payload } : p
      );
      return { ...state, projects: newProjects };
    }
      
    case 'DELETE_PROJECT': {
      const newProjects = state.projects.filter(project => project.id !== action.payload);
      const remainingEvents = state.events.filter(event => event.projectId !== action.payload);
      return { ...state, projects: newProjects, events: remainingEvents };
    }

    case 'ADD_TASK': {
      const { projectId, task } = action.payload;
      const targetProjectId = projectId || GENERAL_TASKS_PROJECT_ID;
      const newProjects = state.projects.map(project =>
          project.id === targetProjectId 
          ? { ...project, tasks: [...project.tasks, {...task, projectId: targetProjectId}] } 
          : project
      );
      return { ...state, projects: newProjects };
    }

    case 'UPDATE_TASK': {
        const { projectId, task } = action.payload;
        const newProjects = state.projects.map(p => {
            if (p.id === projectId) {
                return { ...p, tasks: p.tasks.map(t => t.id === task.id ? task : t) };
            }
            return p;
        });
        return { ...state, projects: newProjects };
    }

    case 'DELETE_TASK': {
        const newProjects = state.projects.map(project =>
            project.id === action.payload.projectId 
            ? { ...project, tasks: project.tasks.filter(task => task.id !== action.payload.taskId) } 
            : project
        );
        return { ...state, projects: newProjects };
    }
    
    case 'ADD_SUBTASK':
    case 'UPDATE_SUBTASK':
    case 'DELETE_SUBTASK': {
        const { projectId, taskId } = action.payload;
        const newProjects = state.projects.map(p => {
            if (p.id !== projectId) return p;
            
            return {
                ...p,
                tasks: p.tasks.map(t => {
                    if (t.id !== taskId) return t;

                    let newSubtasks = t.subtasks || [];
                    if (action.type === 'ADD_SUBTASK') {
                        newSubtasks = [...newSubtasks, action.payload.subtask];
                    } else if (action.type === 'UPDATE_SUBTASK') {
                        newSubtasks = newSubtasks.map(st => st.id === action.payload.subtask.id ? action.payload.subtask : st);
                    } else if (action.type === 'DELETE_SUBTASK') {
                        newSubtasks = newSubtasks.filter(st => st.id !== action.payload.subtaskId);
                    }
                    return { ...t, subtasks: newSubtasks };
                })
            };
        });
        return { ...state, projects: newProjects };
    }

    case 'UPDATE_TASK_STATUS': {
      const { projectId, taskId, newStatus } = action.payload;
      const newProjects = state.projects.map(project => {
        if (project.id === projectId) {
          const newTasks = project.tasks.map(task => {
            if (task.id === taskId) {
              return { ...task, columnId: newStatus, completed: newStatus === 'done' };
            }
            return task;
          });
          return { ...project, tasks: newTasks };
        }
        return project;
      });
      return { ...state, projects: newProjects };
    }

    case 'ADD_COLUMN': {
      const { projectId, title } = action.payload;
      const newProjects = state.projects.map(project => {
        if (project.id === projectId) {
          const newColumn: KanbanColumn = { id: nanoid(), title };
          return { ...project, columns: [...(project.columns || []), newColumn] };
        }
        return project;
      });
      return { ...state, projects: newProjects };
    }
      
    case 'UPDATE_COLUMN': {
      const { projectId, column } = action.payload;
      const newProjects = state.projects.map(p => 
        p.id === projectId ? { ...p, columns: p.columns.map(c => c.id === column.id ? column : c) } : p
      );
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
      return { ...state, projects: newProjects };
    }

    case 'REORDER_COLUMNS': {
      const { projectId, startIndex, endIndex } = action.payload;
      const newProjects = state.projects.map(p => {
        if (p.id === projectId) {
          const newColumns = Array.from(p.columns);
          const [removed] = newColumns.splice(startIndex, 1);
          newColumns.splice(endIndex, 0, removed);
          return { ...p, columns: newColumns };
        }
        return p;
      });
      return { ...state, projects: newProjects };
    }

    default:
      return state;
  }
}
