import React, { useState, useEffect } from 'react';
import { X, Calendar, Type, FileText, Clock, File, Upload, ExternalLink, Download, Trash2, FolderOpen } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { RecurringClass } from '../../types';
import GoogleDriveBrowser from '../GoogleDrive/GoogleDriveBrowser';

export default function RecurringClassModal() {
  const { state, dispatch } = useApp();
  const { showRecurringClassModal, selectedRecurringClass, scheduleTemplates, courseModalInfo } = state;

  const [activeTab, setActiveTab] = useState<'details' | 'files'>('details');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    templateGroupName: '',
    startDate: '',
    endDate: ''
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

  // Group templates by name - memoized to prevent unnecessary re-renders
  const templateGroups = React.useMemo(() => {
    const groups: { [key: string]: typeof scheduleTemplates } = {};
    scheduleTemplates.forEach(template => {
      if (!groups[template.name]) {
        groups[template.name] = [];
      }
      groups[template.name].push(template);
    });
    return groups;
  }, [scheduleTemplates]);

  // Memoize template group names to prevent useEffect from running unnecessarily
  const templateGroupNames = React.useMemo(() => {
    return Object.keys(templateGroups);
  }, [templateGroups]);

  useEffect(() => {
    if (selectedRecurringClass) {
      // Find the template group name for existing recurring class
      const template = scheduleTemplates.find(t => t.id === selectedRecurringClass.scheduleTemplateId);
      setFormData({
        title: selectedRecurringClass.title,
        description: selectedRecurringClass.description || '',
        templateGroupName: template?.name || '',
        startDate: selectedRecurringClass.startDate.toISOString().split('T')[0],
        endDate: selectedRecurringClass.endDate.toISOString().split('T')[0]
      });
      setFiles(selectedRecurringClass.files || []);
    } else {
      const today = new Date();
      const endOfYear = new Date(today.getFullYear(), 11, 31);
      
      setFormData({
        title: '',
        description: '',
        templateGroupName: templateGroupNames[0] || '',
        startDate: today.toISOString().split('T')[0],
        endDate: endOfYear.toISOString().split('T')[0]
      });
      setFiles([]);
    }
    setActiveTab('details');
    setGoogleDriveUrl('');
    setShowGoogleDriveBrowser(false);
  }, [selectedRecurringClass, scheduleTemplates]);

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
    
    const selectedTemplates = templateGroups[formData.templateGroupName];
    if (!selectedTemplates || selectedTemplates.length === 0) return;

    // Create recurring classes for each template in the group
    selectedTemplates.forEach((template, index) => {
      const classData: RecurringClass = {
        id: selectedRecurringClass?.id || `${Date.now()}-${index}`,
        title: formData.title,
        description: formData.description,
        scheduleTemplateId: template.id,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        color: template.color,
        groupName: formData.templateGroupName,
        projectId: courseModalInfo?.id,
        files: files
      };

      if (selectedRecurringClass && index === 0) {
        // Update existing (only for the first one if editing)
        dispatch({ type: 'UPDATE_RECURRING_CLASS', payload: classData });
      } else if (!selectedRecurringClass) {
        // Add new
        dispatch({ type: 'ADD_RECURRING_CLASS', payload: classData });
      }
    });

    dispatch({ type: 'CLOSE_MODALS' });
  };

  const getTemplateGroupInfo = (groupName: string) => {
    const templates = templateGroups[groupName];
    if (!templates || templates.length === 0) return '';
    
    const weekDays = ['Maanantai', 'Tiistai', 'Keskiviikko', 'Torstai', 'Perjantai'];
    const timeSlots = templates.map(template => 
      `${weekDays[template.dayOfWeek]} ${template.startTime}-${template.endTime}`
    );
    
    return timeSlots.join(', ');
  };

  if (!showRecurringClassModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedRecurringClass ? 'Muokkaa oppituntia' : 'Lisää oppitunti'}
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

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Type className="w-4 h-4 inline mr-2" />
                  Oppitunnin nimi
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="esim. Matematiikka 9A - Algebra"
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
                  rows={2}
                  placeholder="Oppitunnin kuvaus"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Tuntiryhmä
                </label>
                <select
                  required
                  value={formData.templateGroupName}
                  onChange={(e) => setFormData({ ...formData, templateGroupName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Valitse tuntiryhmä</option>
                  {templateGroupNames.map(groupName => (
                    <option key={groupName} value={groupName}>
                      {groupName} ({templateGroups[groupName].length} aikaa)
                    </option>
                  ))}
                </select>
                {formData.templateGroupName && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                    <strong>Ajankohdat:</strong> {getTemplateGroupInfo(formData.templateGroupName)}
                  </div>
                )}
                {templateGroupNames.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    Luo ensin tuntiryhmä kiertotuntikaavio-näkymässä
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Alkupäivä
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loppupäivä
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Huomio:</strong> Tämä luo toistuvat oppitunnit valitun ajanjakson aikana 
                  kaikkiin valitun tuntiryhmän aikoihin.
                  {formData.templateGroupName && templateGroups[formData.templateGroupName] && (
                    <span className="block mt-1">
                      Luodaan {templateGroups[formData.templateGroupName].length} oppituntia viikossa.
                    </span>
                  )}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'CLOSE_MODALS' })}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Peruuta
                </button>
                <button
                  type="submit"
                  disabled={templateGroupNames.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedRecurringClass ? 'Päivitä' : 'Luo oppitunnit'}
                </button>
              </div>
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
                    id="file-upload-recurring"
                  />
                  <label
                    htmlFor="file-upload-recurring"
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
