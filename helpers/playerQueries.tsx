import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postPlayerAnswer, InputType as AnswerInput, OutputType as AnswerOutput } from "../endpoints/player/answer_POST.schema";
import { getPlayerState, InputType as PlayerStateInput, OutputType as PlayerStateOutput } from "../endpoints/player/state_GET.schema";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const PLAYER_STATE_QUERY_KEY = 'playerState';

/**
 * Query to fetch the game state for a specific player.
 * Polls every 2 seconds to keep the UI up-to-date with real-time changes.
 * @param params - Contains the gameCode and username.
 * @param options - React Query options.
 */
export const usePlayerState = (
  params: PlayerStateInput,
  options?: { enabled?: boolean }
) => {
  return useQuery<PlayerStateOutput, Error>({
    queryKey: [PLAYER_STATE_QUERY_KEY, params.gameCode, params.username],
    queryFn: () => getPlayerState(params),
    enabled: !!params.gameCode && !!params.username && (options?.enabled ?? true),
    refetchInterval: 2000, // Poll for updates every 2 seconds
  });
};

/**
 * Mutation for a player to submit an answer with immediate feedback and routing.
 */
export const useSubmitAnswer = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  return useMutation<AnswerOutput, Error, AnswerInput>({
    mutationFn: postPlayerAnswer,
    onSuccess: (data, variables) => {
      // Invalidate the player state query to immediately reflect the result of the answer.
      queryClient.invalidateQueries({ 
        queryKey: [PLAYER_STATE_QUERY_KEY, variables.gameCode, variables.username] 
      });

      // Provide immediate feedback based on elimination status
      if (data.status === 'eliminated') {
        toast.error("You've been eliminated!", {
          description: data.message,
          duration: 4000,
        });
        
        // Route immediately to eliminated view without waiting for polling
        navigate(`/game/${variables.gameCode}/eliminated`);
      } else if (data.status === 'active') {
        toast.success("Answer submitted!", {
          description: "Waiting for other players...",
          duration: 2000,
        });
      }
    },
    onError: (error, variables) => {
      // Enhanced error handling with clearer feedback
      const errorMessage = error.message || "Failed to submit answer";
      toast.error("Submission failed", {
        description: errorMessage,
        duration: 4000,
      });
      
      // If the error indicates elimination (e.g., time's up), route to eliminated view
      if (errorMessage.includes("eliminated") || errorMessage.includes("Time's up")) {
        navigate(`/game/${variables.gameCode}/eliminated`);
      }
    },
  });
};