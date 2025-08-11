import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postVoteStart, InputType as StartVoteInput, OutputType as StartVoteOutput } from "../endpoints/vote/start_POST.schema";
import { postVoteCast, InputType as CastVoteInput, OutputType as CastVoteOutput } from "../endpoints/vote/cast_POST.schema";
import { getVoteState, InputType as VoteStateInput, OutputType as VoteStateOutput } from "../endpoints/vote/state_GET.schema";
import { postVoteEnd, InputType as EndVoteInput, OutputType as EndVoteOutput } from "../endpoints/vote/end_POST.schema";
import { GAME_INFO_QUERY_KEY } from "./gameQueries";

export const VOTE_STATE_QUERY_KEY = 'voteState';

/**
 * Mutation for the host to start a new redemption voting round.
 * Invalidates game info queries on success.
 */
export const useStartVotingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<StartVoteOutput, Error, StartVoteInput>({
    mutationFn: postVoteStart,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [GAME_INFO_QUERY_KEY, variables.gameCode] });
      queryClient.invalidateQueries({ queryKey: [GAME_INFO_QUERY_KEY, 'realtime', variables.gameCode] });
    },
  });
};

/**
 * Mutation for an active player to cast a vote.
 * Invalidates the vote state query to reflect the new vote count.
 */
export const useCastVoteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<CastVoteOutput, Error, CastVoteInput & { gameCode: string }>({
    // The endpoint doesn't need gameCode, but we need it for invalidation.
    mutationFn: (variables) => postVoteCast(variables),
    onSuccess: (data, variables) => {
      // Invalidate the specific vote state to trigger a refetch of tallies
      queryClient.invalidateQueries({ queryKey: [VOTE_STATE_QUERY_KEY, variables.roundId] });
    },
  });
};

/**
 * Query to fetch the real-time state of a voting round.
 * Polls every second to keep data fresh during the short voting window.
 * @param params - Contains the roundId.
 * @param options - React Query options, e.g., { enabled: boolean }.
 */
export const useVoteState = (
  params: VoteStateInput,
  options?: { enabled?: boolean }
) => {
  const enabled = !!params.roundId && (options?.enabled ?? true);

  return useQuery<VoteStateOutput, Error>({
    queryKey: [VOTE_STATE_QUERY_KEY, params.roundId],
    queryFn: () => getVoteState(params),
    enabled,
    // Poll frequently as voting rounds are short (20s)
    refetchInterval: 1000, 
    refetchIntervalInBackground: true,
    staleTime: 0,
  });
};

/**
 * Mutation for the host to end a voting round.
 * Invalidates game info queries to reflect the redeemed player and prize pot change.
 */
export const useEndVotingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<EndVoteOutput, Error, EndVoteInput & { gameCode: string }>({
    // The endpoint doesn't need gameCode, but we need it for invalidation.
    mutationFn: (variables) => postVoteEnd(variables),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [GAME_INFO_QUERY_KEY, variables.gameCode] });
      queryClient.invalidateQueries({ queryKey: [GAME_INFO_QUERY_KEY, 'realtime', variables.gameCode] });
      // Also invalidate the vote state query to show the final 'completed' state
      queryClient.invalidateQueries({ queryKey: [VOTE_STATE_QUERY_KEY, variables.roundId] });
    },
  });
};