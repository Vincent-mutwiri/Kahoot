import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { usePlayerConnection } from '../helpers/usePlayerConnection';
import { usePlayerHideMediaMutation } from '../helpers/playerQueries';
import { useRoundFlow } from '../helpers/useRoundFlow';
import { VotingModal } from '../components/VotingModal';
import { GamePageSkeleton } from '../components/GamePageSkeleton';
import { LobbyView } from '../components/LobbyView';
import { QuestionView } from '../components/QuestionView';
import { EliminatedView } from '../components/EliminatedView';
import { WinnerView } from '../components/WinnerView';
import { JoinGamePrompt } from '../components/JoinGamePrompt';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { MediaOverlay } from '../components/MediaOverlay';
import { SoundPlayer } from '../components/SoundPlayer';
import { IntermissionElims } from '../components/IntermissionElims';
import { IntermissionSurv } from '../components/IntermissionSurv';
import { RoundResultsModal } from '../components/RoundResultsModal';
import styles from './game.$gameCode.module.css';

const GamePage: React.FC = () => {
  const { gameCode } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);

  const hideMediaMutation = usePlayerHideMediaMutation();

  useEffect(() => {
    if (!gameCode) {
      console.error("No game code provided, redirecting to home.");
      navigate('/');
      return;
    }
    const storedUsername = localStorage.getItem(`lps_username_${gameCode}`);
    setUsername(storedUsername);
  }, [gameCode, navigate]);

  const {
    data,
    isFetching,
    error,
    connectionStatus,
    lastUpdated,
    refetch
  } = usePlayerConnection(
    { gameCode: gameCode!, username: username! },
    { enabled: !!gameCode && !!username }
  );

  const { phase, votingRoundId } = useRoundFlow({
    gameCode: gameCode!,
    eliminationVideoUrl: data?.game.eliminationVideoUrl,
    onUpdate: refetch,
  });

  useEffect(() => {
    setIsVotingModalOpen(phase === 'Voting');
  }, [phase]);

  const handleJoin = (newUsername: string) => {
    localStorage.setItem(`lps_username_${gameCode!}`, newUsername);
    setUsername(newUsername);
  };

  const handleHideMedia = () => {
    if (gameCode && username) {
      hideMediaMutation.mutate({ gameCode, username });
    }
  };

  const getErrorMessage = (error: Error | null): { title: string; message: string; suggestion: string } | null => {
    if (!error) return null;
    
    const isConnectionError = error.message?.includes('fetch') || 
                           error.message?.includes('network') ||
                           error.message?.includes('Failed to');
    
    if (isConnectionError) {
      return {
        title: 'Connection Lost',
        message: 'Unable to reach the game server. Check your internet connection.',
        suggestion: 'Try refreshing the page or check your network connection.'
      };
    }
    
    if (error.message?.includes('Game not found')) {
      return {
        title: 'Game Not Found',
        message: 'This game may have ended or the code is incorrect.',
        suggestion: 'Please verify the game code or try joining a different game.'
      };
    }
    
    if (error.message?.includes('Player not found')) {
      return {
        title: 'Player Session Lost',
        message: 'Your player session has expired or been removed.',
        suggestion: 'Try rejoining the game with your username.'
      };
    }
    
    return {
      title: 'Connection Error',
      message: error.message,
      suggestion: 'The game may have ended or there may be a connection issue. Please try refreshing.'
    };
  };

  const renderContent = () => {
    if (!username) {
      return <JoinGamePrompt gameCode={gameCode!} onJoin={handleJoin} />;
    }

    if (isFetching && !data) {
      return <GamePageSkeleton />;
    }

    if (error && connectionStatus === 'error') {
      const errorInfo = getErrorMessage(error);
      if (errorInfo) {
        return (
          <div className={styles.errorContainer}>
            <h2 className={styles.errorTitle}>{errorInfo.title}</h2>
            <p className={styles.errorMessage}>{errorInfo.message}</p>
            <p className={styles.errorSuggestion}>{errorInfo.suggestion}</p>
          </div>
        );
      }
    }

    if (!data) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingContent}>
            <div className={styles.loadingSpinner}></div>
            <h2 className={styles.loadingTitle}>Connecting to Game...</h2>
            <p className={styles.loadingMessage}>Synchronizing with the game server</p>
          </div>
        </div>
      );
    }

    const { game, player, players, currentQuestion, questionStartTimeMs } = data;

    // Handle intermission and modal states
    if (phase === 'Intermission_Elims') {
      const isEliminated = player.status === 'eliminated' && 
                         player.eliminatedRound === game.currentQuestionIndex;
      return (
        <IntermissionElims
          videoUrl={game.eliminationVideoUrl}
          eliminatedPlayers={players.filter(p => 
            p.status === 'eliminated' && p.eliminatedRound === game.currentQuestionIndex
          )}
          isEliminated={isEliminated}
        />
      );
    }

    if (phase === 'Intermission_Surv') {
      const survivors = players.filter(p => p.status === 'active' || p.status === 'redeemed');
      return (
        <IntermissionSurv
          videoUrl={game.survivorVideoUrl}
          survivors={survivors}
          prizePot={game.currentPrizePot}
          everyoneSurvives={survivors.length === players.length}
        />
      );
    }

    if (phase === 'ResultsModal') {
      return (
        <RoundResultsModal
          survivors={players.filter(p => p.status === 'active' || p.status === 'redeemed')}
          eliminated={players.filter(p => p.status === 'eliminated')}
        />
      );
    }

    // Handle main game states
    if (game.status === 'lobby') {
      return <LobbyView game={game} players={players} />;
    }

    if (game.status === 'finished') {
      if (player.status === 'active') {
        return <WinnerView prize={game.currentPrizePot} />;
      }
      return <EliminatedView game={game} players={players} currentQuestion={currentQuestion} />;
    }

    // Handle question/answer flow
    if (phase === 'Question' && currentQuestion) {
      return (
        <QuestionView
          game={game}
          player={player}
          players={players}
          currentQuestion={currentQuestion}
          questionStartTimeMs={questionStartTimeMs || null}
          isSpectator={player.status === 'eliminated'}
        />
      );
    }

    // Default loading/transition state
    return (
      <div className={styles.centeredMessage}>
        <h2 className={styles.heading}>Waiting for the next round...</h2>
        <p>The host is preparing the next question.</p>
        {isFetching && (
          <div className={styles.subtleLoader}>
            <div className={styles.subtleSpinner}></div>
            <span>Syncing...</span>
          </div>
        )}
      </div>
    );
  };

  const shouldShowConnectionStatus = username && connectionStatus !== 'connecting';

  return (
    <>
      <Helmet>
        <title>{`Game ${gameCode || ''} | Last Player Standing`}</title>
        <meta name="description" content={`Playing Last Player Standing game ${gameCode}.`} />
      </Helmet>
      <main className={styles.container}>
        {shouldShowConnectionStatus && (
          <div className={styles.connectionStatusContainer}>
            <ConnectionStatus
              connectionStatus={connectionStatus}
              onReconnect={refetch}
              lastUpdated={lastUpdated || undefined}
              className={styles.connectionStatus}
            />
          </div>
        )}
        {renderContent()}
        
        {data && <MediaOverlay mediaUrl={data.game.mediaUrl} onClose={handleHideMedia} />}
        {data && <SoundPlayer soundId={data.game.soundId} gameCode={gameCode!} />}

        {data && votingRoundId && (
          <VotingModal
            isOpen={isVotingModalOpen}
            onClose={() => setIsVotingModalOpen(false)}
            roundId={votingRoundId}
            gameCode={gameCode!}
            currentPlayerId={String(data.player.id)}
            isHost={false}
            canVote={data.player.status === 'active'}
            className={styles.votingModalOverlay}
          />
        )}
      </main>
    </>
  );
};

export default GamePage;