import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Loader, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import styles from './ConnectionStatus.module.css';

type ConnectionStatusType = 'connected' | 'connecting' | 'disconnected' | 'error';

interface ConnectionStatusProps {
  /** The current status of the connection. */
  connectionStatus: ConnectionStatusType;
  /** A callback function to trigger a reconnection attempt. */
  onReconnect: () => void;
  /** The timestamp of the last successful data update. */
  lastUpdated?: Date;
  /** Optional additional class names for styling. */
  className?: string;
}

const STATUS_CONFIG = {
  connected: {
    icon: Wifi,
    text: 'Connected',
    colorClass: styles.connected,
  },
  connecting: {
    icon: Loader,
    text: 'Connecting...',
    colorClass: styles.connecting,
  },
  disconnected: {
    icon: WifiOff,
    text: 'Disconnected',
    colorClass: styles.disconnected,
  },
  error: {
    icon: AlertTriangle,
    text: 'Connection Error',
    colorClass: styles.error,
  },
};

const useTimeAgo = (date?: Date): string => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!date) {
      setTimeAgo('');
      return;
    }

    const update = () => {
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      if (seconds < 5) {
        setTimeAgo('just now');
      } else if (seconds < 60) {
        setTimeAgo(`${seconds}s ago`);
      } else {
        setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
      }
    };

    update();
    const intervalId = setInterval(update, 5000); // Update every 5 seconds

    return () => clearInterval(intervalId);
  }, [date]);

  return timeAgo;
};

export const ConnectionStatus = ({
  connectionStatus,
  onReconnect,
  lastUpdated,
  className,
}: ConnectionStatusProps) => {
  const config = STATUS_CONFIG[connectionStatus];
  const Icon = config.icon;
  const timeAgo = useTimeAgo(lastUpdated);

  const showReconnectButton = connectionStatus === 'disconnected' || connectionStatus === 'error';

  return (
    <div className={`${styles.container} ${config.colorClass} ${className || ''}`}>
      <div className={styles.statusIndicator}>
        <Icon
          size={16}
          className={`${styles.icon} ${connectionStatus === 'connecting' ? styles.pulsing : ''}`}
        />
        <span className={styles.statusText}>{config.text}</span>
      </div>

      {connectionStatus === 'connected' && lastUpdated && (
        <span className={styles.lastUpdated}>
          (updated {timeAgo})
        </span>
      )}

      {showReconnectButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReconnect}
          className={styles.reconnectButton}
        >
          <RefreshCw size={14} />
          Reconnect
        </Button>
      )}
    </div>
  );
};