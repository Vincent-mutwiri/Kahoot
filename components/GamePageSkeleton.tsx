import React from 'react';
import { Skeleton } from './Skeleton';
import styles from './GamePageSkeleton.module.css';

export const GamePageSkeleton: React.FC = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Skeleton className={styles.gameCodeSkeleton} />
        <Skeleton className={styles.prizePotSkeleton} />
      </header>
      <main className={styles.mainContent}>
        <Skeleton className={styles.questionSkeleton} />
        <div className={styles.optionsGrid}>
          <Skeleton className={styles.optionSkeleton} />
          <Skeleton className={styles.optionSkeleton} />
          <Skeleton className={styles.optionSkeleton} />
          <Skeleton className={styles.optionSkeleton} />
        </div>
        <Skeleton className={styles.timerSkeleton} />
      </main>
      <aside className={styles.sidebar}>
        <Skeleton className={styles.playerListHeaderSkeleton} />
        <div className={styles.playerListSkeleton}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className={styles.playerItemSkeleton} />
          ))}
        </div>
      </aside>
    </div>
  );
};