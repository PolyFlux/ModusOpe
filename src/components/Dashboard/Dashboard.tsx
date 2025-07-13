import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Calendar, Clock, CheckSquare, ClipboardCheck, AlertCircle } from 'lucide-react';
import { formatDate, isToday, addDays } from '../../utils/dateUtils';

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const { events, projects } = state;

  const today = new Date();
  const nextWeek = addDays(today, 7);

  // Get upcoming events
  const upcomingEvents = events
    .filter(event => new Date(event.date) >= today && new Date(event.date) <= nextWeek)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Get today's events
  const todayEvents = events.filter(event => isToday(new Date(event.date)));

  // Get urgent tasks
  const allTasks = projects.flatMap(project => 
    project.tasks.map(task => ({
      ...task,
      projectName: project.name,
      projectColor: project.color
    }))
  );

  const urgentTasks = allTasks
    .filter(task => !task.completed && task.dueDate && new Date(task.dueDate) <= nextWeek)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const completedTasksCount = allTasks.filter(task => task.completed).length;
  const totalTasksCount = allTasks.length;
  const completionRate = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

  const handleEventClick = (event: any) => {
    dispatch({ type: 'TOGGLE_EVENT_MODAL', payload: event });
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening today.</p>
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
              <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
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
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valmiina</p>
              <p className="text-3xl font-bold text-gray-900">{Math.round(completionRate)}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Tulevat tapahtumat</h2>
            <p className="text-sm text-gray-600">Next 7 days</p>
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
                        {event.startTime && ` at ${event.startTime}`}
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Kiireelliset tapahtumat</h2>
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
                        {task.projectName} • Due {formatDate(new Date(task.dueDate!))}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Ei kiireellisiä tehtäviä</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
