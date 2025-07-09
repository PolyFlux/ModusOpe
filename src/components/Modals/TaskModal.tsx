// src/components/Modals/TaskModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Type, FileText, Calendar, AlertCircle, Bookmark } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Task } from '../../types';

export default function TaskModal() {
  const { state, dispatch } = useApp();
  const { showTaskModal, selectedTask, projects } = state;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    dueDate: '',
    projectId: ''
  });

  useEffect(() => {
    if (selectedTask) {
      setFormData({
        title: selectedTask.title,
        description: selectedTask.description || '',
        priority: selectedTask.priority,
        dueDate: selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : '',
        projectId: selectedTask.projectId
      });
    } else {
      const defaultProjectId = projects.length > 0 ? projects[0].id : '';
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        projectId: defaultProjectId
      });
    }
  }, [selectedTask, showTaskModal, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId) {
        alert("Valitse projekti!");
        return;
    }

    const taskData: Task = {
      id: selectedTask?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      completed: selectedTask?.completed || false,
      priority: formData.priority,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      projectId: formData.projectId
    };

    if (selectedTask) {
      dispatch({ type: 'UPDATE_TASK', payload: { projectId: taskData.projectId, task: taskData } });
    } else {
      dispatch({ type: 'ADD_TASK', payload: { projectId: taskData.projectId, task: taskData } });
    }

    dispatch({ type: 'CLOSE_MODALS' });
  };
  
  const handleDelete = () => {
    if (selectedTask) {
      dispatch({ type: 'DELETE_TASK', payload: { projectId: selectedTask.projectId, taskId: selectedTask.id } });
      dispatch({ type: 'CLOSE_MODALS' });
    }
  };

  if (!showTaskModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedTask ? 'Muokkaa tehtävää' : 'Luo uusi tehtävä'}
          </h2>
          <button
            onClick={() => dispatch({ type: 'CLOSE_MODALS' })}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Bookmark className="w-4 h-4 inline mr-2" />
              Projekti
            </label>
            <select
              required
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="" disabled>Valitse projekti</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Type className="w-4 h-4 inline mr-2" />
              Otsikko
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tehtävän otsikko"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Kuvaus
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Tehtävän kuvaus"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Prioriteetti
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Matala</option>
                <option value="medium">Keskitaso</option>
                <option value="high">Korkea</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Määräpäivä
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-200 mt-2">
              {selectedTask && (
                  <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                      Poista tehtävä
                  </button>
              )}
              <div className="flex space-x-3 ml-auto">
                  <button
                      type="button"
                      onClick={() => dispatch({ type: 'CLOSE_MODALS' })}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                      Peruuta
                  </button>
                  <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                      {selectedTask ? 'Päivitä tehtävä' : 'Luo tehtävä'}
                  </button>
              </div>
          </div>
        </form>
      </div>
    </div>
  );
}
