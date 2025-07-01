import { useState, useEffect, useCallback } from 'react';

// ... (pidä muut käyttöliittymät ja vakiot ennallaan)
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
  createShareableLink: (fileId: string) => Promise<string | undefined>;
}

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

export function useGoogleDrive(): UseGoogleDriveReturn {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const hasValidConfig = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    return apiKey && 
           clientId && 
           apiKey !== 'your_google_api_key_here' && 
           clientId !== 'your_google_client_id_here.apps.googleusercontent.com';
  };
  
  const loadDemoFiles = useCallback(() => {
     // ... (tämän funktion sisältö pysyy samana, ei tarvitse muuttaa)
  }, []);


  useEffect(() => {
    const initializeGapi = async () => {
      // ... (tämän funktion sisältö pysyy samana, ei tarvitse muuttaa)
    };

    initializeGapi();
  }, [loadDemoFiles]);

  const makeApiCall = useCallback(async <T>(url: string, options: RequestInit = {}): Promise<T> => {
    if (!accessToken) {
      throw new Error("Access token is not available");
    }

    const headers = new Headers(options.headers || {});
    headers.append('Authorization', `Bearer ${accessToken}`);
    if (options.body) {
      headers.append('Content-Type', 'application/json');
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || 'API call failed');
    }
    // Handle cases with no response body (e.g., a 204 No Content response)
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }, [accessToken]);


  const signIn = useCallback(async () => {
     // ... (tämän funktion sisältö pysyy samana, ei tarvitse muuttaa)
  }, [tokenClient, accessToken, loadDemoFiles]);

  const signOut = useCallback(async () => {
     // ... (tämän funktion sisältö pysyy samana, ei tarvitse muuttaa)
  }, [accessToken]);

  const loadFiles = useCallback(async (folderId?: string) => {
    if (!isSignedIn) return;
    setIsLoading(true);
    setError(null);

    try {
      if (hasValidConfig() && accessToken) {
        const url = new URL('https://www.googleapis.com/drive/v3/files');
        const query = folderId ? `'${folderId}' in parents and trashed=false` : "trashed=false";
        
        url.search = new URLSearchParams({
          q: query,
          pageSize: '50',
          fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink,iconLink)',
          orderBy: 'modifiedTime desc'
        }).toString();

        const result = await makeApiCall<{ files: GoogleDriveFile[] }>(url.toString());
        setFiles(result.files || []);
      } else {
        loadDemoFiles();
      }
    } catch (err: any) {
      setError(`Tiedostojen lataus epäonnistui: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, accessToken, makeApiCall, loadDemoFiles]);

  const searchFiles = useCallback(async (query: string) => {
    if (!isSignedIn) return;
    setIsLoading(true);
    setError(null);

    try {
      if (hasValidConfig() && accessToken) {
        const url = new URL('https://www.googleapis.com/drive/v3/files');
        const searchQuery = `name contains '${query}' and trashed=false`;

        url.search = new URLSearchParams({
          q: searchQuery,
          pageSize: '50',
          fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink,iconLink)',
          orderBy: 'modifiedTime desc'
        }).toString();
        
        const result = await makeApiCall<{ files: GoogleDriveFile[] }>(url.toString());
        setFiles(result.files || []);
      } else {
        // ... demo mode logic
      }
    } catch (err: any) {
      setError(`Haku epäonnistui: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, accessToken, makeApiCall]);
  
  const createShareableLink = useCallback(async (fileId: string) => {
    if (!isSignedIn) return;
    try {
       if (hasValidConfig() && accessToken) {
        // Make file publicly readable
        await makeApiCall(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
          method: 'POST',
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone'
          })
        });

        // Get the updated file metadata for the link
        const file = await makeApiCall<{ webViewLink: string }>(
          `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`
        );
        return file.webViewLink;
       } else {
         return `https://drive.google.com/file/d/${fileId}/view`;
       }
    } catch (err: any) {
      console.warn(`Could not create shareable link for ${fileId}: ${err.message}`);
      return `https://drive.google.com/file/d/${fileId}/view`;
    }
  }, [isSignedIn, accessToken, makeApiCall]);


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
