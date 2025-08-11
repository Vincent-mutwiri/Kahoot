import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { postGameCreate, InputType as CreateGameInput, OutputType as CreateGameOutput } from "../endpoints/game/create_POST.schema";
import { postGameJoin, InputType as JoinGameInput } from "../endpoints/game/join_POST.schema";
import { getGameInfo, InputType as GameInfoInput, OutputType as GameInfoOutput } from "../endpoints/game/info_GET.schema";

export const GAME_INFO_QUERY_KEY = 'gameInfo';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

/**
 * Query to fetch game information with intelligent polling based on game state.
 * @param params - Contains the gameCode.
 * @param options - React Query options.
 */
export const useGameInfo = (
  params: GameInfoInput,
  options?: { enabled?: boolean }
) => {
  const enabled = !!params.gameCode && (options?.enabled ?? true);
  const query = useQuery<GameInfoOutput, Error>({
    queryKey: [GAME_INFO_QUERY_KEY, params.gameCode],
    queryFn: () => getGameInfo(params),
    enabled,
    staleTime: 30 * 1000, // 30 seconds stale time for performance balance
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      
      // Intelligent polling based on game state
      switch (data.game.status) {
        case 'active':
          return 1000; // 1 second for active games
        case 'lobby':
          return 3000; // 3 seconds for lobby
        case 'finished':
          return 5000; // 5 seconds for finished games
        default:
          return 3000; // Default to lobby interval
      }
    },
    refetchIntervalInBackground: true,
  });

  return query;
};

/**
 * Specialized real-time hook for host dashboard with aggressive polling and connection monitoring.
 * @param params - Contains the gameCode.
 * @param options - React Query options.
 */
export const useGameInfoRealtime = (
  params: GameInfoInput,
  options?: { enabled?: boolean }
) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const failureCountRef = useRef(0);
  const maxRetries = 5;
  const enabled = !!params.gameCode && (options?.enabled ?? true);

  const query = useQuery<GameInfoOutput, Error>({
    queryKey: [GAME_INFO_QUERY_KEY, 'realtime', params.gameCode],
    queryFn: async () => {
      try {
        setConnectionStatus('connecting');
        const result = await getGameInfo(params);
        
        // Reset failure count on success
        failureCountRef.current = 0;
        setConnectionStatus('connected');
        
        return result;
      } catch (error) {
        failureCountRef.current += 1;
        
        if (failureCountRef.current >= maxRetries) {
          setConnectionStatus('error');
        } else {
          setConnectionStatus('disconnected');
        }
        
        throw error;
      }
    },
    enabled,
    staleTime: 0, // Always consider data stale for real-time updates
    refetchInterval: (query) => {
      // Stop polling if we've exceeded max retries
      if (failureCountRef.current >= maxRetries) {
        return false;
      }

      // Exponential backoff for failed requests
      if (query.state.status === 'error') {
        const backoffDelay = Math.min(1000 * Math.pow(2, failureCountRef.current), 10000);
        return backoffDelay;
      }

      const data = query.state.data;
      if (!data) return 1000; // Default interval if no data
      
      // Aggressive polling for active question phases
      if (data.game.status === 'active') {
        return 500; // 500ms for active games
      } else if (data.game.status === 'lobby') {
        return 1000; // 1 second for lobby
      } else {
        return 2000; // 2 seconds for finished games
      }
    },
    refetchIntervalInBackground: true,
    retry: (failureCount, error) => {
      // Custom retry logic with exponential backoff
      return failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => {
      return Math.min(1000 * Math.pow(2, attemptIndex), 10000);
    },
  });

  // Reset connection status when query becomes enabled/disabled
  useEffect(() => {
    if (!enabled) {
      setConnectionStatus('disconnected');
      failureCountRef.current = 0;
    }
  }, [enabled]);

  // Provide connection recovery function
  const reconnect = useCallback(() => {
    failureCountRef.current = 0;
    setConnectionStatus('connecting');
    query.refetch();
  }, [query]);

  return {
    ...query,
    connectionStatus,
    reconnect,
    isConnected: connectionStatus === 'connected',
    hasConnectionError: connectionStatus === 'error',
  };
};

/**
 * Mutation to create a new game.
 */
export const useCreateGame = () => {
  const queryClient = useQueryClient();
  return useMutation<CreateGameOutput, Error, CreateGameInput>({
    mutationFn: postGameCreate,
    onSuccess: () => {
      // Invalidate any queries that list games, if such a query exists.
      // For now, we don't have a "list all games" query to invalidate.
    },
  });
};

/**
 * Mutation for a player to join a game.
 */
export const useJoinGame = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, JoinGameInput>({
    mutationFn: postGameJoin,
    onSuccess: (data, variables) => {
      // Invalidate both regular and realtime game info queries
      queryClient.invalidateQueries({ queryKey: [GAME_INFO_QUERY_KEY, variables.gameCode] });
      queryClient.invalidateQueries({ queryKey: [GAME_INFO_QUERY_KEY, 'realtime', variables.gameCode] });
    },
  });
};