import React, { useEffect, useState } from 'react';
import type { Selectable } from 'kysely';
import type { Players } from '../helpers/schema';
import { Badge } from './Badge';
import { User, UserX, Crown } from 'lucide-react';
import { toast } from 'sonner';
import styles from './PlayerList.module.css';

interface PlayerListProps {
  players: Pick<Selectable<Players>, 'id' | 'username' | 'status'>[];
}

export const PlayerList: React.FC<PlayerListProps> = ({ players }) => {
  const [previousPlayers, setPreviousPlayers] = useState<typeof players>([]);
  const [eliminatedPlayers, setEliminatedPlayers] = useState<Set<number>>(new Set());

  // Track eliminations for spectator notifications
  useEffect(() => {
    if (previousPlayers.length > 0) {
      const newlyEliminated = players.filter(player => {
        const previousPlayer = previousPlayers.find(p => p.id === player.id);
        return previousPlayer && 
               previousPlayer.status === 'active' && 
               player.status === 'eliminated';
      });

      newlyEliminated.forEach(player => {
        // Show toast notification for eliminations
        toast.error(`${player.username} eliminated!`, {
          description: "Another player has been eliminated from the game.",
          duration: 3000,
        });

        // Add to eliminated set for animation
        setEliminatedPlayers(prev => new Set(prev).add(player.id));
        
        // Remove from eliminated set after animation
        setTimeout(() => {
          setEliminatedPlayers(prev => {
            const newSet = new Set(prev);
            newSet.delete(player.id);
            return newSet;
          });
        }, 1000);
      });
    }
    setPreviousPlayers(players);
  }, [players, previousPlayers]);

  const sortedPlayers = [...players].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return a.username.localeCompare(b.username);
  });

  const getStatusBadge = (status: Selectable<Players>['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'eliminated':
        return <Badge variant="destructive">Eliminated</Badge>;
      case 'redeemed':
        return <Badge variant="secondary">Redeemed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: Selectable<Players>['status']) => {
    switch (status) {
      case 'active':
        return <User className={styles.activeIcon} size={18} />;
      case 'eliminated':
        return <UserX className={styles.eliminatedIcon} size={18} />;
      default:
        return <User className={styles.defaultIcon} size={18} />;
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        <Crown size={20} />
        Players ({players.length})
      </h3>
      <ul className={styles.list}>
        {sortedPlayers.map(player => (
          <li 
            key={player.id} 
            className={`${styles.playerItem} ${styles[player.status]} ${
              eliminatedPlayers.has(player.id) ? styles.eliminationAnimation : ''
            }`}
          >
            <div className={styles.playerInfo}>
              {getStatusIcon(player.status)}
              <span className={styles.username}>{player.username}</span>
            </div>
            {getStatusBadge(player.status)}
          </li>
        ))}
      </ul>
    </div>
  );
};