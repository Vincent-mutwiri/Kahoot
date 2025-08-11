import React from 'react';
import type { Selectable } from 'kysely';
import type { Games, Players } from '../helpers/schema';
import { QuestionView } from './QuestionView';
import styles from './EliminatedView.module.css';

type PublicQuestion = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  questionIndex: number;
  correctAnswer: string | null;
};

interface EliminatedViewProps {
  game: Selectable<Games>;
  players: Pick<Selectable<Players>, 'id' | 'username' | 'status'>[];
  currentQuestion: PublicQuestion | null;
}

export const EliminatedView: React.FC<EliminatedViewProps> = ({ game, players, currentQuestion }) => {
  return (
    <div className={styles.container}>
      <div className={styles.overlay}>
        <h1 className={styles.eliminatedText}>ELIMINATED</h1>
      </div>
      <div className={styles.spectatorContent}>
        <header className={styles.header}>
          <h2 className={styles.spectatorTitle}>SPECTATOR MODE</h2>
        </header>
        {currentQuestion && (
          <QuestionView
            game={game}
            players={players}
            currentQuestion={currentQuestion}
            questionStartTimeMs={null} // Spectators don't need a timer
            isSpectator={true}
          />
        )}
      </div>
    </div>
  );
};