import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import superjson from 'superjson';

// API call functions
const apiPost = async <T,>(endpoint: string, data: any): Promise<T> => {
  const response = await fetch(`/_api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: superjson.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.text().catch(() => 'Unknown error');
    throw new Error(error);
  }
  
  return superjson.parse(await response.text());
};

const apiGet = async <T,>(endpoint: string, params: Record<string, string>): Promise<T> => {
  const url = new URL(`/_api/${endpoint}`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    const error = await response.text().catch(() => 'Unknown error');
    throw new Error(error);
  }
  
  return superjson.parse(await response.text());
};

// Types
type AnswerInput = {
  gameCode: string;
  username: string;
  answer: 'A' | 'B' | 'C' | 'D';
};

type AnswerOutput = {
  status: string;
  message: string;
};

type PlayerStateInput = {
  gameCode: string;
  username: string;
};

type PlayerStateOutput = {
  // Define based on your actual state structure
  [key: string]: any;
};

type ClearSoundInput = {
  gameCode: string;
};

type PlayerHideMediaInput = {
  gameCode: string;
  username: string;
};

// API functions
export const postPlayerAnswer = (data: AnswerInput): Promise<AnswerOutput> => 
  apiPost<AnswerOutput>('player/answer', data);

export const getPlayerState = (params: PlayerStateInput): Promise<PlayerStateOutput> => 
  apiGet<PlayerStateOutput>('player/state', params);

export const postGameClearSound = (data: ClearSoundInput): Promise<{ success: boolean }> => 
  apiPost<{ success: boolean }>('game/clear-sound', data);

export const postPlayerHideMedia = (data: PlayerHideMediaInput): Promise<{ success: boolean }> => 
  apiPost<{ success: boolean }>('game/player-hide-media', data);

export const PLAYER_STATE_QUERY_KEY = 'playerState';

export const usePlayerStateQuery = (gameCode: string, username: string, enabled: boolean) => {
  return useQuery<PlayerStateOutput, Error>({
    queryKey: [PLAYER_STATE_QUERY_KEY, gameCode, username],
    queryFn: () => getPlayerState({ gameCode, username }),
    enabled,
  });
};

export const useSubmitAnswerMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<AnswerOutput, Error, AnswerInput>({
    mutationFn: postPlayerAnswer,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [PLAYER_STATE_QUERY_KEY, variables.gameCode, variables.username]
      });
      toast.success(data.message || 'Answer submitted successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'An error occurred.');
      if (error.message.includes('Game not found')) {
        navigate('/');
      }
    },
  });
};

export const useClearSoundMutation = () => {
  return useMutation<{ success: boolean }, Error, ClearSoundInput>({
    mutationFn: postGameClearSound,
    onSuccess: () => {
      toast.success('Sound cleared for all players.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to clear sound.');
    },
  });
};

export const usePlayerHideMediaMutation = () => {
  return useMutation<{ success: boolean }, Error, PlayerHideMediaInput>({
    mutationFn: postPlayerHideMedia,
    onSuccess: () => {
      console.log('Player media hidden successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to hide media.');
    },
  });
};