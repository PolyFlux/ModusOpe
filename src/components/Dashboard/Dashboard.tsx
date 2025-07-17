import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Calendar, Clock, CheckSquare, ClipboardCheck, AlertCircle, Archive } from 'lucide-react';
import { formatDate, isToday, addDays } from '../../utils/dateUtils';
import { GENERAL_TASKS_PROJECT_ID } from '../../contexts/AppContext';

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const { events, projects } = state;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Asetetaan päivän alkuun vertailua varten
  const nextWeek = addDays(today, 7);

  // Get upcoming events
  const upcomingEvents = events
    .filter(event => new Date(event.date) >= today && new Date(event.date) <= nextWeek)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Get today's events
  const todayEvents = events.filter(event => isToday(new Date(event.date)));

  // Get all tasks and filter out tasks from the general project
  const allTasks = projects.flatMap(project => 
    project.tasks.map(task => ({
      ...task,
      projectName: project.name,
      projectColor: project.color
    }))
  );

  const urgentTasks = allTasks
    .filter(task => !task.completed && task.dueDate && new Date(task.dueDate) >= today && new Date(task.dueDate) <= nextWeek)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  // UUSI: Myöhässä olevat tehtävät
  const overdueTasks = allTasks
    .filter(task => !task.completed && task.dueDate && new Date(task.dueDate) < today)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const completedTasksCount = allTasks.filter(task => task.completed).length;
  const totalTasksCount = allTasks.length;
  const completionRate = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

  // KORJATTU: Aktiivisten projektien laskenta
  const activeProjects = projects.filter(p => p.id !== GENERAL_TASKS_PROJECT_ID);

  const handleEventClick = (event: any) => {
    dispatch({ type: 'TOGGLE_EVENT_MODAL', payload: event });
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kojelauta</h1>
        <p className="text-gray-600 mt-2">Tervetuloa takaisin! Tässä päivän yhteenveto.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tämänpäiväiset tapahtumat</p>
              <p className="text-3xl font-bold text-gray-900">{todayEvents.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktiiviset projektit</p>
              <p className="text-3xl font-bold text-gray-900">{activeProjects.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ClipboardCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Kiireelliset tehtävät</p>
              <p className="text-3xl font-bold text-gray-900">{urgentTasks.length}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* UUSI: Myöhässä olevat tehtävät -kortti */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Myöhässä</p>
              <p className="text-3xl font-bold text-gray-900">{overdueTasks.length}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Archive className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:col-span-1">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Tulevat tapahtumat</h2>
            <p className="text-sm text-gray-600">Seuraavat 7 päivää</p>
          </div>
          <div className="p-6">
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(new Date(event.date))}
                        {event.startTime && ` klo ${event.startTime}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Ei tulevia tapahtumia</p>
            )}
          </div>
        </div>

        {/* Urgent Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:col-span-1">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Kiireelliset tehtävät</h2>
            <p className="text-sm text-gray-600">Määräaika viikon sisällä</p>
          </div>
          <div className="p-6">
            {urgentTasks.length > 0 ? (
              <div className="space-y-4">
                {urgentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: task.projectColor }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <p className="text-sm text-gray-600">
                        {task.projectName} • Määräaika {formatDate(new Date(task.dueDate!))}
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
        
        {/* UUSI: Myöhässä olevat tehtävät -lista */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:col-span-1">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Myöhässä olevat tehtävät</h2>
            <p className="text-sm text-gray-600">Määräaika mennyt</p>
          </div>
          <div className="p-6">
            {overdueTasks.length > 0 ? (
              <div className="space-y-4">
                {overdueTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: task.projectColor }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <p className="text-sm text-gray-600">
                        {task.projectName} • Myöhässä {formatDate(new Date(task.dueDate!))}
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
