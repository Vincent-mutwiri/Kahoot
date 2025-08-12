import React from 'react';
import styles from './RoundResultsModal.module.css';

type Player = { id: number | string; username: string };

interface RoundResultsModalProps {
  survivors: Player[];
  eliminated: Player[];
}

export const RoundResultsModal: React.FC<RoundResultsModalProps> = ({
  survivors,
  eliminated,
}) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Round Results</h2>
        <div className={styles.columns}>
          <div className={styles.column}>
            <h3>Survivors</h3>
            <ul>
              {survivors.map((p) => (
                <li key={p.id}>{p.username}</li>
              ))}
            </ul>
          </div>
          <div className={styles.column}>
            <h3>Eliminated</h3>
            <ul>
              {eliminated.map((p) => (
                <li key={p.id}>{p.username}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoundResultsModal;
