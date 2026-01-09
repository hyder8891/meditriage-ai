import { useAuthStore } from "@/hooks/useAuth";

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh the access token using the refresh token
 * Returns the new access token or null if refresh fails
 */
export async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, wait for the existing refresh to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const { refreshToken, setToken, clearAuth } = useAuthStore.getState();

  if (!refreshToken) {
    return null;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      
      const response = await fetch('/api/trpc/auth.refreshToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: { refreshToken },
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        clearAuth();
        return null;
      }

      const data = await response.json();
      
      if (data.result?.data?.json?.success && data.result?.data?.json?.token) {
        const newToken = data.result.data.json.token;
        setToken(newToken);
        return newToken;
      } else {
        clearAuth();
        return null;
      }
    } catch (error) {
      clearAuth();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Check if the token is expired or about to expire (within 1 minute)
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const oneMinute = 60 * 1000;
    
    // Consider token expired if it expires within 1 minute
    return now >= exp - oneMinute;
  } catch {
    return true;
  }
}

/**
 * Get a valid token, refreshing if necessary
 */
export async function getValidToken(): Promise<string | null> {
  const { token, refreshToken } = useAuthStore.getState();

  if (!token) {
    if (refreshToken) {
      return refreshAccessToken();
    }
    return null;
  }

  if (isTokenExpired(token)) {
    return refreshAccessToken();
  }

  return token;
}
