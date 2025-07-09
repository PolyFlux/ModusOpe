import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { BookOpen, Calendar, CheckSquare, Plus } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

export default function ProjectList() {
  const { state, dispatch } = useApp();
  const projects = state.projects.filter(p => p.type !== 'course');

  const handleProjectClick = (projectId: string) => {
    dispatch({ type: 'TOGGLE_PROJECT_MODAL', payload: projectId });
  };

  const getTaskStats = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return { completed: 0, total: 0 };
    
    const completed = project.tasks.filter(task => task.completed).length;
    const total = project.tasks.length;
    return { completed, total };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-2">Manage your courses and projects</p>
        </div>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_PROJECT_MODAL' })}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </button>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const taskStats = getTaskStats(project.id);
          const completionRate = taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;

          return (
            <div
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      {project.type}
                    </span>
                  </div>
                </div>
                <BookOpen className="w-5 h-5 text-gray-400" />
              </div>

              {project.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="space-y-3">
                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(completionRate)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${completionRate}%`,
                        backgroundColor: project.color
                      }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <CheckSquare className="w-4 h-4" />
                    <span>{taskStats.completed}/{taskStats.total} tasks</span>
                  </div>
                  {project.endDate && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Due {formatDate(project.endDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-4">Create your first project to get started</p>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_PROJECT_MODAL' })}
            className="btn-glossy flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </button>
        </div>
      )}
    </div>
  );
}
