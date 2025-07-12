import React from 'react';
import { Calendar, BookOpen, CheckSquare, ClipboardCheck, Plus, Home, Clock } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { dispatch } = useApp();

  const menuItems = [
    { id: 'dashboard', label: 'Kojelauta', icon: Home },
    { id: 'calendar', label: 'Kalenteri', icon: Calendar },
    { id: 'courses', label: 'Kurssit', icon: BookOpen },
    { id: 'projects', label: 'Projektit', icon: ClipboardCheck },
    { id: 'tasks', label: 'Tehtävät', icon: CheckSquare }
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">OpettajaHub</h1>
        <p className="text-sm text-gray-600 mt-1">Kalenteri & Projektit</p>
      </div>

      <nav className="flex-1 p-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

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
          onClick={() => dispatch({ type: 'TOGGLE_TASKS_MODAL' })}
          className="w-full flex items-center justify-center btn-glossy mb-2"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Lisää tapahtuma
        </button>
      </div>
    </div>
  );
}
