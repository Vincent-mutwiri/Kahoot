import React from 'react';
import type { Selectable } from 'kysely';
import type { Games, Players } from '../helpers/schema';
import { PlayerList } from './PlayerList';
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
          <div className={styles.prizePot}>
            <span className={styles.prizeLabel}>CURRENT PRIZE POT</span>
            <span className={styles.prizeValue}>${game.currentPrizePot.toLocaleString()}</span>
          </div>
        </header>
        <main className={styles.main}>
          {currentQuestion ? (
            <>
              <p className={styles.questionText}>{currentQuestion.questionText}</p>
              {currentQuestion.correctAnswer && (
                <p className={styles.answerReveal}>
                  Correct Answer: <span className={styles.correctAnswer}>{currentQuestion.correctAnswer}</span>
                </p>
              )}
            </>
          ) : (
            <p className={styles.waitingText}>Waiting for the next round to begin...</p>
          )}
        </main>
        <aside className={styles.sidebar}>
          <PlayerList players={players} />
        </aside>
      </div>
    </div>
  );
};