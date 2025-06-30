import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatDate, isToday, isSameDay, addDays } from '../../utils/dateUtils';
import { Event } from '../../types';
import { Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';

export default function WeekView() {
  const { state, dispatch } = useApp();
  const { selectedDate, events } = state;
  
  const [showWeekend, setShowWeekend] = useState(false);

  // Get the Monday of the current week
  const getMondayOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  const monday = getMondayOfWeek(selectedDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });

  const weekDays = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];

  // Filter dates and days based on weekend visibility
  const displayDates = showWeekend ? weekDates : weekDates.slice(0, 5); // Mon-Fri only
  const displayDays = showWeekend ? weekDays : weekDays.slice(0, 5);

  const getEventsForDay = (date: Date): Event[] => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  const handleEventClick = (event: Event) => {
    dispatch({ type: 'TOGGLE_EVENT_MODAL', payload: event });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = addDays(selectedDate, direction === 'next' ? 7 : -7);
    dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });
  };

  const goToThisWeek = () => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: new Date() });
  };

  const getWeekRange = () => {
    const startDate = displayDates[0];
    const endDate = displayDates[displayDates.length - 1];
    
    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startDate.getDate()}. - ${endDate.getDate()}. ${startDate.toLocaleDateString('fi-FI', { month: 'long', year: 'numeric' })}`;
    } else {
      return `${startDate.toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' })}. - ${endDate.toLocaleDateString('fi-FI', { day: 'numeric', month: 'short', year: 'numeric' })}.`;
    }
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const gridColumns = `60px repeat(${displayDates.length}, 1fr)`;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Week navigation and controls */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 min-w-[280px] text-center">
              {getWeekRange()}
            </h3>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={goToThisWeek}
            className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Tämä viikko
          </button>
        </div>

        <button
          onClick={() => setShowWeekend(!showWeekend)}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {showWeekend ? (
            <>
              <EyeOff className="w-4 h-4" />
              <span>Piilota viikonloppu</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              <span>Näytä viikonloppu</span>
            </>
          )}
        </button>
      </div>

      {/* Combined header and content grid */}
      <div className="max-h-[600px] overflow-y-auto">
        <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: gridColumns }}>
          {/* Header row */}
          <div className="py-4 px-2 text-center"></div>
          {displayDates.map((date, index) => (
            <div key={`header-${index}`} className="py-4 px-2 text-center border-l border-gray-200">
              <div className="text-sm font-medium text-gray-600">
                {displayDays[index]}
              </div>
              <div
                className={`text-lg font-semibold mt-1 ${
                  isToday(date)
                    ? 'bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto'
                    : 'text-gray-900'
                }`}
              >
                {date.getDate()}.
              </div>
            </div>
          ))}
        </div>

        {/* Time slots and day columns */}
        {timeSlots.filter((_, i) => i >= 6 && i <= 22).map((time, timeIndex) => (
          <div key={time} className="grid h-12" style={{ gridTemplateColumns: gridColumns }}>
            {/* Time column */}
            <div className="py-0 px-2 text-xs text-gray-500 text-right flex items-start">
              {time}
            </div>
            
            {/* Day columns */}
            {displayDates.map((date, dateIndex) => {
              const dayEvents = getEventsForDay(date);
              
              return (
                <div key={`${time}-${dateIndex}`} className="border-l border-gray-200 border-b border-gray-100 relative">
                  {/* Events for this time slot */}
                  {dayEvents.map((event) => {
                    const eventDate = new Date(event.date);
                    const startHour = eventDate.getHours();
                    const startMinute = eventDate.getMinutes();
                    
                    // Only show event if it starts in this hour
                    if (startHour !== timeIndex + 6) return null;
                    
                    // Calculate height (default to 1 hour if no end time)
                    let height = 48; // 1 hour default
                    if (event.endTime) {
                      const [endHour, endMinute] = event.endTime.split(':').map(Number);
                      const [startHourTime, startMinuteTime] = event.startTime?.split(':').map(Number) || [startHour, startMinute];
                      const duration = (endHour - startHourTime) + ((endMinute - startMinuteTime) / 60);
                      height = duration * 48;
                    }

                    // Calculate top position within the hour
                    const topOffset = (startMinute / 60) * 48;

                    return (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="absolute left-1 right-1 rounded p-1 cursor-pointer hover:opacity-80 transition-opacity text-xs z-10"
                        style={{
                          top: `${topOffset}px`,
                          height: `${Math.max(height, 20)}px`,
                          backgroundColor: event.color + '20',
                          borderLeft: `3px solid ${event.color}`,
                          minHeight: '20px'
                        }}
                      >
                        <div className="font-medium text-gray-900 truncate">
                          {event.title}
                        </div>
                        {event.startTime && (
                          <div className="text-gray-600 text-xs">
                            {event.startTime}
                            {event.endTime && ` - ${event.endTime}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}