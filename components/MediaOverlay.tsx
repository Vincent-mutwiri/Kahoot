import React from 'react';
import styles from './MediaOverlay.module.css';

interface MediaOverlayProps {
  mediaUrl: string | null;
  onClose: () => void;
}

export const MediaOverlay: React.FC<MediaOverlayProps> = ({ mediaUrl, onClose }) => {
  if (!mediaUrl) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content}>
        <img src={mediaUrl} alt="Media Overlay" />
      </div>
    </div>
  );
};