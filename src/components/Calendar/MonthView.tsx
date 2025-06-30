import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { getDaysInMonth, isSameDay, isToday } from '../../utils/dateUtils';
import { Event } from '../../types';

export default function MonthView() {
  const { state, dispatch } = useApp();
  const { selectedDate, events } = state;

  const daysInMonth = getDaysInMonth(selectedDate);
  const currentMonth = selectedDate.getMonth();

  const getEventsForDay = (date: Date): Event[] => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  const handleDateClick = (date: Date) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  };

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_EVENT_MODAL', payload: event });
  };

  // Suomalainen viikkojärjestys: Ma, Ti, Ke, To, Pe, La, Su
  const weekDays = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Week headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day) => (
          <div key={day} className="p-4 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {daysInMonth.map((date, index) => {
          const dayEvents = getEventsForDay(date);
          const isCurrentMonth = date.getMonth() === currentMonth;
          const isSelected = isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);

          return (
            <div
              key={index}
              onClick={() => handleDateClick(date)}
              className={`min-h-[120px] p-2 border-r border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
              } ${isSelected ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium ${
                    isTodayDate
                      ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                      : isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: event.color + '20', color: event.color }}
                  >
                    {event.startTime && (
                      <span className="font-medium">{event.startTime} </span>
                    )}
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 font-medium">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}