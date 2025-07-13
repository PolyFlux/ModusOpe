import React, { useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext'; // Tuodaan useApp
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import Calendar from './components/Calendar/Calendar';
import ProjectList from './components/Projects/ProjectList';
import CourseList from './components/Courses/CourseList';
import TaskList from './components/Tasks/TaskList';
import EventModal from './components/Modals/EventModal';
import ProjectModal from './components/Modals/ProjectModal';
import CourseModal from './components/Modals/CourseModal';
import ScheduleTemplateModal from './components/Modals/ScheduleTemplateModal';
import RecurringClassModal from './components/Modals/RecurringClassModal';
import TaskModal from './components/Modals/TaskModal';
import { Menu } from 'lucide-react'; // Tuodaan Menu-ikoni

// UUSI SISÄINEN KOMPONENTTI
function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { state, dispatch } = useApp();
  const { isMobileMenuOpen } = state;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'calendar': return <Calendar />;
      case 'courses': return <CourseList />;
      case 'projects': return <ProjectList />;
      case 'tasks': return <TaskList />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex flex-col flex-1">
        {/* Yläpalkki hampurilaispainikkeelle mobiilissa */}
        <header className="md:hidden p-4 bg-white shadow-md flex items-center">
          <button onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold ml-4">OpettajaHub</h1>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Taustan peittokuva mobiilivalikolle */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
        />
      )}

      {/* Modaali-ikkunat pysyvät ennallaan */}
      <EventModal />
      <ProjectModal />
      <CourseModal />
      <ScheduleTemplateModal />
      <RecurringClassModal />
      <TaskModal />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
