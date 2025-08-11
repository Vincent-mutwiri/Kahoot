import { useQuery } from '@tanstack/react-query';
import { getVoteState } from '../endpoints/vote/state_GET.schema';

export const useVoteState = (roundId: number | null, options?: { refetchInterval?: number | false }) => {
  return useQuery({
    queryKey: ['voteState', roundId],
    queryFn: () => {
      if (!roundId) {
        // This should not happen if enabled is used correctly, but as a safeguard:
        return Promise.reject(new Error("roundId is required"));
      }
      return getVoteState({ roundId });
    },
    enabled: !!roundId, // Only run the query if roundId is not null
    refetchInterval: options?.refetchInterval ?? 2000, // Default to refetching every 2 seconds
    staleTime: 0, // Ensure data is always fresh during an active poll
    refetchOnWindowFocus: 'always',
  });
};