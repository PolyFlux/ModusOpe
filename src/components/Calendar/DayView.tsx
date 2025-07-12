import React, { useRef, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatDate, isSameDay, addDays } from '../../utils/dateUtils';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Event } from '../../types';

export default function DayView() {
  const { state, dispatch } = useApp();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      // Vieritetään näkymä klo 6:00 kohdalle. Yksi tunti on 48px.
      scrollContainerRef.current.scrollTop = 5 * 48;
    }
  }, [state.selectedDate]); // Vieritys suoritetaan, kun päivämäärä vaihtuu

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = addDays(selectedDate, direction === 'next' ? 1 : -1);
    dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    // Korjaa aikavyöhykkeen aiheuttama virhe
    const timezoneOffset = newDate.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(newDate.getTime() + timezoneOffset);
    dispatch({ type: 'SET_SELECTED_DATE', payload: adjustedDate });
  };
  const { selectedDate, events } = state;

  const dayEvents = events.filter(event => 
    isSameDay(new Date(event.date), selectedDate)
  );

  const handleEventClick = (event: Event) => {
    dispatch({ type: 'TOGGLE_EVENT_MODAL', payload: event });
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Day header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
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

      {/* Day timeline */}
      <div ref={scrollContainerRef} className="max-h-[600px] overflow-y-auto">
        <div className="flex">
          {/* Time column */}
          <div className="w-20 py-2">
            {timeSlots.map((time) => (
              <div key={time} className="h-12 text-xs text-gray-500 pr-2 text-right flex items-start">
                {time}
              </div>
            ))}
          </div>

          {/* Events column */}
          <div className="flex-1 border-l border-gray-200 relative">
            {/* Hour lines */}
            {timeSlots.map((time) => (
              <div
                key={time}
                className="h-12 border-b border-gray-100"
              />
            ))}

            {/* Events */}
            {dayEvents.map((event) => {
              const eventDate = new Date(event.date);
              const startHour = eventDate.getHours();
              const startMinute = eventDate.getMinutes();
              
              const top = (startHour * 48) + (startMinute * 48 / 60);
              
              let height = 48; // 1 hour default
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

            {dayEvents.length === 0 && (
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
