import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatDate, isSameDay } from '../../utils/dateUtils';
import { Event } from '../../types';

export default function DayView() {
  const { state, dispatch } = useApp();
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
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">
          {formatDate(selectedDate)}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Day timeline */}
      <div className="max-h-[600px] overflow-y-auto">
        <div className="flex">
          {/* Time column */}
          <div className="w-20 py-2">
            {timeSlots.filter((_, i) => i >= 6 && i <= 22).map((time) => (
              <div key={time} className="h-12 text-xs text-gray-500 pr-2 text-right flex items-start">
                {time}
              </div>
            ))}
          </div>

          {/* Events column */}
          <div className="flex-1 border-l border-gray-200 relative">
            {/* Hour lines */}
            {timeSlots.filter((_, i) => i >= 6 && i <= 22).map((time, timeIndex) => (
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
              
              // Calculate position (6 AM = 0, so subtract 6 from hour)
              const top = ((startHour - 6) * 48) + (startMinute * 48 / 60);
              
              // Calculate height (default to 1 hour if no end time)
              let height = 48; // 1 hour default
              if (event.endTime) {
                const [endHour, endMinute] = event.endTime.split(':').map(Number);
                const [startHourTime, startMinuteTime] = event.startTime?.split(':').map(Number) || [startHour, startMinute];
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
              <div className="flex items-center justify-center h-64 text-gray-500">
                No events scheduled for this day
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}