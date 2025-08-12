import React from 'react';
import styles from './IntermissionElims.module.css';

type Player = { id: number | string; username: string };

interface IntermissionElimsProps {
  videoUrl?: string | null;
  eliminatedPlayers: Player[];
  isEliminated: boolean;
}

export const IntermissionElims: React.FC<IntermissionElimsProps> = ({
  videoUrl,
  eliminatedPlayers,
  isEliminated,
}) => {
  return (
    <div className={styles.container}>
      {videoUrl && <video src={videoUrl} autoPlay className={styles.video} />}
      <aside className={styles.listPanel}>
        <h2 className={styles.heading}>Eliminated</h2>
        {eliminatedPlayers.length > 0 ? (
          <ul className={styles.list}>
            {eliminatedPlayers.map((p) => (
              <li key={p.id}>{p.username}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.none}>No eliminations</p>
        )}
      </aside>
      {isEliminated && <div className={styles.banner}>YOU ARE ELIMINATED</div>}
    </div>
  );
};

export default IntermissionElims;
