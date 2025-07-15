import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Project, Task, KanbanColumn } from '../../types';
import { BookOpen, ClipboardCheck, Info, AlertCircle, Calendar, ChevronDown, Plus } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';


// TaskCard-komponentti (pysyy ennallaan)
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
      className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-3 cursor-grab active:cursor-grabbing"
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

// UUSI KOMPONENTTI uuden sarakkeen lisäämistä varten
const AddColumn = ({ projectId }: { projectId: string }) => {
    const { dispatch } = useApp();
    const [isEditing, setIsEditing] = useState(false);
    const
}
