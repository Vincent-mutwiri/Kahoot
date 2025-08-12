import React, { useState, useEffect } from 'react';
import type { Selectable } from 'kysely';
import type { Games, Players } from '../helpers/schema';
import { useSubmitAnswerMutation } from '../helpers/playerQueries';
import { useSyncedCountdown } from '../helpers/useSyncedCountdown';
import { PlayerList } from './PlayerList';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { Progress } from './Progress';
import { toast } from 'sonner';
import styles from './QuestionView.module.css';

type PublicQuestion = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  questionIndex: number;
  correctAnswer: string | null;
};

interface QuestionViewProps {
  game: Selectable<Games>;
  player?: Selectable<Players>;
  players: Pick<Selectable<Players>, 'id' | 'username' | 'status'>[];
  currentQuestion: PublicQuestion;
  questionStartTimeMs: number | null;
  isSpectator?: boolean;
}

const ANSWER_OPTIONS = ['A', 'B', 'C', 'D'] as const;
type AnswerOption = typeof ANSWER_OPTIONS[number];

const COUNTDOWN_DURATION_MS = 30 * 1000; // 30 seconds in milliseconds

export const QuestionView: React.FC<QuestionViewProps> = ({ 
  game, 
  player, 
  players, 
  currentQuestion, 
  questionStartTimeMs, 
  isSpectator = false 
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const submitAnswerMutation = useSubmitAnswerMutation();

  // Use server-synchronized countdown
  const { remainingSeconds, remainingPercentage, isExpired } = useSyncedCountdown(
    questionStartTimeMs,
    COUNTDOWN_DURATION_MS
  );

  useEffect(() => {
    // Reset state for new question
    setSelectedAnswer(null);
    setIsLocked(false);
  }, [currentQuestion.questionIndex]);

  useEffect(() => {
    // Lock UI when timer expires and show feedback
    if (isExpired && !isLocked) {
      setIsLocked(true);
      if (!selectedAnswer && !isSpectator) {
        toast.warning("Time's up!", {
          description: "You didn't submit an answer in time.",
          duration: 3000,
        });
      }
    }
  }, [isExpired, isLocked, selectedAnswer, isSpectator]);

  const handleAnswerSelect = (answer: AnswerOption) => {
    if (isLocked || submitAnswerMutation.isPending || isExpired || isSpectator) return;
    setSelectedAnswer(answer);
    setIsLocked(true);
    if (player) {
      submitAnswerMutation.mutate({
        gameCode: game.code,
        username: player.username,
        answer: answer,
      });
    }
  };

  const getTimerColor = () => {
    if (remainingPercentage > 50) return styles.timerStart;
    if (remainingPercentage > 20) return styles.timerMid;
    return styles.timerEnd;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.questionCounter}>
          QUESTION {currentQuestion.questionIndex + 1}
        </div>
        <div className={styles.prizePot}>
          <span className={styles.prizeLabel}>PRIZE POT</span>
          <span className={styles.prizeValue}>${game.currentPrizePot.toLocaleString()}</span>
        </div>
      </header>
      <main className={styles.mainContent}>
        <p className={styles.questionText}>{currentQuestion.questionText}</p>
        <div className={styles.optionsGrid}>
          {ANSWER_OPTIONS.map(opt => (
            <Button
              key={opt}
              className={`${styles.optionButton} ${selectedAnswer === opt ? styles.selected : ''} ${isLocked || isSpectator ? styles.locked : ''}`}
              onClick={() => handleAnswerSelect(opt)}
              disabled={isLocked || isExpired || isSpectator}
            >
              <span className={styles.optionLabel}>{opt}</span>
              <span className={styles.optionText}>{currentQuestion[`option${opt}` as keyof PublicQuestion]}</span>
              {submitAnswerMutation.isPending && selectedAnswer === opt && <Spinner size="sm" />}
            </Button>
          ))}
        </div>
      </main>
      <aside className={styles.sidebar}>
        <div className={styles.timerContainer}>
          <div className={`${styles.timer} ${getTimerColor()}`}>{remainingSeconds}</div>
          <Progress value={remainingPercentage} className={`${styles.progressBar} ${getTimerColor()}`} />
        </div>
        <PlayerList players={players} />
      </aside>
    </div>
  );
};