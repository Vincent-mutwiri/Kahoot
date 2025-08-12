import { useMemo } from 'react';
import type { Selectable } from 'kysely';
import type { Games, Players } from './schema';

export type RoundFlowPhase =
  | 'Question'
  | 'Intermission_Elims'
  | 'Intermission_Surv'
  | 'ResultsModal';

type PlayerInfo = Pick<Selectable<Players>, 'id' | 'username' | 'status' | 'eliminatedRound'> & {
  score?: number;
  balance?: number;
};

export const useRoundFlow = (
  game?: Selectable<Games> & { gameState?: string },
  players: PlayerInfo[] = []
) => {
  return useMemo(() => {
    if (!game) {
      return {
        phase: 'Question' as RoundFlowPhase,
        eliminatedPlayers: [] as PlayerInfo[],
        survivors: [] as PlayerInfo[],
        everyoneSurvives: false,
      };
    }

    const currentIndex = game.currentQuestionIndex ?? 0;
    const eliminatedPlayers = players.filter(
      (p) => p.status === 'eliminated' && p.eliminatedRound === currentIndex
    );
    const survivors = players.filter(
      (p) => p.status === 'active' || p.status === 'redeemed'
    );
    const everyoneSurvives = eliminatedPlayers.length === 0;

    let phase: RoundFlowPhase = 'Question';
    const state = (game as any).gameState || (game as any).status;
    switch (state) {
      case 'elimination':
        phase = everyoneSurvives ? 'Intermission_Surv' : 'Intermission_Elims';
        break;
      case 'survivors':
        phase = 'Intermission_Surv';
        break;
      case 'round_results':
        phase = 'ResultsModal';
        break;
      default:
        phase = 'Question';
    }

    return { phase, eliminatedPlayers, survivors, everyoneSurvives };
  }, [game, players]);
};

export default useRoundFlow;
