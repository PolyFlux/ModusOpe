import React, { useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Calendar, Clock, CheckSquare, ClipboardCheck, AlertCircle, ListTodo, CalendarClock, XOctagon } from 'lucide-react';
import { formatDate, isToday, addDays } from '../../utils/dateUtils';
import { GENERAL_TASKS_PROJECT_ID } from '../../contexts/AppContext';
import { Task } from '../../types';

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const { events, projects } = state;

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0); // Asetetaan päivän alkuun vertailua varten
    return d;
  }, []);
  
  const nextWeek = useMemo(() => addDays(today, 7), [today]);

  const todayEvents = useMemo(() => events.filter(event => isToday(new Date(event.date))), [events]);

  const allTasks = useMemo(() => projects.flatMap(project => 
    project.tasks.map(task => ({
      ...task,
      projectName: project.name,
      projectColor: project.color
    }))
  ), [projects]);
  
  const upcomingTasks = useMemo(() => allTasks
    .filter(task => !task.completed && task.dueDate && new Date(task.dueDate) >= today)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5), [allTasks, today]);

  const urgentTasks = useMemo(() => allTasks
    .filter(task => !task.completed && task.dueDate && new Date(task.dueDate) >= today && new Date(task.dueDate) <= nextWeek)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5), [allTasks, today, nextWeek]);

  const overdueTasks = useMemo(() => allTasks
    .filter(task => !task.completed && task.dueDate && new Date(task.dueDate) < today)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5), [allTasks, today]);
  
  const activeProjects = useMemo(() => projects.filter(p => p.id !== GENERAL_TASKS_PROJECT_ID), [projects]);

  const handleTaskClick = (task: Task) => {
    dispatch({ type: 'TOGGLE_TASK_MODAL', payload: task });
  };

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Kojelauta</h1>
        <p className="text-gray-500 mt-2">Tervetuloa takaisin! Tässä päivän yhteenveto.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-md transition-transform transform hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tämänpäiväiset tapahtumat</p>
              <p className="text-3xl font-bold text-gray-800">{todayEvents.length}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md transition-transform transform hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Aktiiviset projektit</p>
              <p className="text-3xl font-bold text-gray-800">{activeProjects.length}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl">
              <ClipboardCheck className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md transition-transform transform hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Kiireelliset tehtävät</p>
              <p className="text-3xl font-bold text-gray-800">{urgentTasks.length}</p>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-xl">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md transition-transform transform hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Myöhässä</p>
              <p className="text-3xl font-bold text-gray-800">{overdueTasks.length}</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl">
              <Clock className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Upcoming Tasks */}
        <div className="bg-white rounded-xl shadow-md lg:col-span-1">
          <div className="p-6 flex items-center space-x-3 border-b border-gray-200">
            <div className="p-2 bg-blue-500/10 rounded-lg">
                <ListTodo className="h-5 w-5 text-blue-500" />
            </div>
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Seuraavat määräajat</h2>
                <p className="text-sm text-gray-500">5 seuraavaksi umpeutuvaa tehtävää</p>
            </div>
          </div>
          <div className="p-6">
            {upcomingTasks.length > 0 ? (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-100/70 cursor-pointer transition-colors"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: task.projectColor }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{task.title}</h3>
                      <p className="text-sm text-gray-500">
                        {task.projectName} • {formatDate(new Date(task.dueDate!))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Ei tulevia tehtäviä. Hienoa!</p>
            )}
          </div>
        </div>

        {/* Urgent Tasks */}
        <div className="bg-white rounded-xl shadow-md lg:col-span-1">
          <div className="p-6 flex items-center space-x-3 border-b border-gray-200">
             <div className="p-2 bg-yellow-500/10 rounded-lg">
                <CalendarClock className="h-5 w-5 text-yellow-500" />
             </div>
             <div>
                <h2 className="text-lg font-semibold text-gray-800">Kiireelliset tehtävät</h2>
                <p className="text-sm text-gray-500">Määräaika 7 päivän sisällä</p>
             </div>
          </div>
          <div className="p-6">
            {urgentTasks.length > 0 ? (
              <div className="space-y-3">
                {urgentTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-100/70 cursor-pointer transition-colors"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: task.projectColor }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{task.title}</h3>
                      <p className="text-sm text-gray-500">
                        {task.projectName} • {formatDate(new Date(task.dueDate!))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Ei kiireellisiä tehtäviä</p>
            )}
          </div>
        </div>
        
        {/* Overdue Tasks */}
        <div className="bg-white rounded-xl shadow-md lg:col-span-1">
            <div className="p-6 flex items-center space-x-3 border-b border-gray-200">
             <div className="p-2 bg-red-500/10 rounded-lg">
                <XOctagon className="h-5 w-5 text-red-500" />
             </div>
             <div>
                <h2 className="text-lg font-semibold text-gray-800">Myöhässä olevat tehtävät</h2>
                <p className="text-sm text-gray-500">Nämä vaativat huomiotasi</p>
             </div>
          </div>
          <div className="p-6">
            {overdueTasks.length > 0 ? (
              <div className="space-y-3">
                {overdueTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-100/70 cursor-pointer transition-colors"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: task.projectColor }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{task.title}</h3>
                      <p className="text-sm text-red-500">
                        Myöhässä: {formatDate(new Date(task.dueDate!))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Kaikki ajallaan, hienoa!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
