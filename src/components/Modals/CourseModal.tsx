import React, { useState, useEffect } from 'react';
import { X, BookOpen, FileText, Calendar, Clock } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Project } from '../../types';

export default function CourseModal() {
  const { state, dispatch } = useApp();
  const { showCourseModal, courseModalInfo, projects, scheduleTemplates } = state;

  const selectedCourse = courseModalInfo?.id
    ? projects.find(p => p.id === courseModalInfo.id && p.type === 'course')
    : null;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    startDate: '',
    endDate: '',
    templateGroupName: ''
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
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        templateGroupName: ''
      });
    }
  }, [selectedCourse, showCourseModal]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

const courseData: any = { // Käytetään 'any' väliaikaisesti, koska lisäämme custom-kentän
    id: selectedCourse?.id || Date.now().toString(),
    name: formData.name,
    description: formData.description,
    type: 'course',
    color: formData.color,
    startDate: new Date(formData.startDate),
    endDate: formData.endDate ? new Date(formData.endDate) : undefined,
    tasks: selectedCourse?.tasks || [],
    files: selectedCourse?.files || [],
    templateGroupName: formData.templateGroupName // LISÄÄ TÄMÄ
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
                        placeholder="Esim. Matematiikka 9A; FY7"
                    />
                </div>

{/* ===== TUNTIRYHMÄN VALINTA ALKAA ===== */}
{!selectedCourse && (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-2" />
            Valitse tuntiryhmä (luo oppitunnit automaattisesti)
        </label>
        <select
            value={formData.templateGroupName}
            onChange={(e) => {
                const groupName = e.target.value;
                // Täytetään kurssin nimi automaattisesti, jos se on tyhjä
                setFormData({ 
                    ...formData, 
                    templateGroupName: groupName,
                    name: formData.name || groupName
                });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
            <option value="">Ei valintaa (luo tyhjä kurssi)</option>
            {/* Luodaan uniikit ryhmänimet */}
            {[...new Set(scheduleTemplates.map(t => t.name))].map(groupName => (
                <option key={groupName} value={groupName}>
                    {groupName}
                </option>
            ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Valitsemalla tuntiryhmän luot kurssille oppitunnit automaattisesti kiertotuntikaavion pohjalta.</p>
    </div>
)}
{/* ===== TUNTIRYHMÄN VALINTA PÄÄTTYY ===== */}
                
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
                        placeholder="Tarkemmat tiedot kurssista"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4">
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
                            formData.color === color ? 'border-gray-800 ring-2 ring-gray-300' : 'border-gray-200 hover:border-gray-400'
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
                      Päättymispäivä
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                      {/* ===== OPPITUNNIT-OSIO ALKAA ===== */}
<div className="border-t border-gray-200 pt-4 mt-4">
    <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Oppitunnit</h3>
        <button
            type="button"
            onClick={() => dispatch({ type: 'TOGGLE_RECURRING_CLASS_MODAL' })}
            className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            // Nappi toimii vain, kun kurssi on jo tallennettu kerran (eli sitä muokataan)
            disabled={!selectedCourse}
        >
            <Clock className="w-4 h-4 mr-1" />
            Lisää oppitunti
        </button>
    </div>

    {selectedCourse ? (
        <div className="space-y-2">
            {recurringClasses
                .filter(rc => rc.projectId === selectedCourse.id)
                .map(lesson => {
                    const template = scheduleTemplates.find(t => t.id === lesson.scheduleTemplateId);
                    const weekDays = ['Ma', 'Ti', 'Ke', 'To', 'Pe'];
                    return (
                        <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <Clock className="w-4 h-4 text-green-600" />
                                <div>
                                    <div className="font-medium text-gray-900">{lesson.title}</div>
                                    <div className="text-sm text-gray-600">
                                        {template ? `${weekDays[template.dayOfWeek]} klo ${template.startTime}-${template.endTime}` : 'Tuntematon aika'}
                                    </div>
                                </div>
                            </div>
                            {/* Tähän voisi lisätä poisto-napin tulevaisuudessa */}
                        </div>
                    );
                })
            }
            {recurringClasses.filter(rc => rc.projectId === selectedCourse.id).length === 0 && (
                 <p className="text-gray-500 text-center py-4">Ei liitettyjä oppitunteja.</p>
            )}
        </div>
    ) : (
         <p className="text-gray-500 text-center py-4 text-sm">Tallenna kurssi ensin, jotta voit lisätä sille oppitunteja.</p>
    )}
</div>
{/* ===== OPPITUNNIT-OSIO PÄÄTTYY ===== */}

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
