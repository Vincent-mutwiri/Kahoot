import React from 'react';
import styles from './IntermissionSurv.module.css';

type Player = { id: number | string; username: string; score?: number; balance?: number };

interface IntermissionSurvProps {
  videoUrl?: string | null;
  survivors: Player[];
  prizePot: number;
  everyoneSurvives?: boolean;
}

export const IntermissionSurv: React.FC<IntermissionSurvProps> = ({
  videoUrl,
  survivors,
  prizePot,
  everyoneSurvives,
}) => {
  const topPlayers = [...survivors]
    .sort((a, b) => (b.score ?? b.balance ?? 0) - (a.score ?? a.balance ?? 0))
    .slice(0, 5);

  return (
    <div className={styles.container}>
      {videoUrl && <video src={videoUrl} autoPlay className={styles.video} />}
      <aside className={styles.listPanel}>
        <h2 className={styles.heading}>
          {everyoneSurvives ? 'Everyone survives' : 'Survivors'}
        </h2>
        <ul className={styles.list}>
          {survivors.map((p) => (
            <li key={p.id}>{p.username}</li>
          ))}
        </ul>
      </aside>
      <footer className={styles.footer}>
        <div>Prize Pot: ${prizePot.toLocaleString()}</div>
        <div className={styles.leaderboard}>
          <span>Top Players</span>
          <ol className={styles.leaderboardList}>
            {topPlayers.map((p) => (
              <li key={p.id}>{p.username}</li>
            ))}
          </ol>
        </div>
      </footer>
    </div>
  );
};

export default IntermissionSurv;
