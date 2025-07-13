import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Project, Task } from '../../types';
import { BookOpen, ClipboardCheck, Info, AlertCircle, Calendar, ChevronDown } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

const kanbanColumns: { id: Task['status']; title: string }[] = [
  { id: 'todo', title: 'Suunnitteilla' },
  { id: 'inProgress', title: 'Työn alla' },
  { id: 'done', title: 'Valmis' },
];

const TaskCard = ({ task }: { task: Task }) => {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <AlertCircle className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', task.id);
        e.currentTarget.classList.add('opacity-50');
      }}
      onDragEnd={(e) => e.currentTarget.classList.remove('opacity-50')}
      className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-3 cursor-grab active:cursor-grabbing w-72 md:w-full flex-shrink-0"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-800 text-sm">{task.title}</h4>
        {getPriorityIcon(task.priority)}
      </div>
      {task.description && <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>}
      {task.dueDate && (
        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="w-3 h-3 mr-1.5" />
          <span>{formatDate(new Date(task.dueDate))}</span>
        </div>
      )}
    </div>
  );
};

export default function KanbanView() {
  const { state, dispatch } = useApp();
  const { projects, selectedKanbanProjectId } = state;
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  const courses = projects.filter(p => p.type === 'course');
  const otherProjects = projects.filter(p => p.type !== 'course');

  useEffect(() => {
    if (!selectedKanbanProjectId && projects.length > 0) {
      dispatch({ type: 'SET_KANBAN_PROJECT', payload: projects[0].id });
    }
  }, [projects, selectedKanbanProjectId, dispatch]);

  const selectedProject = projects.find(p => p.id === selectedKanbanProjectId);

  const handleSelectProject = (projectId: string) => {
    dispatch({ type: 'SET_KANBAN_PROJECT', payload: projectId });
  };
  
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

  const getTasksForColumn = (columnId: Task['status']) => {
    return selectedProject?.tasks.filter(t => t.status === columnId) || [];
  };

  const handleDrop = (e: React.DragEvent, columnId: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId && selectedKanbanProjectId) {
      dispatch({
        type: 'UPDATE_TASK_STATUS',
        payload: {
          projectId: selectedKanbanProjectId,
          taskId,
          newStatus: columnId,
        },
      });
    }
    setDraggedOverColumn(null);
  };

  return (
    // MUUTOS: Asettelu muuttuu pystyyn mobiilissa
    <div className="flex flex-col md:flex-row h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Sivupalkki näkyy vain leveillä näytöillä */}
      <aside className="hidden md:block w-1/4 min-w-[250px] bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-800">Työtilat</h2>
        {renderProjectList('Kurssit', courses, <BookOpen className="w-4 h-4" />)}
        {renderProjectList('Projektit', otherProjects, <ClipboardCheck className="w-4 h-4" />)}
      </aside>

      <main className="flex-1 p-4 md:p-6 flex flex-col">
        {selectedProject ? (
          <>
            {/* Yläpalkki (muokattu mobiilia varten) */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
              {/* Pudotusvalikko mobiilissa */}
              <div className="md:hidden relative">
                <select
                  value={selectedKanbanProjectId || ''}
                  onChange={(e) => handleSelectProject(e.target.value)}
                  className="appearance-none font-bold text-lg bg-transparent border-none p-1 pr-6 -ml-1"
                >
                  <optgroup label="Kurssit">
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                  <optgroup label="Projektit">
                    {otherProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </optgroup>
                </select>
                <ChevronDown className="w-5 h-5 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Normaali otsikko leveillä näytöillä */}
              <h1 className="hidden md:block text-2xl font-bold text-gray-900">{selectedProject.name}</h1>
              
              <button className="flex items-center text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md">
                <Info className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Tiedot</span>
              </button>
            </div>

            {/* Kanban-sarakkeet */}
            <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
              {kanbanColumns.map(column => (
                <div
                  key={column.id}
                  onDrop={(e) => handleDrop(e, column.id)}
                  onDragOver={(e) => { e.preventDefault(); setDraggedOverColumn(column.id); }}
                  onDragLeave={() => setDraggedOverColumn(null)}
                  className={`bg-gray-50 rounded-lg p-3 flex flex-col flex-shrink-0 w-80 md:w-full transition-colors ${
                    draggedOverColumn === column.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <h3 className="font-semibold text-gray-800 mb-4 px-1">{column.title}</h3>
                  <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                    {getTasksForColumn(column.id).map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                    {getTasksForColumn(column.id).length === 0 && (
                      <div className="flex items-center justify-center h-full text-xs text-gray-400 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                        Pudota tehtäviä tähän
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Luo ensin kurssi tai projekti.</p>
          </div>
        )}
      </main>
    </div>
  );
}
