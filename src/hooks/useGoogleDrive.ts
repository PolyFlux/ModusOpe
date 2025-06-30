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
  const [gapi, setGapi] = useState<any>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Check if we have valid environment variables
  const hasValidConfig = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    return apiKey && 
           clientId && 
           apiKey !== 'your_google_api_key_here' && 
           clientId !== 'your_google_client_id_here.apps.googleusercontent.com';
  };

  // Initialize Google API
  useEffect(() => {
    const initializeGapi = async () => {
      try {
        // Check if we have valid configuration
        if (!hasValidConfig()) {
          setError('Google Drive -integraatio vaatii oikeat API-tunnukset. Katso README.md -tiedostosta ohjeet.');
          // Load demo files instead
          loadDemoFiles();
          return;
        }

        if (typeof window.gapi === 'undefined') {
          setError('Google API ei latautunut. Tarkista internetyhteytesi.');
          loadDemoFiles();
          return;
        }

        if (typeof window.google === 'undefined') {
          setError('Google Identity Services ei latautunut. Tarkista internetyhteytesi.');
          loadDemoFiles();
          return;
        }

        // Initialize gapi client
        await new Promise<void>((resolve) => {
          window.gapi.load('client', resolve);
        });

        await window.gapi.client.init({
          apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });

        // Initialize Google Identity Services
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: (response: any) => {
            if (response.error) {
              setError(`Kirjautumisvirhe: ${response.error}`);
              setIsLoading(false);
              return;
            }
            
            setAccessToken(response.access_token);
            setIsSignedIn(true);
            setIsLoading(false);
            setError(null);
            
            // Set the access token for gapi client
            window.gapi.client.setToken({
              access_token: response.access_token
            });
          },
        });

        setTokenClient(client);
        setGapi(window.gapi);
        setError(null);
      } catch (err) {
        console.log('Google API initialization failed, using demo mode:', err);
        setError('Google API ei ole käytettävissä. Käytetään demo-tilaa.');
        loadDemoFiles();
      }
    };

    initializeGapi();
  }, []);

  const loadDemoFiles = () => {
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
      }
    ];
    setFiles(demoFiles);
    setIsSignedIn(true); // Set as signed in for demo mode
  };

  const signIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!hasValidConfig()) {
        // Demo mode - simulate successful login
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSignedIn(true);
        loadDemoFiles();
        return;
      }

      if (tokenClient) {
        // Check if we already have a valid token
        if (accessToken) {
          try {
            // Test if the current token is still valid
            await window.gapi.client.drive.files.list({
              pageSize: 1,
              fields: 'files(id)'
            });
            setIsSignedIn(true);
            setIsLoading(false);
            return;
          } catch (err) {
            // Token is invalid, need to get a new one
            setAccessToken(null);
          }
        }

        // Request new access token
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        throw new Error('Google Identity Services ei ole alustettu');
      }
    } catch (err) {
      setError(`Kirjautuminen epäonnistui: ${err}`);
      setIsLoading(false);
      // Fallback to demo mode
      loadDemoFiles();
      setIsSignedIn(true);
    }
  }, [tokenClient, accessToken]);

  const signOut = useCallback(async () => {
    try {
      if (accessToken && hasValidConfig()) {
        // Revoke the access token
        window.google.accounts.oauth2.revoke(accessToken, () => {
          console.log('Access token revoked');
        });
        
        // Clear the token from gapi client
        window.gapi.client.setToken(null);
      }
      
      setIsSignedIn(false);
      setAccessToken(null);
      setFiles([]);
      setError(null);
    } catch (err) {
      setError(`Uloskirjautuminen epäonnistui: ${err}`);
    }
  }, [accessToken]);

  const loadFiles = useCallback(async (folderId?: string) => {
    if (!isSignedIn) {
      setError('Et ole kirjautunut');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (gapi && gapi.client && gapi.client.drive && hasValidConfig() && accessToken) {
        const query = folderId 
          ? `'${folderId}' in parents and trashed=false`
          : "trashed=false";

        const response = await gapi.client.drive.files.list({
          q: query,
          pageSize: 50,
          fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink,iconLink)',
          orderBy: 'modifiedTime desc'
        });

        const driveFiles: GoogleDriveFile[] = response.result.files || [];
        setFiles(driveFiles);
      } else {
        // Demo mode - files are already loaded
        if (files.length === 0) {
          loadDemoFiles();
        }
      }
    } catch (err) {
      setError(`Tiedostojen lataus epäonnistui: ${err}`);
      // Fallback to demo files
      if (files.length === 0) {
        loadDemoFiles();
      }
    } finally {
      setIsLoading(false);
    }
  }, [gapi, isSignedIn, files.length, accessToken]);

  const searchFiles = useCallback(async (query: string) => {
    if (!isSignedIn) {
      setError('Et ole kirjautunut');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (gapi && gapi.client && gapi.client.drive && hasValidConfig() && accessToken) {
        const searchQuery = `name contains '${query}' and trashed=false`;

        const response = await gapi.client.drive.files.list({
          q: searchQuery,
          pageSize: 50,
          fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink,iconLink)',
          orderBy: 'modifiedTime desc'
        });

        const driveFiles: GoogleDriveFile[] = response.result.files || [];
        setFiles(driveFiles);
      } else {
        // Demo mode - filter demo files
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
          }
        ];
        
        const filteredFiles = allDemoFiles.filter(file => 
          file.name.toLowerCase().includes(query.toLowerCase())
        );
        setFiles(filteredFiles);
      }
    } catch (err) {
      setError(`Haku epäonnistui: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [gapi, isSignedIn, accessToken]);

  const createShareableLink = useCallback(async (fileId: string): Promise<string> => {
    if (!isSignedIn) {
      throw new Error('Et ole kirjautunut');
    }

    try {
      if (gapi && gapi.client && gapi.client.drive && hasValidConfig() && accessToken) {
        // Try to make the file publicly viewable
        await gapi.client.drive.permissions.create({
          fileId: fileId,
          resource: {
            role: 'reader',
            type: 'anyone'
          }
        });

        // Get the file details to return the webViewLink
        const response = await gapi.client.drive.files.get({
          fileId: fileId,
          fields: 'webViewLink'
        });

        return response.result.webViewLink;
      } else {
        // Demo mode
        return `https://drive.google.com/file/d/${fileId}/view`;
      }
    } catch (err) {
      // If we can't make it public, just return the existing link
      return `https://drive.google.com/file/d/${fileId}/view`;
    }
  }, [gapi, isSignedIn, accessToken]);

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