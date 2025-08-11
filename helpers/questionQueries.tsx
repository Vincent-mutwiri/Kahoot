import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postQuestionAdd, InputType as AddQuestionInput, OutputType as AddQuestionOutput } from "../endpoints/question/add_POST.schema";
import { getQuestionList, InputType as ListQuestionInput, OutputType as ListQuestionOutput } from "../endpoints/question/list_GET.schema";
import { postQuestionUpdate, InputType as UpdateQuestionInput, OutputType as UpdateQuestionOutput } from "../endpoints/question/update_POST.schema";
import { postQuestionDelete, InputType as DeleteQuestionInput, OutputType as DeleteQuestionOutput } from "../endpoints/question/delete_POST.schema";
import { useGameInfo, GAME_INFO_QUERY_KEY } from "./gameQueries";

// It's good practice to export query keys to ensure consistency.
export const QUESTIONS_QUERY_KEY = 'questions';

/**
 * A React Query hook for fetching the list of questions for a game with real-time synchronization.
 * Includes intelligent polling that activates during lobby state but stops during active games.
 * Requires gameCode and hostName for authorization.
 * The query is disabled if gameCode or hostName are not provided.
 */
export const useQuestions = (params: ListQuestionInput) => {
  const { gameCode, hostName } = params;
  
  // Get game info to determine polling strategy
  const { data: gameInfo } = useGameInfo(
    { gameCode },
    { enabled: !!gameCode }
  );

  return useQuery<ListQuestionOutput, Error>({
    queryKey: [QUESTIONS_QUERY_KEY, gameCode],
    queryFn: () => getQuestionList({ gameCode, hostName }),
    enabled: !!gameCode && !!hostName, // Only run the query if both params are available
    staleTime: 30 * 1000, // 30 seconds stale time for performance balance
    refetchInterval: () => {
      // Only poll during lobby state to keep question list synchronized
      // Stop polling during active games to reduce server load
      if (gameInfo?.game.status === 'lobby') {
        return 2000; // Poll every 2 seconds during lobby
      }
      return false; // No polling during active or finished games
    },
    refetchIntervalInBackground: true,
  });
};

/**
 * A React Query mutation hook for adding a new question to a game.
 * On success, it invalidates the query for the list of questions for that game,
 * ensuring the UI updates with the new question.
 */
export const useAddQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation<AddQuestionOutput, Error, AddQuestionInput>({
    mutationFn: postQuestionAdd,
    onSuccess: (data, variables) => {
      // Invalidate the query that fetches the list of questions for this specific game.
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_QUERY_KEY, variables.gameCode] });
      // Invalidate game info queries to update game state immediately
      queryClient.invalidateQueries({ queryKey: [GAME_INFO_QUERY_KEY, variables.gameCode] });
      queryClient.invalidateQueries({ queryKey: [GAME_INFO_QUERY_KEY, 'realtime', variables.gameCode] });
    },
  });
};

/**
 * A React Query mutation hook for updating an existing question.
 * On success, it invalidates the questions list query to reflect the changes.
 */
export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateQuestionOutput, Error, UpdateQuestionInput>({
    mutationFn: postQuestionUpdate,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_QUERY_KEY, variables.gameCode] });
      // Invalidate game info queries to update game state immediately
      queryClient.invalidateQueries({ queryKey: [GAME_INFO_QUERY_KEY, variables.gameCode] });
      queryClient.invalidateQueries({ queryKey: [GAME_INFO_QUERY_KEY, 'realtime', variables.gameCode] });
    },
  });
};

/**
 * A React Query mutation hook for deleting a question.
 * On success, it invalidates the questions list query to remove the deleted question from the UI.
 */
export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteQuestionOutput, Error, DeleteQuestionInput>({
    mutationFn: postQuestionDelete,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_QUERY_KEY, variables.gameCode] });
      // Invalidate game info queries to update game state immediately
      queryClient.invalidateQueries({ queryKey: [GAME_INFO_QUERY_KEY, variables.gameCode] });
      queryClient.invalidateQueries({ queryKey: [GAME_INFO_QUERY_KEY, 'realtime', variables.gameCode] });
    },
  });
};