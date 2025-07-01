import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Type, FileText, Palette, Users, CalendarRange, File, Upload, ExternalLink, Trash2, Download, FolderOpen } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Event } from '../../types';
import GoogleDriveBrowser from '../GoogleDrive/GoogleDriveBrowser';

export default function EventModal() {
  const { state, dispatch } = useApp();
  const { showEventModal, selectedEvent, projects, events } = state;

  const [activeTab, setActiveTab] = useState<'details' | 'files'>('details');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    type: 'class' as Event['type'],
    projectId: '',
    color: '#3B82F6'
  });

  // File management state
  const [files, setFiles] = useState<Array<{
    id: string;
    name: string;
    type: 'upload' | 'google-drive';
    url?: string;
    size?: number;
    uploadDate: Date;
  }>>([]);
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  const [showGoogleDriveBrowser, setShowGoogleDriveBrowser] = useState(false);

  // Bulk edit options
  const [bulkEditOptions, setBulkEditOptions] = useState({
    applyToAll: false,
    startDate: '',
    endDate: ''
  });

  const colorOptions = [
    { name: 'Sininen', value: '#3B82F6' },
    { name: 'Violetti', value: '#8B5CF6' },
    { name: 'Vihreä', value: '#10B981' },
    { name: 'Keltainen', value: '#F59E0B' },
    { name: 'Punainen', value: '#EF4444' },
    { name: 'Pinkki', value: '#EC4899' },
    { name: 'Turkoosi', value: '#06B6D4' },
    { name: 'Oranssi', value: '#F97316' },
    { name: 'Harmaa', value: '#6B7280' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Lime', value: '#84CC16' },
    { name: 'Ruskea', value: '#A3A3A3' }
  ];

  // Check if this is a recurring event
  const isRecurringEvent = selectedEvent?.scheduleTemplateId && selectedEvent.id.startsWith('recurring-');
  
  // Find similar events using groupName
  const similarEvents = React.useMemo(() => {
    if (!selectedEvent || !isRecurringEvent || !selectedEvent.groupName) return [];
    
    return events.filter(event => 
      event.id !== selectedEvent.id &&
      event.title === selectedEvent.title &&
      event.groupName === selectedEvent.groupName &&
      event.id.startsWith('recurring-')
    );
  }, [selectedEvent, events, isRecurringEvent]);

  useEffect(() => {
    if (selectedEvent) {
      const eventDate = new Date(selectedEvent.date);
      setFormData({
        title: selectedEvent.title,
        description: selectedEvent.description || '',
        date: eventDate.toISOString().split('T')[0],
        startTime: selectedEvent.startTime || '',
        endTime: selectedEvent.endTime || '',
        type: selectedEvent.type,
        projectId: selectedEvent.projectId || '',
        color: selectedEvent.color
      });

      // Load existing files (in real app, this would come from the event data)
      setFiles(selectedEvent.files || []);

      // Set default date range for bulk edit
      if (isRecurringEvent && similarEvents.length > 0) {
        const allDates = [selectedEvent, ...similarEvents].map(e => new Date(e.date));
        const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
        
        setBulkEditOptions({
          applyToAll: false,
          startDate: minDate.toISOString().split('T')[0],
          endDate: maxDate.toISOString().split('T')[0]
        });
      }
    } else {
      setFormData({
        title: '',
        description: '',
        date: state.selectedDate.toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        type: 'class',
        projectId: '',
        color: '#3B82F6'
      });
      setFiles([]);
      setBulkEditOptions({
        applyToAll: false,
        startDate: '',
        endDate: ''
      });
    }
    setActiveTab('details');
    setGoogleDriveUrl('');
    setShowGoogleDriveBrowser(false);
  }, [selectedEvent, state.selectedDate, isRecurringEvent, similarEvents]);

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
    
    // Extract filename from URL or use a default name
    let fileName = 'Google Drive -tiedosto';
    try {
      const url = new URL(googleDriveUrl);
      const pathParts = url.pathname.split('/');
      const fileId = pathParts[pathParts.indexOf('d') + 1] || pathParts[pathParts.length - 1];
      fileName = `Google Drive -tiedosto (${fileId.substring(0, 8)}...)`;
    } catch (e) {
      // Use default name if URL parsing fails
    }

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
    
    const eventDate = new Date(formData.date);
    if (formData.startTime) {
      const [hours, minutes] = formData.startTime.split(':');
      eventDate.setHours(parseInt(hours), parseInt(minutes));
    }

    const eventData: Event = {
      id: selectedEvent?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      date: eventDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      type: formData.type,
      color: formData.color,
      projectId: formData.projectId || undefined,
      scheduleTemplateId: selectedEvent?.scheduleTemplateId,
      groupName: selectedEvent?.groupName,
      files: files // Add files to event data
    };

    if (selectedEvent) {
      dispatch({ type: 'UPDATE_EVENT', payload: eventData });

      if (bulkEditOptions.applyToAll && isRecurringEvent && similarEvents.length > 0) {
        const startDate = new Date(bulkEditOptions.startDate);
        const endDate = new Date(bulkEditOptions.endDate);

        similarEvents.forEach(event => {
          const eventDate = new Date(event.date);
          if (eventDate >= startDate && eventDate <= endDate) {
            const updatedEvent: Event = {
              ...event,
              title: formData.title,
              description: formData.description,
              type: formData.type,
              color: formData.color,
              projectId: formData.projectId || undefined,
              files: files // Apply files to all similar events
            };
            dispatch({ type: 'UPDATE_EVENT', payload: updatedEvent });
          }
        });
      }
    } else {
      dispatch({ type: 'ADD_EVENT', payload: eventData });
    }

    dispatch({ type: 'CLOSE_MODALS' });
  };

  const handleDelete = () => {
    if (selectedEvent) {
      dispatch({ type: 'DELETE_EVENT', payload: selectedEvent.id });

      if (bulkEditOptions.applyToAll && isRecurringEvent && similarEvents.length > 0) {
        const startDate = new Date(bulkEditOptions.startDate);
        const endDate = new Date(bulkEditOptions.endDate);

        similarEvents.forEach(event => {
          const eventDate = new Date(event.date);
          if (eventDate >= startDate && eventDate <= endDate) {
            dispatch({ type: 'DELETE_EVENT', payload: event.id });
          }
        });
      }

      dispatch({ type: 'CLOSE_MODALS' });
    }
  };

  const getEventsInDateRange = () => {
    if (!bulkEditOptions.startDate || !bulkEditOptions.endDate || !isRecurringEvent) return 0;
    
    const startDate = new Date(bulkEditOptions.startDate);
    const endDate = new Date(bulkEditOptions.endDate);
    
    return similarEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startDate && eventDate <= endDate;
    }).length + 1;
  };

  if (!showEventModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedEvent ? 'Muokkaa tapahtumaa' : 'Luo tapahtuma'}
          </h2>
          <button
            onClick={() => dispatch({ type: 'CLOSE_MODALS' })}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
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
            Perustiedot
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  placeholder="Tapahtuman otsikko"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Tapahtuman kuvaus"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Päivämäärä
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Alkuaika
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loppuaika
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tyyppi
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Event['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="class">Tunti</option>
                  <option value="meeting">Kokous</option>
                  <option value="deadline">Määräaika</option>
                  <option value="assignment">Tehtävä</option>
                  <option value="personal">Henkilökohtainen</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="w-4 h-4 inline mr-2" />
                  Väri
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        formData.color === color.value 
                          ? 'border-gray-800 ring-2 ring-gray-300' 
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: formData.color }}
                  />
                  <span className="text-sm text-gray-600">
                    Valittu väri: {colorOptions.find(c => c.value === formData.color)?.name || 'Mukautettu'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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

              {/* Bulk Edit Options for Recurring Events */}
              {isRecurringEvent && similarEvents.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Joukkomuokkaus
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="applyToAll"
                        checked={bulkEditOptions.applyToAll}
                        onChange={(e) => setBulkEditOptions({ 
                          ...bulkEditOptions, 
                          applyToAll: e.target.checked 
                        })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="applyToAll" className="text-sm text-blue-800">
                        Sovella kaikkiin samannimisiin oppitunteihin
                      </label>
                    </div>

                    {bulkEditOptions.applyToAll && (
                      <div className="space-y-3">
                        <div className="text-xs text-blue-700">
                          Löytyi {similarEvents.length} samannimiistä oppituntia (kaikki viikonpäivät)
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-blue-800 mb-1">
                            <CalendarRange className="w-3 h-3 inline mr-1" />
                            Aikaväli (vain tämän välin oppitunnit muokataan)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={bulkEditOptions.startDate}
                              onChange={(e) => setBulkEditOptions({ 
                                ...bulkEditOptions, 
                                startDate: e.target.value 
                              })}
                              className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            />
                            <input
                              type="date"
                              value={bulkEditOptions.endDate}
                              onChange={(e) => setBulkEditOptions({ 
                                ...bulkEditOptions, 
                                endDate: e.target.value 
                              })}
                              className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          {bulkEditOptions.startDate && bulkEditOptions.endDate && (
                            <div className="text-xs text-blue-700 mt-1">
                              Muokataan {getEventsInDateRange()} oppituntia
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          ) : (
            <div className="p-6 space-y-6">
              {/* File Upload Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Liitetiedostot</h3>
                
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Vedä tiedostoja tähän tai klikkaa valitaksesi
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Valitse tiedostoja
                  </label>
                </div>
              </div>

              {/* Google Drive Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Google Drive</h3>
                
                {/* Google Drive Browser Button */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setShowGoogleDriveBrowser(true)}
                    className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FolderOpen className="w-5 h-5 mr-2" />
                    Selaa Google Drive -tiedostoja
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Kirjaudu Google-tilillesi ja selaa tiedostojasi suoraan
                  </p>
                </div>

                {/* Manual URL Input */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Tai liitä linkki manuaalisesti:</h4>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={googleDriveUrl}
                      onChange={(e) => setGoogleDriveUrl(e.target.value)}
                      placeholder="Liitä Google Drive -tiedoston linkki..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleGoogleDriveAdd}
                      disabled={!googleDriveUrl.trim()}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Varmista, että linkki on julkinen tai jaettu asianmukaisesti
                  </p>
                </div>
              </div>

              {/* Files List */}
              {files.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Liitetyt tiedostot</h3>
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center space-x-3">
                          {file.type === 'google-drive' ? (
                            <ExternalLink className="w-5 h-5 text-green-600" />
                          ) : (
                            <File className="w-5 h-5 text-blue-600" />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{file.name}</div>
                            <div className="text-sm text-gray-500">
                              {file.type === 'google-drive' ? 'Google Drive' : 
                               file.size ? formatFileSize(file.size) : 'Tiedosto'} • 
                              {file.uploadDate.toLocaleDateString('fi-FI')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {file.type === 'google-drive' && file.url && (
                            <button
                              type="button"
                              onClick={() => window.open(file.url, '_blank')}
                              className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                              title="Avaa Google Drivessa"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                          {file.type === 'upload' && (
                            <button
                              type="button"
                              className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                              title="Lataa tiedosto"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleFileDelete(file.id)}
                            className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                            title="Poista tiedosto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {files.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <File className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Ei liitettyjä tiedostoja</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200 flex-shrink-0 bg-gray-50">
          {selectedEvent && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              {bulkEditOptions.applyToAll && isRecurringEvent ? 
                `Poista ${getEventsInDateRange()} oppituntia` : 
                'Poista'
              }
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
              type="submit"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {selectedEvent ? 
                (bulkEditOptions.applyToAll && isRecurringEvent ? 
                  `Päivitä ${getEventsInDateRange()} oppituntia` : 
                  'Päivitä'
                ) : 
                'Luo'
              }
            </button>
          </div>
        </div>
      </div>

      {/* Google Drive Browser Modal */}
      {showGoogleDriveBrowser && (
        <GoogleDriveBrowser
          onFilesSelected={handleGoogleDriveFilesSelected}
          onClose={() => setShowGoogleDriveBrowser(false)}
        />
      )}
    </div>
  );
}
