import React, { useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Project } from '../../types';
import { BookOpen, ClipboardCheck, Info } from 'lucide-react';

export default function KanbanView() {
  const { state, dispatch } = useApp();
  const { projects, selectedKanbanProjectId } = state;

  // Erotellaan kurssit ja projektit omiksi listoikseen
  const courses = projects.filter(p => p.type === 'course');
  const otherProjects = projects.filter(p => p.type !== 'course');

  // Asetetaan oletusprojekti, kun komponentti ladataan ensimmäistä kertaa
  useEffect(() => {
    if (!selectedKanbanProjectId && projects.length > 0) {
      dispatch({ type: 'SET_KANBAN_PROJECT', payload: projects[0].id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, selectedKanbanProjectId]);

  const selectedProject = projects.find(p => p.id === selectedKanbanProjectId);

  const handleSelectProject = (projectId: string) => {
    dispatch({ type: 'SET_KANBAN_PROJECT', payload: projectId });
  };
  
  // Apukomponentti listan renderöintiin
  const renderProjectList = (title: string, items: Project[], icon: React.ReactNode) => (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase px-4 mt-6 mb-2 flex items-center">
        {icon}
        <span className="ml-2">{title}</span>
      </h3>
      <ul className="space-y-1">
        {items.map(item => (
          <li key={item.id}>
            <button
              onClick={() => handleSelectProject(item.id)}
              className={`w-full text-left px-4 py-2 text-sm rounded-md transition-colors flex items-center ${
                selectedKanbanProjectId === item.id
                  ? 'bg-blue-100 text-blue-800 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: item.color }}></span>
              {item.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="flex h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Vasen lista kursseille ja projekteille */}
      <aside className="w-1/4 min-w-[250px] bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-800">Työtilat</h2>
        {renderProjectList('Kurssit', courses, <BookOpen className="w-4 h-4" />)}
        {renderProjectList('Projektit', otherProjects, <ClipboardCheck className="w-4 h-4" />)}
      </aside>

      {/* Päänäkymä Kanban-taululle */}
      <main className="flex-1 p-6 flex flex-col">
        {selectedProject ? (
          <>
            {/* Yläpalkki */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h1>
              <button className="flex items-center text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md">
                <Info className="w-4 h-4 mr-2" />
                Tiedot
              </button>
            </div>

            {/* Itse Kanban-taulun paikka */}
            <div className="flex-1 text-center text-gray-500">
              <p>Kanban-sarakkeet tulevat tähän...</p>
              {/* Tähän lisätään myöhemmin sarakkeet ja kortit */}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Valitse kurssi tai projekti aloittaaksesi.</p>
          </div>
        )}
      </main>
    </div>
  );
}
