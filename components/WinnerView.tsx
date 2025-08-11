import React from 'react';
import styles from './WinnerView.module.css';

interface WinnerViewProps {
  prize: number;
}

export const WinnerView: React.FC<WinnerViewProps> = ({ prize }) => {
  return (
    <div className={styles.container}>
      <div className={styles.confetti}></div>
      <h1 className={styles.title}>LAST PLAYER STANDING</h1>
      <p className={styles.subtitle}>YOU ARE THE WINNER!</p>
      <div className={styles.prizeContainer}>
        <span className={styles.prizeLabel}>You've Won</span>
        <span className={styles.prizeValue}>
          ${prize.toLocaleString()}
        </span>
      </div>
    </div>
  );
};