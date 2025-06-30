import { useState, useEffect, useCallback } from 'react';

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
}

interface UseGoogleDriveReturn {
  isSignedIn: boolean;
  isLoading: boolean;
  error: string | null;
  files: GoogleDriveFile[];
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  loadFiles: (folderId?: string) => Promise<void>;
  searchFiles: (query: string) => Promise<void>;
  createShareableLink: (fileId: string) => Promise<string>;
}

// Google API configuration
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

export function useGoogleDrive(): UseGoogleDriveReturn {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if we have valid environment variables
  const hasValidConfig = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    return apiKey && 
           clientId && 
           apiKey !== 'your_google_api_key_here' && 
           clientId !== 'your_google_client_id_here.apps.googleusercontent.com';
  };

  // Check if we're in WebContainer environment
  const isWebContainer = () => {
    return window.location.hostname.includes('webcontainer') || 
           window.location.hostname.includes('local-credentialless') ||
           window.location.hostname.includes('stackblitz') ||
           window.location.hostname.includes('bolt.new');
  };

  const loadDemoFiles = useCallback(() => {
    const demoFiles: GoogleDriveFile[] = [
      {
        id: 'demo-1',
        name: 'Matematiikan oppimateriaali.pdf',
        mimeType: 'application/pdf',
        size: '2048576',
        modifiedTime: new Date().toISOString(),
        webViewLink: 'https://drive.google.com/file/d/demo-1/view'
      },
      {
        id: 'demo-2',
        name: 'Oppitunnin suunnitelma.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: '1024000',
        modifiedTime: new Date(Date.now() - 86400000).toISOString(),
        webViewLink: 'https://drive.google.com/file/d/demo-2/view'
      },
      {
        id: 'demo-3',
        name: 'Kuvat',
        mimeType: 'application/vnd.google-apps.folder',
        modifiedTime: new Date(Date.now() - 172800000).toISOString(),
        webViewLink: 'https://drive.google.com/drive/folders/demo-3'
      },
      {
        id: 'demo-4',
        name: 'Esitys - Geometria.pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        size: '5242880',
        modifiedTime: new Date(Date.now() - 259200000).toISOString(),
        webViewLink: 'https://drive.google.com/file/d/demo-4/view'
      },
      {
        id: 'demo-5',
        name: 'Arviointi.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: '512000',
        modifiedTime: new Date(Date.now() - 345600000).toISOString(),
        webViewLink: 'https://drive.google.com/file/d/demo-5/view'
      },
      {
        id: 'demo-6',
        name: 'Tutkimusdata.csv',
        mimeType: 'text/csv',
        size: '256000',
        modifiedTime: new Date(Date.now() - 432000000).toISOString(),
        webViewLink: 'https://drive.google.com/file/d/demo-6/view'
      },
      {
        id: 'demo-7',
        name: 'Projektit',
        mimeType: 'application/vnd.google-apps.folder',
        modifiedTime: new Date(Date.now() - 518400000).toISOString(),
        webViewLink: 'https://drive.google.com/drive/folders/demo-7'
      },
      {
        id: 'demo-8',
        name: 'Oppilaiden työt.zip',
        mimeType: 'application/zip',
        size: '10485760',
        modifiedTime: new Date(Date.now() - 604800000).toISOString(),
        webViewLink: 'https://drive.google.com/file/d/demo-8/view'
      }
    ];
    setFiles(demoFiles);
  }, []);

  // Initialize - always use demo mode in WebContainer or without valid config
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      
      // Always use demo mode in WebContainer environment or without valid config
      if (isWebContainer() || !hasValidConfig()) {
        console.log('Using demo mode:', isWebContainer() ? 'WebContainer environment' : 'Invalid config');
        setError('Google Drive -integraatio vaatii oikeat API-tunnukset. Katso README.md -tiedostosta ohjeet.');
        loadDemoFiles();
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      // Try to initialize real Google API (this will likely not work in WebContainer)
      try {
        if (typeof window.gapi === 'undefined' || typeof window.google === 'undefined') {
          throw new Error('Google APIs not loaded');
        }

        await new Promise<void>((resolve) => {
          window.gapi.load('client', resolve);
        });

        await window.gapi.client.init({
          apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });

        console.log('Google API initialized successfully');
        setError(null);
        setIsInitialized(true);
      } catch (err) {
        console.log('Google API initialization failed, using demo mode:', err);
        setError('Google API ei ole käytettävissä. Käytetään demo-tilaa.');
        loadDemoFiles();
        setIsInitialized(true);
      }
      
      setIsLoading(false);
    };

    initialize();
  }, [loadDemoFiles]);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Always use demo mode - simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSignedIn(true);
      loadDemoFiles();
      setError(null);
      
      console.log('Demo sign-in completed');
    } catch (err) {
      console.error('Sign in error:', err);
      setError(`Kirjautuminen epäonnistui: ${err}`);
      loadDemoFiles();
      setIsSignedIn(true);
    } finally {
      setIsLoading(false);
    }
  }, [loadDemoFiles]);

  const signOut = useCallback(async () => {
    try {
      setIsSignedIn(false);
      setFiles([]);
      setError(null);
      console.log('Signed out successfully');
    } catch (err) {
      setError(`Uloskirjautuminen epäonnistui: ${err}`);
    }
  }, []);

  const loadFiles = useCallback(async (folderId?: string) => {
    if (!isSignedIn) {
      setError('Et ole kirjautunut');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Always use demo files
      if (folderId === 'demo-3') {
        // Simulate folder contents
        const folderFiles: GoogleDriveFile[] = [
          {
            id: 'demo-3-1',
            name: 'Geometria_kuva1.jpg',
            mimeType: 'image/jpeg',
            size: '1048576',
            modifiedTime: new Date(Date.now() - 86400000).toISOString(),
            webViewLink: 'https://drive.google.com/file/d/demo-3-1/view'
          },
          {
            id: 'demo-3-2',
            name: 'Algebra_kaavio.png',
            mimeType: 'image/png',
            size: '512000',
            modifiedTime: new Date(Date.now() - 172800000).toISOString(),
            webViewLink: 'https://drive.google.com/file/d/demo-3-2/view'
          }
        ];
        setFiles(folderFiles);
      } else if (folderId === 'demo-7') {
        // Simulate project folder contents
        const projectFiles: GoogleDriveFile[] = [
          {
            id: 'demo-7-1',
            name: 'Projekti_A.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size: '2048576',
            modifiedTime: new Date(Date.now() - 259200000).toISOString(),
            webViewLink: 'https://drive.google.com/file/d/demo-7-1/view'
          },
          {
            id: 'demo-7-2',
            name: 'Projekti_B.pdf',
            mimeType: 'application/pdf',
            size: '3145728',
            modifiedTime: new Date(Date.now() - 345600000).toISOString(),
            webViewLink: 'https://drive.google.com/file/d/demo-7-2/view'
          }
        ];
        setFiles(projectFiles);
      } else {
        // Load main demo files
        loadDemoFiles();
      }

      console.log('Files loaded successfully');
    } catch (err) {
      console.error('Error loading files:', err);
      setError(`Tiedostojen lataus epäonnistui: ${err}`);
      loadDemoFiles();
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, loadDemoFiles]);

  const searchFiles = useCallback(async (query: string) => {
    if (!isSignedIn) {
      setError('Et ole kirjautunut');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 600));

      // Filter demo files based on search query
      const allDemoFiles: GoogleDriveFile[] = [
        {
          id: 'demo-1',
          name: 'Matematiikan oppimateriaali.pdf',
          mimeType: 'application/pdf',
          size: '2048576',
          modifiedTime: new Date().toISOString(),
          webViewLink: 'https://drive.google.com/file/d/demo-1/view'
        },
        {
          id: 'demo-2',
          name: 'Oppitunnin suunnitelma.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: '1024000',
          modifiedTime: new Date(Date.now() - 86400000).toISOString(),
          webViewLink: 'https://drive.google.com/file/d/demo-2/view'
        },
        {
          id: 'demo-4',
          name: 'Esitys - Geometria.pptx',
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          size: '5242880',
          modifiedTime: new Date(Date.now() - 259200000).toISOString(),
          webViewLink: 'https://drive.google.com/file/d/demo-4/view'
        },
        {
          id: 'demo-5',
          name: 'Arviointi.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size: '512000',
          modifiedTime: new Date(Date.now() - 345600000).toISOString(),
          webViewLink: 'https://drive.google.com/file/d/demo-5/view'
        },
        {
          id: 'demo-6',
          name: 'Tutkimusdata.csv',
          mimeType: 'text/csv',
          size: '256000',
          modifiedTime: new Date(Date.now() - 432000000).toISOString(),
          webViewLink: 'https://drive.google.com/file/d/demo-6/view'
        },
        {
          id: 'demo-8',
          name: 'Oppilaiden työt.zip',
          mimeType: 'application/zip',
          size: '10485760',
          modifiedTime: new Date(Date.now() - 604800000).toISOString(),
          webViewLink: 'https://drive.google.com/file/d/demo-8/view'
        }
      ];
      
      const filteredFiles = allDemoFiles.filter(file => 
        file.name.toLowerCase().includes(query.toLowerCase())
      );
      setFiles(filteredFiles);
      
      console.log(`Search completed: ${filteredFiles.length} files found`);
    } catch (err) {
      setError(`Haku epäonnistui: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn]);

  const createShareableLink = useCallback(async (fileId: string): Promise<string> => {
    if (!isSignedIn) {
      throw new Error('Et ole kirjautunut');
    }

    // Always return demo link
    return `https://drive.google.com/file/d/${fileId}/view`;
  }, [isSignedIn]);

  return {
    isSignedIn,
    isLoading,
    error,
    files,
    signIn,
    signOut,
    loadFiles,
    searchFiles,
    createShareableLink
  };
}

// Extend window object for TypeScript
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}