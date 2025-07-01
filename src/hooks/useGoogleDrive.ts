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
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

export function useGoogleDrive(): UseGoogleDriveReturn {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
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

  // Make REST API call to Google Drive
  const makeApiCall = async (endpoint: string, params: Record<string, string> = {}) => {
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const url = new URL(`https://www.googleapis.com/drive/v3/${endpoint}`);
    
    // Add API key and access token
    url.searchParams.append('key', import.meta.env.VITE_GOOGLE_API_KEY);
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }

    return response.json();
  };

  // Initialize Google Identity Services
  useEffect(() => {
    const initializeGoogleAuth = async () => {
      try {
        // Check if we have valid configuration
        if (!hasValidConfig()) {
          setError('Google Drive -integraatio vaatii oikeat API-tunnukset. Katso README.md -tiedostosta ohjeet.');
          loadDemoFiles();
          return;
        }

        if (typeof window.google === 'undefined') {
          setError('Google Identity Services ei latautunut. Tarkista internetyhteytesi.');
          loadDemoFiles();
          return;
        }

        // Initialize Google Identity Services
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          scope: SCOPES,
          ux_mode: 'popup',
          callback: (response: any) => {
            console.log('Token response received:', response);
            
            if (response.error) {
              console.error('Token error:', response.error);
              setError(`Kirjautumisvirhe: ${response.error}`);
              setIsLoading(false);
              loadDemoFiles();
              setIsSignedIn(true);
              return;
            }
            
            if (response.access_token) {
              console.log('Access token received successfully');
              setAccessToken(response.access_token);
              setIsSignedIn(true);
              setError(null);
              
              // Auto-load files after successful authentication
              setTimeout(async () => {
                try {
                  await loadFilesWithToken(response.access_token);
                  setIsLoading(false);
                } catch (err) {
                  console.error('Error loading files after auth:', err);
                  setIsLoading(false);
                }
              }, 100);
            } else {
              setError('Ei saatu access tokenia');
              setIsLoading(false);
              loadDemoFiles();
              setIsSignedIn(true);
            }
          }
        });

        setTokenClient(client);
        setError(null);
        console.log('Google Identity Services initialized successfully');
      } catch (err) {
        console.log('Google Identity Services initialization failed, using demo mode:', err);
        setError('Google API ei ole käytettävissä. Käytetään demo-tilaa.');
        loadDemoFiles();
      }
    };

    initializeGoogleAuth();
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
    setIsSignedIn(true);
  };

  const loadFilesWithToken = async (token: string, folderId?: string) => {
    try {
      const query = folderId 
        ? `'${folderId}' in parents and trashed=false`
        : "trashed=false";

      console.log('Loading files from Google Drive via REST API...');
      
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.append('key', import.meta.env.VITE_GOOGLE_API_KEY);
      url.searchParams.append('q', query);
      url.searchParams.append('pageSize', '50');
      url.searchParams.append('fields', 'files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink,iconLink)');
      url.searchParams.append('orderBy', 'modifiedTime desc');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const driveFiles: GoogleDriveFile[] = data.files || [];
      setFiles(driveFiles);
      console.log(`Loaded ${driveFiles.length} files from Google Drive`);
    } catch (err) {
      console.error('Error loading files:', err);
      throw err;
    }
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
        setIsLoading(false);
        return;
      }

      if (tokenClient) {
        // Check if we already have a valid token
        if (accessToken) {
          try {
            // Test if the current token is still valid
            await loadFilesWithToken(accessToken);
            setIsSignedIn(true);
            setIsLoading(false);
            return;
          } catch (err) {
            // Token is invalid, need to get a new one
            setAccessToken(null);
          }
        }

        // Request new access token
        console.log('Requesting access token...');
        tokenClient.requestAccessToken({ prompt: 'consent' });
        
      } else {
        throw new Error('Google Identity Services ei ole alustettu');
      }
    } catch (err) {
      console.error('Sign in error:', err);
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

      if (hasValidConfig() && accessToken) {
        await loadFilesWithToken(accessToken, folderId);
      } else {
        // Demo mode - files are already loaded
        if (files.length === 0) {
          loadDemoFiles();
        }
      }
    } catch (err) {
      console.error('Error loading files:', err);
      setError(`Tiedostojen lataus epäonnistui: ${err}`);
      // Fallback to demo files
      if (files.length === 0) {
        loadDemoFiles();
      }
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, files.length, accessToken]);

  const searchFiles = useCallback(async (query: string) => {
    if (!isSignedIn) {
      setError('Et ole kirjautunut');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (hasValidConfig() && accessToken) {
        const searchQuery = `name contains '${query}' and trashed=false`;
        
        const url = new URL('https://www.googleapis.com/drive/v3/files');
        url.searchParams.append('key', import.meta.env.VITE_GOOGLE_API_KEY);
        url.searchParams.append('q', searchQuery);
        url.searchParams.append('pageSize', '50');
        url.searchParams.append('fields', 'files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink,iconLink)');
        url.searchParams.append('orderBy', 'modifiedTime desc');

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Search failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const driveFiles: GoogleDriveFile[] = data.files || [];
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
  }, [isSignedIn, accessToken]);

  const createShareableLink = useCallback(async (fileId: string): Promise<string> => {
    if (!isSignedIn) {
      throw new Error('Et ole kirjautunut');
    }

    try {
      if (hasValidConfig() && accessToken) {
        // Try to make the file publicly viewable
        const permissionUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`;
        
        await fetch(`${permissionUrl}?key=${import.meta.env.VITE_GOOGLE_API_KEY}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone'
          })
        });

        // Get the file details to return the webViewLink
        const fileUrl = `https://www.googleapis.com/drive/v3/files/${fileId}`;
        const response = await fetch(`${fileUrl}?key=${import.meta.env.VITE_GOOGLE_API_KEY}&fields=webViewLink`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          return data.webViewLink;
        }
      }
      
      // Fallback or demo mode
      return `https://drive.google.com/file/d/${fileId}/view`;
    } catch (err) {
      // If we can't make it public, just return the existing link
      return `https://drive.google.com/file/d/${fileId}/view`;
    }
  }, [isSignedIn, accessToken]);

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
    google: any;
  }
}