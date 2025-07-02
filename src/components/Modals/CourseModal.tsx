// src/components/Modals/CourseModal.tsx
import React, { useState, useEffect } from 'react';
import { X, BookOpen, FileText, Calendar, Plus, Trash2, Clock } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Project, Task } from '../../types';

export default function CourseModal() {
  const { state, dispatch } = useApp();
  const { showCourseModal, courseModalInfo, projects, recurringClasses, scheduleTemplates } = state;

  const selectedCourse = courseModalInfo?.id
    ? projects.find(p => p.id === courseModalInfo.id)
    : null;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (selectedCourse) {
      setFormData({
        name: selectedCourse.name,
        description: selectedCourse.description || '',
        color: selectedCourse.color,
        startDate: selectedCourse.startDate.toISOString().split('T')[0],
        endDate: selectedCourse.endDate?.toISOString().split('T')[0] || ''
      });
    } else {
      // Reset for new course
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
      });
    }
  }, [selectedCourse, showCourseModal]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const courseData: Project = {
      id: selectedCourse?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      type: 'course', // Aina tyyppi 'course'
      color: formData.color,
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      tasks: selectedCourse?.tasks || [],
      files: selectedCourse?.files || []
    };

    if (selectedCourse) {
      dispatch({ type: 'UPDATE_PROJECT', payload: courseData });
    } else {
      dispatch({ type: 'ADD_PROJECT', payload: courseData });
    }

    dispatch({ type: 'CLOSE_MODALS' });
  };

  const handleDelete = () => {
    if (selectedCourse) {
      dispatch({ type: 'DELETE_PROJECT', payload: selectedCourse.id });
      dispatch({ type: 'CLOSE_MODALS' });
    }
  };

  if (!showCourseModal) return null;

  const colorOptions = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
                {selectedCourse ? 'Muokkaa kurssia' : 'Luo uusi kurssi'}
            </h2>
            <button
                onClick={() => dispatch({ type: 'CLOSE_MODALS' })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <BookOpen className="w-4 h-4 inline mr-2" />
                        Kurssin nimi
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Kurssin nimi"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-4 h-4 inline mr-2" />
                        Lisätietoja
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Kurssin kuvaus"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Väri
                    </label>
                    <div className="flex space-x-2">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            formData.color === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Alkamispäivä
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Päättymispäivä (valinnainen)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Oppitunnit-osio tulee tähän myöhemmin */}

                <div className="flex justify-between pt-4 border-t border-gray-200 mt-6">
                    {selectedCourse && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            Poista kurssi
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
                            {selectedCourse ? 'Päivitä kurssi' : 'Luo kurssi'}
                        </button>
                    </div>
                </div>
              </form>
            </div>
        </div>
    </div>
  );
}
