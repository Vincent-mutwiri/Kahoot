import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../helpers/useWebSocket';

export type Phase =
  | 'Question'
  | 'Lock'
  | 'Intermission_Elims'
  | 'Intermission_Surv'
  | 'ResultsModal'
  | 'Voting'
  | 'RevealRedemption'
  | 'WaitingNext';

interface UseRoundFlowOptions {
  gameCode: string;
  eliminationVideoUrl?: string | null;
  onUpdate?: () => void;
}

interface RoundFlowState {
  phase: Phase;
  votingRoundId: string | null;
}

/**
 * Manages round flow transitions for players.
 * Reacts to server websocket events and advances phases on timers.
 */
export function useRoundFlow({
  gameCode,
  eliminationVideoUrl,
  onUpdate,
}: UseRoundFlowOptions): RoundFlowState {
  const [phase, setPhase] = useState<Phase>('Question');
  const [votingRoundId, setVotingRoundId] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  const schedule = (next: Phase, delay: number) => {
    const id = window.setTimeout(() => {
      setPhase(next);
    }, delay);
    timers.current.push(id);
  };

  const preloadVideo = (url: string) => {
    if (!url) return;
    const video = document.createElement('video');
    video.src = url;
    video.preload = 'auto';
    // Loading begins immediately
    video.load();
  };

  useWebSocket(gameCode, (message) => {
    switch (message.type) {
      case 'round_results': {
        clearTimers();
        setPhase('ResultsModal');
        if (eliminationVideoUrl) {
          preloadVideo(eliminationVideoUrl);
        }
        // Show results modal then elimination and survivor intermissions
        schedule('Intermission_Elims', 4000);
        schedule('Intermission_Surv', 8000);
        schedule('WaitingNext', 12000);
        onUpdate?.();
        break;
      }
      case 'open_vote': {
        clearTimers();
        setPhase('Voting');
        if (message.roundId) {
          setVotingRoundId(String(message.roundId));
        }
        onUpdate?.();
        break;
      }
      case 'vote_result': {
        clearTimers();
        setPhase('RevealRedemption');
        schedule('WaitingNext', 4000);
        onUpdate?.();
        break;
      }
      case 'next_round': {
        clearTimers();
        setVotingRoundId(null);
        setPhase('Question');
        onUpdate?.();
        break;
      }
    }
  });

  // Clear timers on unmount
  useEffect(() => clearTimers, []);

  return { phase, votingRoundId };
}
