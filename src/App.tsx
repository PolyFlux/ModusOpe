import React, { useState } from 'react';
import { AppProvider } from './contexts/AppContext';
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

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'calendar':
        return <Calendar />;
        case 'courses':
        return <CourseList />;
      case 'projects':
        return <ProjectList />;
      case 'tasks':
        return <TaskList />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppProvider>
      <div className="flex h-screen bg-gray-100">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {renderContent()}
          </div>
        </main>
        <EventModal />
        <ProjectModal />
        <CourseModal />
        <ScheduleTemplateModal />
        <RecurringClassModal />
        <TaskModal />
      </div>
    </AppProvider>
  );
}

export default App;
