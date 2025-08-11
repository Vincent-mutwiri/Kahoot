import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './Dialog';
import { Button } from './Button';
import { Progress } from './Progress';
import { Avatar, AvatarFallback } from './Avatar';
import { Skeleton } from './Skeleton';
import { useVoteState, useCastVoteMutation, useEndVotingMutation } from '../helpers/voteQueries';
import { Crown, Vote, CheckCircle2, XCircle } from 'lucide-react';
import styles from './VotingModal.module.css';
import { toast } from 'sonner';
import { OutputType as VoteState } from '../endpoints/vote/state_GET.schema';

const VOTE_DURATION_SECONDS = 20;

interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  roundId: number;
  gameCode: string;
  currentPlayerId: number;
  isHost: boolean;
  canVote: boolean;
  className?: string;
}

export const VotingModal: React.FC<VotingModalProps> = ({
  isOpen,
  onClose,
  roundId,
  gameCode,
  currentPlayerId,
  isHost,
  canVote,
  className,
}) => {
  const [timeLeft, setTimeLeft] = useState(VOTE_DURATION_SECONDS);
  const [votedForPlayerId, setVotedForPlayerId] = useState<number | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const { data: voteState, isLoading, error } = useVoteState(
    { roundId },
    { enabled: isOpen && roundId > 0 }
  );

  const castVoteMutation = useCastVoteMutation();
  const endVotingMutation = useEndVotingMutation();

  const isVotingActive = voteState?.status === 'active' && timeLeft > 0;
  const isVotingComplete = voteState?.status === 'completed';

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens for a new round
      setVotedForPlayerId(null);
      setIsClosing(false);
      if (voteState?.timeRemaining) {
        setTimeLeft(voteState.timeRemaining);
      }
    }
  }, [isOpen, roundId, voteState?.timeRemaining]);

  useEffect(() => {
    if (!isVotingActive || !isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVotingActive, isOpen]);

  // Automatically end voting for host when timer runs out
  useEffect(() => {
    if (timeLeft === 0 && isHost && voteState?.status === 'active') {
      endVotingMutation.mutate({ roundId, hostName: 'host', gameCode }); // Assuming a placeholder for hostName
    }
  }, [timeLeft, isHost, voteState?.status, roundId, gameCode, endVotingMutation]);

  // Automatically close modal after results are shown
  useEffect(() => {
    if (isVotingComplete && !isClosing) {
      setIsClosing(true);
      const closeTimer = setTimeout(() => {
        onClose();
      }, 5000); // Close after 5 seconds
      return () => clearTimeout(closeTimer);
    }
  }, [isVotingComplete, onClose, isClosing]);

  const handleVote = (candidateId: number) => {
    if (!canVote || votedForPlayerId !== null || !isVotingActive) return;

    setVotedForPlayerId(candidateId);
    castVoteMutation.mutate(
      {
        roundId,
        voterPlayerId: currentPlayerId,
        votedForPlayerId: candidateId,
        gameCode,
      },
      {
        onSuccess: () => {
          toast.success('Your vote has been cast!');
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : 'Failed to cast vote.');
          setVotedForPlayerId(null); // Re-enable voting on error
        },
      }
    );
  };

  const totalVotes = useMemo(() => {
    return voteState?.voteTallies.reduce((sum, tally) => sum + tally.votes, 0) || 0;
  }, [voteState?.voteTallies]);

  const redeemedPlayer = useMemo(() => {
    if (!isVotingComplete || !endVotingMutation.data?.redeemedPlayer) return null;
    return endVotingMutation.data.redeemedPlayer;
  }, [isVotingComplete, endVotingMutation.data]);

  const renderContent = () => {
    if (isLoading) return <VotingSkeleton />;
    if (error) return <div className={styles.errorState}><XCircle /> {error.message}</div>;
    if (!voteState) return <VotingSkeleton />;

    if (isVotingComplete) {
      return <VotingResults voteState={voteState} redeemedPlayer={redeemedPlayer} />;
    }

    return (
      <>
        <DialogHeader>
          <DialogTitle>Redemption Round</DialogTitle>
          <DialogDescription>
            {canVote ? 'Vote to bring one player back into the game. You only get one vote!' : 'The survivors are voting to redeem an eliminated player.'}
          </DialogDescription>
        </DialogHeader>

        <div className={styles.timerContainer}>
          <Progress value={(timeLeft / VOTE_DURATION_SECONDS) * 100} className={styles.timerProgress} />
          <span className={styles.timerText}>{timeLeft}s</span>
        </div>

        <div className={styles.candidatesList}>
          {voteState.eligibleCandidates.map((candidate) => {
            const tally = voteState.voteTallies.find(t => t.playerId === candidate.id);
            const votes = tally?.votes || 0;
            const votePercentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
            const hasVotedForThisPlayer = votedForPlayerId === candidate.id;

            return (
              <div key={candidate.id} className={`${styles.candidateItem} ${hasVotedForThisPlayer ? styles.votedFor : ''}`}>
                <Avatar>
                  <AvatarFallback>{candidate.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className={styles.candidateInfo}>
                  <span className={styles.candidateName}>{candidate.username}</span>
                  <div className={styles.voteBarContainer}>
                    <Progress value={votePercentage} className={styles.voteBar} />
                    <span className={styles.voteCount}>{votes} {votes === 1 ? 'vote' : 'votes'}</span>
                  </div>
                </div>
                {canVote && (
                  <Button
                    size="sm"
                    onClick={() => handleVote(candidate.id)}
                    disabled={!isVotingActive || votedForPlayerId !== null || castVoteMutation.isPending}
                    className={styles.voteButton}
                  >
                    {hasVotedForThisPlayer ? <CheckCircle2 /> : <Vote />}
                    <span>{hasVotedForThisPlayer ? 'Voted' : 'Vote'}</span>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${styles.dialogContent} ${className || ''}`}>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

const VotingSkeleton = () => (
  <div className={styles.skeletonContainer}>
    <Skeleton style={{ height: '2rem', width: '60%', marginBottom: 'var(--spacing-2)' }} />
    <Skeleton style={{ height: '1rem', width: '80%', marginBottom: 'var(--spacing-6)' }} />
    <Skeleton style={{ height: '1.5rem', width: '100%', marginBottom: 'var(--spacing-4)' }} />
    {[...Array(3)].map((_, i) => (
      <div key={i} className={styles.candidateItem}>
        <Skeleton style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-full)' }} />
        <div className={styles.candidateInfo}>
          <Skeleton style={{ height: '1rem', width: '100px', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ height: '0.75rem', width: '100%' }} />
        </div>
        <Skeleton style={{ height: '2rem', width: '5rem' }} />
      </div>
    ))}
  </div>
);

const VotingResults: React.FC<{ voteState: VoteState; redeemedPlayer: { username: string } | null }> = ({ voteState, redeemedPlayer }) => {
  const sortedTallies = [...voteState.voteTallies].sort((a, b) => b.votes - a.votes);

  return (
    <div className={styles.resultsContainer}>
      <DialogHeader>
        <DialogTitle>Voting Complete</DialogTitle>
      </DialogHeader>
      {redeemedPlayer ? (
        <div className={styles.redeemedAnnouncement}>
          <Crown className={styles.redeemedIcon} />
          <p>
            <span className={styles.redeemedName}>{redeemedPlayer.username}</span> has been redeemed!
          </p>
        </div>
      ) : (
        <div className={styles.redeemedAnnouncement}>
          <XCircle className={styles.noRedeemedIcon} />
          <p>No player was redeemed.</p>
        </div>
      )}
      <div className={styles.finalTallies}>
        <h3 className={styles.finalTalliesTitle}>Final Vote Counts</h3>
        {sortedTallies.map((tally, index) => (
          <div key={tally.playerId} className={styles.tallyItem}>
            <span className={styles.tallyRank}>{index + 1}.</span>
            <span className={styles.tallyName}>{tally.username}</span>
            <span className={styles.tallyVotes}>{tally.votes} {tally.votes === 1 ? 'vote' : 'votes'}</span>
          </div>
        ))}
      </div>
      <DialogFooter className={styles.resultsFooter}>
        <p>Returning to game...</p>
      </DialogFooter>
    </div>
  );
};