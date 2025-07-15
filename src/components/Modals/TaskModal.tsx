import React, { useState, useEffect } from 'react';
import { X, Type, FileText, Calendar, AlertCircle, Bookmark, Plus, Trash2, File, Upload, ExternalLink, Download, FolderOpen } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Task, Subtask } from '../../types';
import { nanoid } from 'nanoid';
import GoogleDriveBrowser from '../GoogleDrive/GoogleDriveBrowser';


export default function TaskModal() {
  const { state, dispatch } = useApp();
  const { showTaskModal, selectedTask, projects } = state;

  const [activeTab, setActiveTab] = useState<'details' | 'files'>('details');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    dueDate: '',
    projectId: '',
    subtasks: [] as Subtask[],
  });
  
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  const [showGoogleDriveBrowser, setShowGoogleDriveBrowser] = useState(false);


  useEffect(() => {
    if (selectedTask) {
      setFormData({
        title: selectedTask.title,
        description: selectedTask.description || '',
        priority: selectedTask.priority,
        dueDate: selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : '',
        projectId: selectedTask.projectId,
        subtasks: selectedTask.subtasks || [],
      });
      setFiles(selectedTask.files || []);
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        projectId: '',
        subtasks: [],
      });
      setFiles([]);
    }
    setActiveTab('details');
  }, [selectedTask, showTaskModal]);

  const handleSubtaskChange = (subtaskId: string, completed: boolean) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed } : st
      ),
    }));
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim() === '') return;
    const newSubtask: Subtask = {
      id: nanoid(),
      title: newSubtaskTitle,
      completed: false,
    };
    setFormData(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, newSubtask],
    }));
    setNewSubtaskTitle('');
  };
  
  const handleDeleteSubtask = (subtaskId: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(st => st.id !== subtaskId),
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    const newFiles = uploadedFiles.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: 'upload' as const,
      size: file.size,
      uploadDate: new Date()
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleGoogleDriveAdd = () => {
    if (!googleDriveUrl.trim()) return;
    let fileName = 'Google Drive -tiedosto';
    try {
      const url = new URL(googleDriveUrl);
      const pathParts = url.pathname.split('/');
      const fileId = pathParts[pathParts.indexOf('d') + 1] || pathParts[pathParts.length - 1];
      fileName = `Google Drive -tiedosto (${fileId.substring(0, 8)}...)`;
    } catch (e) {}

    const newFile = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: fileName,
      type: 'google-drive' as const,
      url: googleDriveUrl,
      uploadDate: new Date()
    };
    setFiles(prev => [...prev, newFile]);
    setGoogleDriveUrl('');
  };

  const handleGoogleDriveFilesSelected = (selectedFiles: any[]) => {
    const newFiles = selectedFiles.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: 'google-drive' as const,
      url: file.webViewLink || file.webContentLink,
      size: file.size ? parseInt(file.size) : undefined,
      uploadDate: new Date()
    }));
    setFiles(prev => [...prev, ...newFiles]);
    setShowGoogleDriveBrowser(false);
  };

  const handleFileDelete = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const taskData: Task = {
      id: selectedTask?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      completed: selectedTask?.completed || false,
      columnId: selectedTask?.columnId || 'todo',
      priority: formData.priority,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      projectId: formData.projectId,
      subtasks: formData.subtasks,
      files: files
    };

    if (selectedTask) {
      dispatch({ type: 'UPDATE_TASK', payload: { projectId: taskData.projectId, task: taskData } });
    } else {
      dispatch({ type: 'ADD_TASK', payload: { projectId: taskData.projectId, task: taskData } });
    }

    dispatch({ type: 'CLOSE_MODALS' });
  };
  
  const handleDelete = () => {
    if (selectedTask) {
      dispatch({ type: 'DELETE_TASK', payload: { projectId: selectedTask.projectId, taskId: selectedTask.id } });
      dispatch({ type: 'CLOSE_MODALS' });
    }
  };

  if (!showTaskModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedTask ? 'Muokkaa tehtävää' : 'Luo uusi tehtävä'}
          </h2>
          <button
            onClick={() => dispatch({ type: 'CLOSE_MODALS' })}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Type className="w-4 h-4 inline mr-2" />
            Tiedot & Alitehtävät
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'files'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <File className="w-4 h-4 inline mr-2" />
            Tiedostot ({files.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' ? (
            <form id="task-form-details" onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Sisältö pysyy samana kuin aiemmin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Bookmark className="w-4 h-4 inline mr-2" />
                  Projekti (valinnainen)
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Ei projektia</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Type className="w-4 h-4 inline mr-2" />
                  Otsikko
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tehtävän otsikko"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Kuvaus
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Tehtävän kuvaus"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    Prioriteetti
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Matala</option>
                    <option value="medium">Keskitaso</option>
                    <option value="high">Korkea</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Määräpäivä
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Alitehtävät</h4>
                <div className="space-y-2">
                  {formData.subtasks.map(subtask => (
                    <div key={subtask.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={e => handleSubtaskChange(subtask.id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-500' : ''}`}>
                        {subtask.title}
                      </span>
                      <button type="button" onClick={() => handleDeleteSubtask(subtask.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    placeholder="Uusi alitehtävä"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="p-6 space-y-6">
              {/* Tiedostojen latausosio */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Vedä tiedostoja tai klikkaa valitaksesi</p>
                  <input type="file" multiple onChange={handleFileUpload} className="hidden" id="file-upload-task"/>
                  <label htmlFor="file-upload-task" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" /> Valitse tiedostoja
                  </label>
              </div>

              {/* Google Drive -osio */}
              <div>
                  <button type="button" onClick={() => setShowGoogleDriveBrowser(true)} className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg">
                      <FolderOpen className="w-5 h-5 mr-2" /> Selaa Google Drivea
                  </button>
                  <div className="flex items-center space-x-2 mt-2">
                      <input type="url" value={googleDriveUrl} onChange={(e) => setGoogleDriveUrl(e.target.value)} placeholder="Liitä Google Drive -linkki..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"/>
                      <button type="button" onClick={handleGoogleDriveAdd} disabled={!googleDriveUrl.trim()} className="px-4 py-2 bg-green-600 text-white rounded-lg"><ExternalLink className="w-4 h-4" /></button>
                  </div>
              </div>

              {/* Liitetyt tiedostot */}
              {files.length > 0 && (
                  <div className="space-y-2">
                      {files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                  {file.type === 'google-drive' ? <ExternalLink className="w-5 h-5 text-green-600" /> : <File className="w-5 h-5 text-blue-600" />}
                                  <div>
                                      <div className="font-medium">{file.name}</div>
                                      <div className="text-sm text-gray-500">
                                          {file.type === 'google-drive' ? 'Google Drive' : file.size ? formatFileSize(file.size) : 'Tiedosto'} • {file.uploadDate.toLocaleDateString('fi-FI')}
                                      </div>
                                  </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                  {file.type === 'google-drive' && file.url && <button type="button" onClick={() => window.open(file.url, '_blank')} className="p-2 text-gray-500"><ExternalLink className="w-4 h-4" /></button>}
                                  {file.type === 'upload' && <button type="button" className="p-2 text-gray-500"><Download className="w-4 h-4" /></button>}
                                  <button type="button" onClick={() => handleFileDelete(file.id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between p-6 border-t border-gray-200 flex-shrink-0">
            {selectedTask && (
                <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    Poista tehtävä
                </button>
            )}
            <div className="flex space-x-3 ml-auto">
                <button
                    type="button"
                    onClick={() => dispatch({ type: 'CLOSE_MODALS' })}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Peruuta
                </button>
                <button
                    type="button" // Muutettu, jotta formin voi lähettää vain details-välilehdeltä
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {selectedTask ? 'Päivitä tehtävä' : 'Luo tehtävä'}
                </button>
            </div>
        </div>

        {showGoogleDriveBrowser && (
          <GoogleDriveBrowser
            onFilesSelected={handleGoogleDriveFilesSelected}
            onClose={() => setShowGoogleDriveBrowser(false)}
          />
        )}
      </div>
    </div>
  );
}
