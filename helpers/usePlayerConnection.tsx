import { useState, useEffect, useRef } from 'react';
import { usePlayerStateQuery } from './playerQueries';

type ConnectionStatusType = 'connected' | 'connecting' | 'disconnected' | 'error';

interface UsePlayerConnectionReturn {
  data: ReturnType<typeof usePlayerStateQuery>['data'];
  isFetching: boolean;
  error: Error | null;
  connectionStatus: ConnectionStatusType;
  lastUpdated: Date | undefined;
  refetch: () => void;
}

/**
 * Enhanced hook that wraps usePlayerState with connection monitoring and status tracking.
 * Provides real-time connection feedback and handles connection recovery gracefully.
 */
export const usePlayerConnection = (
  params: { gameCode: string; username: string },
  options?: { enabled?: boolean }
): UsePlayerConnectionReturn => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusType>('connecting');
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);
  const consecutiveErrorsRef = useRef(0);
  const lastSuccessRef = useRef<Date | undefined>(undefined);

  const query = usePlayerStateQuery(
    params.gameCode, 
    params.username, 
    options?.enabled ?? true
  );

  const { data, isFetching, error, refetch } = query;

  // Update connection status based on query state with manual retry logic
  useEffect(() => {
    if (isFetching && !data) {
      setConnectionStatus('connecting');
    } else if (error) {
      consecutiveErrorsRef.current++;
      
      // Distinguish between connection errors and game errors
      const isConnectionError = error.message?.includes('fetch') || 
                               error.message?.includes('network') ||
                               error.message?.includes('Failed to');
      
      // Auto-retry for network errors up to 3 times
      if (isConnectionError && consecutiveErrorsRef.current < 3) {
        setTimeout(() => {
          const retryDelay = Math.min(1000 * 2 ** (consecutiveErrorsRef.current - 1), 5000);
          setTimeout(() => refetch(), retryDelay);
        }, 100);
        setConnectionStatus('connecting');
      } else if (isConnectionError || consecutiveErrorsRef.current >= 3) {
        setConnectionStatus('error');
      } else {
        setConnectionStatus('disconnected');
      }
    } else if (data) {
      consecutiveErrorsRef.current = 0;
      lastSuccessRef.current = new Date();
      setLastUpdated(new Date());
      setConnectionStatus('connected');
    }
  }, [data, isFetching, error, refetch]);

  // WebSocket: subscribe to server push for this game and refetch on events
  useEffect(() => {
    if (!options?.enabled) return;
    if (!params.gameCode) return;

    let ws: WebSocket | null = null;
    const connect = () => {
      setConnectionStatus('connecting');
      const url = new URL('/ws', window.location.origin.replace(/^http/, 'ws'));
      url.searchParams.set('gameCode', params.gameCode);
      ws = new WebSocket(url.toString());

      ws.onopen = () => {
        setConnectionStatus('connected');
      };
      ws.onmessage = () => {
        // Any message means something changed; refetch latest state
        refetch();
      };
      ws.onerror = () => {
        setConnectionStatus('error');
      };
      ws.onclose = () => {
        setConnectionStatus('disconnected');
        // Attempt quick reconnect after brief delay
        setTimeout(() => connect(), 1000);
      };
    };

    connect();
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      ws = null;
    };
  }, [params.gameCode, options?.enabled, refetch]);

  // Monitor for stale data (no updates for more than expected polling interval)
  useEffect(() => {
    if (connectionStatus === 'connected' && lastSuccessRef.current) {
      const checkStaleData = () => {
        const now = new Date();
        const timeSinceLastUpdate = now.getTime() - (lastSuccessRef.current?.getTime() || 0);
        
        // If no update for more than 2.5x the polling interval, consider disconnected
        if (timeSinceLastUpdate > 5000) { // 2.5 * 2000ms
          setConnectionStatus('disconnected');
        }
      };

      const intervalId = setInterval(checkStaleData, 1000);
      return () => clearInterval(intervalId);
    }
  }, [connectionStatus]);

  const handleReconnect = () => {
    consecutiveErrorsRef.current = 0;
    setConnectionStatus('connecting');
    refetch();
  };

  return {
    data,
    isFetching,
    error,
    connectionStatus,
    lastUpdated,
    refetch: handleReconnect,
  };
};