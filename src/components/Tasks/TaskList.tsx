import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { CheckSquare, Circle, Calendar, AlertCircle } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

export default function TaskList() {
  const { state, dispatch } = useApp();
  const { projects } = state;

  const allTasks = projects.flatMap(project => 
    project.tasks.map(task => ({
      ...task,
      projectName: project.name,
      projectColor: project.color
    }))
  );

  const toggleTask = (projectId: string, taskId: string, completed: boolean) => {
    const project = projects.find(p => p.id === projectId);
    const task = project?.tasks.find(t => t.id === taskId);
    
    if (task) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          projectId,
          task: { ...task, completed }
        }
      });
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const completedTasks = allTasks.filter(task => task.completed);
  const pendingTasks = allTasks.filter(task => !task.completed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-600 mt-2">
          {pendingTasks.length} pending • {completedTasks.length} completed
        </p>
      </div>

      {/* Task Sections */}
      <div className="space-y-8">
        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Tasks ({pendingTasks.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {pendingTasks.map((task) => (
                <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <button
                      onClick={() => toggleTask(task.projectId, task.id, true)}
                      className="mt-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Circle className="w-5 h-5" />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        {getPriorityIcon(task.priority)}
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: task.projectColor }}
                          />
                          <span>{task.projectName}</span>
                        </div>
                        
                        {task.dueDate && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due {formatDate(new Date(task.dueDate))}</span>
                          </div>
                        )}
                        
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Completed Tasks ({completedTasks.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {completedTasks.map((task) => (
                <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors opacity-60">
                  <div className="flex items-start space-x-4">
                    <button
                      onClick={() => toggleTask(task.projectId, task.id, false)}
                      className="mt-1 text-green-600 hover:text-gray-400 transition-colors"
                    >
                      <CheckSquare className="w-5 h-5" />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900 line-through">{task.title}</h3>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: task.projectColor }}
                          />
                          <span>{task.projectName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {allTasks.length === 0 && (
          <div className="text-center py-12">
            <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-600">Tasks will appear here when you add them to your projects</p>
          </div>
        )}
      </div>
    </div>
  );
}