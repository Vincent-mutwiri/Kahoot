import React from 'react';
import type { Selectable } from 'kysely';
import type { Games, Players } from '../helpers/schema';
import { PlayerList } from './PlayerList';
import styles from './LobbyView.module.css';

interface LobbyViewProps {
  game: Selectable<Games>;
  players: Pick<Selectable<Players>, 'id' | 'username' | 'status'>[];
}

export const LobbyView: React.FC<LobbyViewProps> = ({ game, players }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>GAME LOBBY</h1>
        <div className={styles.gameCode}>
          CODE: <span className={styles.codeValue}>{game.code}</span>
        </div>
      </div>
      <div className={styles.mainContent}>
        <div className={styles.waitingMessage}>
          <h2 className={styles.waitingTitle}>Waiting for Host to Start</h2>
          <p className={styles.waitingSubtitle}>Get ready, the game will begin soon!</p>
        </div>
        <div className={styles.prizeInfo}>
          <span className={styles.prizeLabel}>Starting Prize Pot</span>
          <span className={styles.prizeValue}>
            ${game.initialPrizePot.toLocaleString()}
          </span>
        </div>
      </div>
      <div className={styles.playerListContainer}>
        <PlayerList players={players} />
      </div>
    </div>
  );
};