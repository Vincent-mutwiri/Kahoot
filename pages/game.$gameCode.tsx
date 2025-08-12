import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { usePlayerConnection } from '../helpers/usePlayerConnection';
import { usePlayerHideMediaMutation } from '../helpers/playerQueries';
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
import styles from './game.$gameCode.module.css';

const GamePage: React.FC = () => {
  const { gameCode } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const [activeVotingRoundId, setActiveVotingRoundId] = useState<number | null>(null);
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

  useEffect(() => {
    if (!data) {
      return;
    }
    const { game, players } = data;
    // Look for any recent eliminations that might trigger a voting round
    // This is a simplified check - in practice, the backend should provide voting round info
    const recentlyEliminatedPlayers = players.filter(p => p.status === 'eliminated' && p.eliminatedRound === game.currentQuestionIndex);
    const hasRecentEliminations = recentlyEliminatedPlayers.length > 0;
    
    // For now, we'll simulate checking for an active voting round
    // In the real implementation, this data should come from the game state
    if (hasRecentEliminations && game.status === 'active') {
      // Simulate a voting round ID based on current question
      const simulatedRoundId = (game.currentQuestionIndex || 0) * 1000 + game.id;
      setActiveVotingRoundId(simulatedRoundId);
      setIsVotingModalOpen(true);
    } else {
      setActiveVotingRoundId(null);
      setIsVotingModalOpen(false);
    }
  }, [data, setActiveVotingRoundId, setIsVotingModalOpen]);

  const handleJoin = (newUsername: string) => {
    localStorage.setItem(`lps_username_${gameCode!}`, newUsername);
    setUsername(newUsername);
  };

  const handleHideMedia = () => {
    if (gameCode) {
      hideMediaMutation.mutate({ gameCode });
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

    

    // Winner State
    if (game.status === 'finished' && player.status === 'active') {
      return <WinnerView prize={game.currentPrizePot} />;
    }

    // Eliminated State
    if (player.status === 'eliminated') {
      return <EliminatedView game={game} players={players} currentQuestion={currentQuestion} />;
    }

    // Lobby State
    if (game.status === 'lobby') {
      return <LobbyView game={game} players={players} />;
    }

    // Active Question State
    if (game.status === 'active' && currentQuestion) {
      return <QuestionView 
        game={game} 
        player={player} 
        players={players} 
        currentQuestion={currentQuestion} 
        questionStartTimeMs={questionStartTimeMs || null} 
      />;
    }

    // Fallback / Waiting for next question
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

        {/* Voting Modal Overlay */}
        {data && activeVotingRoundId && (
          <VotingModal
            isOpen={isVotingModalOpen}
            onClose={() => setIsVotingModalOpen(false)}
            roundId={activeVotingRoundId}
            gameCode={gameCode!}
            currentPlayerId={data.player.id}
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