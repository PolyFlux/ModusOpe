import React, { useRef, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatDate, isSameDay, addDays } from '../../utils/dateUtils';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Event } from '../../types';
import { GENERAL_TASKS_PROJECT_ID } from '../../contexts/AppContext';

export default function DayView() {
  const { state, dispatch } = useApp();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 7 * 48;
    }
  }, [state.selectedDate, state.currentView]);

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = addDays(selectedDate, direction === 'next' ? 1 : -1);
    dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    const timezoneOffset = newDate.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(newDate.getTime() + timezoneOffset);
    dispatch({ type: 'SET_SELECTED_DATE', payload: adjustedDate });
  };
  const { selectedDate, events } = state;

  const dayEvents = events.filter(event => 
    isSameDay(new Date(event.date), selectedDate)
  );
  
  const allDayEvents = dayEvents.filter(e => !e.startTime);
  const timedEvents = dayEvents.filter(e => !!e.startTime);


  const handleEventClick = (event: Event) => {
    if (event.type === 'deadline' && event.projectId) {
      if (event.projectId === GENERAL_TASKS_PROJECT_ID) {
          return;
      }
      dispatch({ type: 'TOGGLE_PROJECT_MODAL', payload: event.projectId });
    } else {
      dispatch({ type: 'TOGGLE_EVENT_MODAL', payload: event });
    }
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          <button onClick={() => navigateDay('prev')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-semibold text-gray-900">
            {formatDate(selectedDate)}
          </h3>
          <button onClick={() => navigateDay('next')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
          <label className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={handleDateChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </label>
        </div>
        <p className="text-sm text-gray-600">
          {dayEvents.length} tapahtuma{dayEvents.length !== 1 ? 'a' : ''}
        </p>
      </div>

      <div className="sticky top-0 bg-white z-10 border-b border-gray-200 flex-shrink-0">
         <div className="flex">
            <div className="w-20 py-1 px-2 text-xs text-gray-500 text-right flex items-center justify-end">koko pv</div>
            <div className="flex-1 p-1 border-l border-gray-200 min-h-[30px] space-y-1">
              {allDayEvents.map(event => (
                  <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: event.color + '20', color: event.color, borderLeft: `3px solid ${event.color}` }}
                  >
                      {event.title}
                  </div>
              ))}
            </div>
         </div>
      </div>


      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="flex">
          <div className="w-20 py-2">
            {timeSlots.map((time) => (
              <div key={time} className="h-12 text-xs text-gray-500 pr-2 text-right flex items-start">
                {time}
              </div>
            ))}
          </div>

          <div className="flex-1 border-l border-gray-200 relative">
            {timeSlots.map((time) => (
              <div
                key={time}
                className="h-12 border-b border-gray-100"
              />
            ))}

            {timedEvents.map((event) => {
              const eventDate = new Date(event.date);
              const startHour = eventDate.getHours();
              const startMinute = eventDate.getMinutes();
              
              const top = (startHour * 48) + (startMinute * 48 / 60);
              
              let height = 48;
              if (event.endTime && event.startTime) {
                const [endHour, endMinute] = event.endTime.split(':').map(Number);
                const [startHourTime, startMinuteTime] = event.startTime.split(':').map(Number) || [startHour, startMinute];
                const duration = (endHour - startHourTime) + ((endMinute - startMinuteTime) / 60);
                height = duration * 48;
              }

              return (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="absolute left-2 right-2 rounded-lg p-3 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    top: `${top}px`,
                    height: `${Math.max(height, 40)}px`,
                    backgroundColor: event.color + '20',
                    borderLeft: `4px solid ${event.color}`,
                    minHeight: '40px'
                  }}
                >
                  <div className="font-medium text-gray-900">
                    {event.title}
                  </div>
                  {event.startTime && (
                    <div className="text-sm text-gray-600 mt-1">
                      {event.startTime}
                      {event.endTime && ` - ${event.endTime}`}
                    </div>
                  )}
                  {event.description && (
                    <div className="text-sm text-gray-600 mt-1">
                      {event.description}
                    </div>
                  )}
                </div>
              );
            })}

            {timedEvents.length === 0 && allDayEvents.length === 0 && (
              <div className="flex items-center justify-center h-full absolute inset-0 text-gray-500">
                Ei tapahtumia tälle päivälle
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
