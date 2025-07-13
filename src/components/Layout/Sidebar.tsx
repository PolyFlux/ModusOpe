import React from 'react';
import { Calendar, BookOpen, CheckSquare, ClipboardCheck, Home, ChevronLeft } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { state, dispatch } = useApp();
  const { isSidebarCollapsed } = state;

  const menuItems = [
    { id: 'dashboard', label: 'Kojelauta', icon: Home },
    { id: 'calendar', label: 'Kalenteri', icon: Calendar },
    { id: 'courses', label: 'Kurssit', icon: BookOpen },
    { id: 'projects', label: 'Projektit', icon: ClipboardCheck },
    { id: 'tasks', label: 'Tehtävät', icon: CheckSquare }
  ];

  return (
    <div className={`bg-white shadow-lg h-full flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        {/* Piilotetaan teksti, kun palkki on kutistettu */}
        {!isSidebarCollapsed && (
          <div>
            <h1 className="text-xl font-bold text-gray-800">OpettajaHub</h1>
            <p className="text-sm text-gray-600 mt-1">Kalenteri & Projektit</p>
          </div>
        )}

        {/* UUSI KUTISTAMISPAINIKE */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="p-1.5 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className={`transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <nav className="flex-1 p-4"> {/* Pienennetty paddingia */}
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  // MUUTETUT LUOKAT KESKITTÄMISEKSI
                  className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${isSidebarCollapsed ? 'justify-center' : ''} ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {/* Piilotetaan label, kun palkki on kutistettu */}
                  {!isSidebarCollapsed && <span className="ml-3">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Piilotetaan koko alempi painikeosio, kun palkki on kutistettu */}
      {!isSidebarCollapsed && (
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_EVENT_MODAL' })}
            className="w-full flex items-center justify-center btn-glossy mb-2"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Lisää tapahtuma
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_COURSE_MODAL' })}
            className="w-full flex items-center justify-center btn-glossy mb-2"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Lisää oppitunti
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_PROJECT_MODAL' })}
            className="w-full flex items-center justify-center btn-glossy mb-2"
          >
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Lisää projekti
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_TASK_MODAL' })}
            className="w-full flex items-center justify-center btn-glossy mb-2"
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            Lisää tehtävä
          </button>
        </div>
      )}
    </div>
  );
}
