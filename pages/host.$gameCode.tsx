import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useGameInfoRealtime } from '../helpers/gameQueries';
import {
  useStartGame,
  useNextQuestion,
  useRevealAnswer,
  useEndGame,
  useShowMedia,
  useHideMedia,
  usePlaySound,
} from '../helpers/hostQueries';
import {
  useStartVotingMutation,
  useEndVotingMutation,
  useVoteState,
} from '../helpers/voteQueries';
import { VotingModal } from '../components/VotingModal';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Separator } from '../components/Separator';
import { Skeleton } from '../components/Skeleton';
import { Spinner } from '../components/Spinner';
import { QuestionManager } from '../components/QuestionManager';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { FileDropzone } from '../components/FileDropzone';
import {
  Play,
  Square,
  Eye,
  Crown,
  Film,
  Volume2,
  Music,
  Trophy,
  Users,
  UserX,
  ClipboardCopy,
  AlertTriangle,
  Vote,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import styles from './host.$gameCode.module.css';
import type { Selectable } from 'kysely';
import type { Players, Games } from '../helpers/schema';

const HOST_NAME_STORAGE_KEY = 'lps_host_name';

interface GameOverviewProps {
  game: Selectable<Games>;
}

const GameOverview = ({ game }: GameOverviewProps) => {
  const copyGameCode = () => {
    navigator.clipboard.writeText(game.code);
    // Consider adding a toast notification here for user feedback
  };

  return (
    <div className={styles.overviewSection}>
      <div className={styles.overviewItem}>
        <h2 className={styles.squadaOne}>Game Code</h2>
        <div className={styles.gameCode}>
          <span>{game.code}</span>
          <Button variant="ghost" size="icon-sm" onClick={copyGameCode} aria-label="Copy game code">
            <ClipboardCopy size={16} />
          </Button>
        </div>
      </div>
      <div className={styles.overviewItem}>
        <h2 className={styles.squadaOne}>Prize Pot</h2>
        <p className={styles.prizePot}>${game.currentPrizePot.toLocaleString()}</p>
      </div>
      <div className={styles.overviewItem}>
        <h2 className={styles.squadaOne}>Status</h2>
        <Badge
          variant={
            game.status === 'active'
              ? 'success'
              : game.status === 'lobby'
                ? 'warning'
                : 'destructive'
          }
        >
          {game.status.toUpperCase()}
        </Badge>
      </div>
      <div className={styles.overviewItem}>
        <h2 className={styles.squadaOne}>Question</h2>
        <p className={styles.questionNumber}>
          {game.currentQuestionIndex !== null ? `#${game.currentQuestionIndex + 1}` : 'N/A'}
        </p>
      </div>
    </div>
  );
};

interface MasterControlsProps {
  game: Selectable<Games>;
  hostName: string;
  players: Selectable<Players>[];
  currentVotingRoundId: number | null;
  onStartVoting: (roundId: number) => void;
}

const MasterControls = ({ game, hostName, players, currentVotingRoundId, onStartVoting }: MasterControlsProps) => {
  const startGame = useStartGame();
  const nextQuestion = useNextQuestion();
  const revealAnswer = useRevealAnswer();
  const endGame = useEndGame();
  const startVoting = useStartVotingMutation();
  const endVoting = useEndVotingMutation();

  const advanceGameState = async (newState: string) => {
    try {
      await fetch('/_api/game/advance-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameCode: game.code, hostName, newState })
      });
    } catch (error) {
      console.error('Failed to advance game state:', error);
    }
  };

  const isLobby = game.status === 'lobby';
  const isActive = game.status === 'active';
  const isFinished = game.status === 'finished';

  // Check if there are any eliminated players from the current round
  const hasRecentEliminations = players.some(p => 
    p.status === 'eliminated' && 
    p.eliminatedRound === game.currentQuestionIndex
  );

  const isMutationPending =
    startGame.isPending ||
    nextQuestion.isPending ||
    revealAnswer.isPending ||
    endGame.isPending ||
    startVoting.isPending ||
    endVoting.isPending;

  const handleStartVoting = () => {
    startVoting.mutate(
      { gameCode: game.code, hostName },
      {
        onSuccess: (data) => {
          onStartVoting(data.roundId);
        },
      }
    );
  };

  const handleEndVoting = () => {
    if (currentVotingRoundId) {
      endVoting.mutate({ 
        roundId: currentVotingRoundId, 
        hostName, 
        gameCode: game.code 
      });
    }
  };

  return (
    <div className={styles.controlCard}>
      <h3 className={styles.squadaOne}>Master Controls</h3>
      <div className={styles.controlGrid}>
        <Button
          size="lg"
          onClick={() => startGame.mutate({ gameCode: game.code, hostName })}
          disabled={!isLobby || isMutationPending}
        >
          {startGame.isPending ? <Spinner /> : <Play />}
          Start Game
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => revealAnswer.mutate({ gameCode: game.code, hostName })}
          disabled={!isActive || isMutationPending}
        >
          {revealAnswer.isPending ? <Spinner /> : <Eye />}
          Reveal Answer
        </Button>
        {hasRecentEliminations && !currentVotingRoundId && (
          <Button
            size="lg"
            variant="outline"
            onClick={handleStartVoting}
            disabled={isMutationPending}
            className={styles.votingButton}
          >
            {startVoting.isPending ? <Spinner /> : <Vote />}
            Start Voting
          </Button>
        )}
        {currentVotingRoundId && (
          <Button
            size="lg"
            variant="outline"
            onClick={handleEndVoting}
            disabled={isMutationPending}
            className={styles.votingButton}
          >
            {endVoting.isPending ? <Spinner /> : <CheckCircle2 />}
            End Voting
          </Button>
        )}
        <Button
          size="lg"
          variant="secondary"
          onClick={() => nextQuestion.mutate({ gameCode: game.code, hostName })}
          disabled={!isActive || isMutationPending || currentVotingRoundId !== null}
        >
          {nextQuestion.isPending ? <Spinner /> : <Play />}
          Next Question
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => advanceGameState('elimination')}
          disabled={!isActive || isMutationPending}
        >
          Start Elimination
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => advanceGameState('survivors')}
          disabled={!isActive || isMutationPending}
        >
          Show Survivors
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => advanceGameState('leaderboard')}
          disabled={!isActive || isMutationPending}
        >
          Show Leaderboard
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => advanceGameState('redemption')}
          disabled={!isActive || isMutationPending}
        >
          Start Redemption
        </Button>
        <Button
          size="lg"
          variant="destructive"
          onClick={() => endGame.mutate({ gameCode: game.code, hostName })}
          disabled={isFinished || isMutationPending}
        >
          {endGame.isPending ? <Spinner /> : <Square />}
          End Game
        </Button>
      </div>
    </div>
  );
};

const PlayerList = ({ players }: { players: Selectable<Players>[] }) => {
  const activePlayers = players.filter(p => p.status === 'active' || p.status === 'redeemed');
  const eliminatedPlayers = players.filter(p => p.status === 'eliminated');

  return (
    <div className={styles.controlCard}>
      <h3 className={styles.squadaOne}>Player Management</h3>
      <div className={styles.playerListsContainer}>
        <div className={styles.playerList}>
          <h4 className={styles.playerListHeader}>
            <Users size={18} /> Active Players ({activePlayers.length})
          </h4>
          <ul>
            {activePlayers.map(player => (
              <li key={`active-${player.id}`} className={styles.playerItem}>
                <span>{player.username}</span>
                <Badge variant={player.status === 'redeemed' ? 'secondary' : 'success'}>
                  {player.status}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
        <Separator orientation="vertical" />
        <div className={styles.playerList}>
          <h4 className={styles.playerListHeader}>
            <UserX size={18} /> Eliminated Players ({eliminatedPlayers.length})
          </h4>
          <ul>
            {eliminatedPlayers.map(player => (
              <li key={`eliminated-${player.id}`} className={styles.playerItem}>
                <span>{player.username}</span>
                <Badge variant="destructive">{player.status}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

interface MediaControlsProps {
  gameCode: string;
  hostName: string;
}

const MediaControls = ({ gameCode, hostName }: MediaControlsProps) => {
  const [mediaUrl, setMediaUrl] = useState('');
  const showMedia = useShowMedia();
  const hideMedia = useHideMedia();

  const handleShowMedia = () => {
    if (mediaUrl) {
      showMedia.mutate({ gameCode, hostName, mediaUrl });
    }
  };

  const handleUploadComplete = async (fileUrl: string) => {
    try {
      await fetch('/_api/game/set-media-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameCode, hostName, mediaUrl: fileUrl }),
      });
      setMediaUrl(fileUrl);
    } catch (error) {
      console.error('Failed to set media URL:', error);
    }
  };

  const isMutationPending = showMedia.isPending || hideMedia.isPending;

  return (
    <div className={styles.controlCard}>
      <h3 className={styles.squadaOne}>Media Controls</h3>
      <div className={styles.mediaInputContainer}>
        <Input
          type="url"
          placeholder="Enter media URL or upload file below..."
          value={mediaUrl}
          onChange={e => setMediaUrl(e.target.value)}
          disabled={isMutationPending}
        />
        <Button onClick={handleShowMedia} disabled={!mediaUrl || isMutationPending}>
          {showMedia.isPending ? <Spinner size="sm" /> : <Film size={16} />}
          Show
        </Button>
        <Button
          variant="outline"
          onClick={() => hideMedia.mutate({ gameCode, hostName })}
          disabled={isMutationPending}
        >
          {hideMedia.isPending ? <Spinner size="sm" /> : 'Hide'}
        </Button>
      </div>
      <FileDropzone
        accept="image/*,video/*"
        maxSize={50 * 1024 * 1024}
        onUploadComplete={handleUploadComplete}
        title="Upload Image or Video"
        subtitle="Max 50MB - Images and videos only"
      />
    </div>
  );
};

interface SoundControlsProps {
  gameCode: string;
  hostName: string;
}

interface SequenceVideoControlsProps {
  gameCode: string;
  hostName: string;
}

const SequenceVideoControls = ({ gameCode, hostName }: SequenceVideoControlsProps) => {
  const [videoUrls, setVideoUrls] = useState({
    elimination: '',
    survivor: '',
    redemption: ''
  });

  useEffect(() => {
    const loadGlobalVideos = async () => {
      try {
        const response = await fetch('/_api/settings/get-global-videos');
        const data = await response.json();
        setVideoUrls({
          elimination: data.eliminationVideoUrl || '',
          survivor: data.survivorVideoUrl || '',
          redemption: data.redemptionVideoUrl || ''
        });
      } catch (error) {
        console.error('Failed to load global videos:', error);
      }
    };
    loadGlobalVideos();
  }, []);

  const handleUploadComplete = async (s3Url: string, videoType: 'elimination' | 'survivor' | 'redemption') => {
    try {
      await fetch('/_api/settings/set-global-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoType, url: s3Url }),
      });
      setVideoUrls(prev => ({ ...prev, [videoType]: s3Url }));
    } catch (error) {
      console.error('Failed to set global video:', error);
    }
  };

  return (
    <div className={styles.controlCard}>
      <h3 className={styles.squadaOne}>Global Sequence Videos</h3>
      <p style={{ marginBottom: 'var(--spacing-4)', color: 'var(--muted-foreground)' }}>These videos will be used for all games unless changed</p>
      <div className={styles.sequenceVideoGrid}>
        <div>
          <h4>Elimination Video</h4>
          <FileDropzone
            accept="video/*,image/*"
            maxSize={50 * 1024 * 1024}
            onUploadComplete={(url) => handleUploadComplete(url, 'elimination')}
            title="Upload Elimination Media"
            subtitle="Plays when players are eliminated"
          />
          {videoUrls.elimination && (
            <video src={videoUrls.elimination} controls className={styles.videoPreview} />
          )}
        </div>
        <div>
          <h4>Survivor Video</h4>
          <FileDropzone
            accept="video/*,image/*"
            maxSize={50 * 1024 * 1024}
            onUploadComplete={(url) => handleUploadComplete(url, 'survivor')}
            title="Upload Survivor Media"
            subtitle="Plays to show survivors"
          />
          {videoUrls.survivor && (
            <video src={videoUrls.survivor} controls className={styles.videoPreview} />
          )}
        </div>
        <div>
          <h4>Redemption Video</h4>
          <FileDropzone
            accept="video/*,image/*"
            maxSize={50 * 1024 * 1024}
            onUploadComplete={(url) => handleUploadComplete(url, 'redemption')}
            title="Upload Redemption Media"
            subtitle="Plays during voting phase"
          />
          {videoUrls.redemption && (
            <video src={videoUrls.redemption} controls className={styles.videoPreview} />
          )}
        </div>
      </div>
    </div>
  );
};

const SoundControls = ({ gameCode, hostName }: SoundControlsProps) => {
  const playSound = usePlaySound();
  const isMutationPending = playSound.isPending;

  const handlePlaySound = (soundId: string) => {
    playSound.mutate({ gameCode, hostName, soundId });
  };

  return (
    <div className={styles.controlCard}>
      <h3 className={styles.squadaOne}>Sound Triggers</h3>
      <div className={styles.soundButtons}>
        <Button
          variant="outline"
          onClick={() => handlePlaySound('elimination-sound')}
          disabled={isMutationPending}
        >
          <Volume2 size={16} /> Elimination
        </Button>
        <Button
          variant="outline"
          onClick={() => handlePlaySound('suspense-music')}
          disabled={isMutationPending}
        >
          <Music size={16} /> Suspense
        </Button>
        <Button
          variant="outline"
          onClick={() => handlePlaySound('victory-sound')}
          disabled={isMutationPending}
        >
          <Trophy size={16} /> Victory
        </Button>
      </div>
    </div>
  );
};

const HostDashboardSkeleton = () => (
  <div className={styles.container}>
    <div className={styles.header}>
      <Skeleton style={{ height: '3rem', width: '250px' }} />
    </div>
    <div className={styles.overviewSection}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className={styles.overviewItem}>
          <Skeleton style={{ height: '1.5rem', width: '100px', marginBottom: '0.5rem' }} />
          <Skeleton style={{ height: '2rem', width: '150px' }} />
        </div>
      ))}
    </div>
    <Separator />
    <div className={styles.mainContent}>
      <div className={styles.leftColumn}>
        <Skeleton style={{ height: '15rem', width: '100%' }} />
        <Skeleton style={{ height: '25rem', width: '100%' }} />
        <Skeleton style={{ height: '10rem', width: '100%' }} />
        <Skeleton style={{ height: '8rem', width: '100%' }} />
      </div>
      <div className={styles.rightColumn}>
        <Skeleton style={{ height: '30rem', width: '100%' }} />
      </div>
    </div>
  </div>
);

export default function HostDashboardPage() {
  const { gameCode } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const [hostName, setHostName] = useState<string | null>(null);
  const [currentVotingRoundId, setCurrentVotingRoundId] = useState<number | null>(null);

  useEffect(() => {
    const storedHostName = localStorage.getItem(HOST_NAME_STORAGE_KEY);
    if (storedHostName) {
      setHostName(storedHostName);
    } else {
      // If no host name, we can't authorize. Redirect to home.
      // A real app would have a proper auth flow.
      navigate('/');
    }
  }, [navigate]);

  const { 
    data, 
    isFetching, 
    error, 
    connectionStatus, 
    reconnect, 
    isConnected, 
    hasConnectionError 
  } = useGameInfoRealtime(
    { gameCode: gameCode! },
    { enabled: !!gameCode && !!hostName }
  );

  // Authorization check
  useEffect(() => {
    if (data && data.game.hostName !== hostName) {
      console.error("Unauthorized: You are not the host of this game.");
      navigate('/');
    }
  }, [data, hostName, navigate]);

  if (!gameCode || !hostName) {
    return <HostDashboardSkeleton />;
  }

  if (isFetching && !data) {
    return <HostDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className={`${styles.container} ${styles.errorContainer}`}>
        <AlertTriangle size={48} className={styles.errorIcon} />
        <h1 className={styles.squadaOne}>Error</h1>
        <p>Could not load game data.</p>
        <p className={styles.errorMessage}>
          {error instanceof Error ? error.message : 'An unknown error occurred.'}
        </p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  if (!data) {
    return <HostDashboardSkeleton />; // Should be covered by error state, but as a fallback
  }

  const { game, players } = data;

  return (
    <>
      <Helmet>
        <title>Host Dashboard - {gameCode}</title>
        <meta name="description" content={`Host controls for Last Player Standing game ${gameCode}.`} />
      </Helmet>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.squadaOne}>
            <Crown /> Host Dashboard
          </h1>
          <ConnectionStatus
            connectionStatus={connectionStatus}
            onReconnect={reconnect}
            lastUpdated={data?.game.updatedAt ? new Date(data.game.updatedAt) : undefined}
            className={styles.connectionStatus}
          />
        </header>
        <GameOverview game={game} />
        <Separator />
        <div className={styles.mainContent}>
          <div className={styles.leftColumn}>
            <MasterControls 
              game={game} 
              hostName={hostName} 
              players={players}
              currentVotingRoundId={currentVotingRoundId}
              onStartVoting={setCurrentVotingRoundId}
            />
            <QuestionManager
              gameCode={game.code}
              hostName={hostName}
              currentQuestionIndex={game.currentQuestionIndex}
              gameStatus={game.status}
            />
            <MediaControls gameCode={game.code} hostName={hostName} />
            <SequenceVideoControls gameCode={game.code} hostName={hostName} />
            <SoundControls gameCode={game.code} hostName={hostName} />
          </div>
          <div className={styles.rightColumn}>
            <PlayerList players={players} />
          </div>
        </div>
        
        {currentVotingRoundId && (
          <VotingModal
            isOpen={true}
            onClose={() => setCurrentVotingRoundId(null)}
            roundId={currentVotingRoundId}
            gameCode={gameCode}
            currentPlayerId={0} // Host doesn't have a player ID
            isHost={true}
            canVote={false} // Host cannot vote
            className={styles.hostVotingModal}
          />
        )}
      </div>
    </>
  );
}