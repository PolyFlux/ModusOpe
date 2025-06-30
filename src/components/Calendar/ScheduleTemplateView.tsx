import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { ScheduleTemplate } from '../../types';

export default function ScheduleTemplateView() {
  const { state, dispatch } = useApp();
  const { scheduleTemplates } = state;

  const weekDays = ['Maanantai', 'Tiistai', 'Keskiviikko', 'Torstai', 'Perjantai'];
  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = (i + 6).toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const handleAddTemplate = () => {
    dispatch({ type: 'TOGGLE_SCHEDULE_TEMPLATE_MODAL' });
  };

  const handleEditTemplate = (template: ScheduleTemplate) => {
    dispatch({ type: 'TOGGLE_SCHEDULE_TEMPLATE_MODAL', payload: template });
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Haluatko varmasti poistaa tämän tuntiryhmän?')) {
      dispatch({ type: 'DELETE_SCHEDULE_TEMPLATE', payload: templateId });
    }
  };

  const getTemplatesForDay = (dayIndex: number): ScheduleTemplate[] => {
    return scheduleTemplates.filter(template => template.dayOfWeek === dayIndex);
  };

  const getTemplatePosition = (template: ScheduleTemplate) => {
    const [startHour, startMinute] = template.startTime.split(':').map(Number);
    const [endHour, endMinute] = template.endTime.split(':').map(Number);
    
    const startPosition = ((startHour - 6) * 60) + startMinute; // Minutes from 6:00
    const duration = ((endHour - startHour) * 60) + (endMinute - startMinute);
    
    return {
      top: (startPosition / 60) * 48, // 48px per hour
      height: Math.max((duration / 60) * 48, 24) // Minimum 24px height
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Kiertotuntikaavio</h3>
          <p className="text-sm text-gray-600 mt-1">
            Määritä toistuvat oppitunnit viikon aikana
          </p>
        </div>
        <button
          onClick={handleAddTemplate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Lisää tuntiryhmä
        </button>
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-6 border-b border-gray-200">
        <div className="p-4"></div>
        {weekDays.map((day, index) => (
          <div key={index} className="p-4 text-center border-l border-gray-200">
            <div className="font-medium text-gray-900">{day}</div>
          </div>
        ))}
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        <div className="grid grid-cols-6">
          {/* Time column */}
          <div className="py-2">
            {timeSlots.map((time) => (
              <div key={time} className="text-xs text-gray-500 pr-2 text-right h-12 flex items-start">
                {time}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => {
            const dayTemplates = getTemplatesForDay(dayIndex);
            
            return (
              <div key={dayIndex} className="border-l border-gray-200 relative">
                {/* Hour lines */}
                {timeSlots.map((time) => (
                  <div
                    key={time}
                    className="h-12 border-b border-gray-100"
                  />
                ))}

                {/* Schedule Templates */}
                {dayTemplates.map((template) => {
                  const position = getTemplatePosition(template);
                  
                  return (
                    <div
                      key={template.id}
                      className="absolute left-1 right-1 rounded-lg p-2 cursor-pointer hover:opacity-80 transition-opacity group"
                      style={{
                        top: `${position.top}px`,
                        height: `${position.height}px`,
                        backgroundColor: template.color + '20',
                        borderLeft: `4px solid ${template.color}`,
                        minHeight: '24px'
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">
                            {template.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {template.startTime} - {template.endTime}
                          </div>
                          {template.description && (
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {template.description}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {scheduleTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ei tuntiryhmäksi määriteltyjä tunteja</h3>
          <p className="text-gray-600 mb-4">Luo ensimmäinen tuntiryhmä aloittaaksesi</p>
          <button
            onClick={handleAddTemplate}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Lisää tuntiryhmä
          </button>
        </div>
      )}
    </div>
  );
}