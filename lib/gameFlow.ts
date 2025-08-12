import { Game } from './models/Game.js';
import { broadcastToGame } from './websocket.js';
import { Game } from './models/Game.js';
import { RedemptionRound } from './models/RedemptionRound.js';
import { Player } from './models/Player.js';

const TIMERS = {
  QUESTION_DURATION: 30000, // 30 seconds
  ELIMINATION_VIDEO: 5000,  // 5 seconds
  SURVIVORS_VIDEO: 3000,    // 3 seconds
  REDEMPTION_VIDEO: 2000,   // 2 seconds
  VOTING_DURATION: 20000,   // 20 seconds
};

export async function startAutoFlow(gameCode: string) {
  const game = await Game.findOne({ code: gameCode });
  if (!game || game.status !== 'active') return;

  // Start question timer
  setTimeout(() => autoRevealAnswer(gameCode), TIMERS.QUESTION_DURATION);
}

async function autoRevealAnswer(gameCode: string) {
  const game = await Game.findOne({ code: gameCode });
  if (!game || game.status !== 'active') return;

  broadcastToGame(gameCode, { type: 'REVEAL_ANSWER', gameCode });
  
  // Auto advance to elimination
  setTimeout(() => autoAdvanceToElimination(gameCode), 2000);
}

async function autoAdvanceToElimination(gameCode: string) {
  const game = await Game.findOne({ code: gameCode });
  if (!game) return;

  game.gameState = 'elimination';
  await game.save();
  broadcastToGame(gameCode, { type: 'GAME_STATE_CHANGED', gameCode, gameState: 'elimination' });
  
  // Auto advance to survivors
  setTimeout(() => autoAdvanceToSurvivors(gameCode), TIMERS.ELIMINATION_VIDEO);
}

async function autoAdvanceToSurvivors(gameCode: string) {
  const game = await Game.findOne({ code: gameCode });
  if (!game) return;

  game.gameState = 'survivors';
  await game.save();
  broadcastToGame(gameCode, { type: 'GAME_STATE_CHANGED', gameCode, gameState: 'survivors' });
  
  // Auto advance to redemption
  setTimeout(() => autoAdvanceToRedemption(gameCode), TIMERS.SURVIVORS_VIDEO);
}

async function autoAdvanceToRedemption(gameCode: string) {
  const game = await Game.findOne({ code: gameCode });
  if (!game) return;

  game.gameState = 'redemption';
  await game.save();
  broadcastToGame(gameCode, { type: 'GAME_STATE_CHANGED', gameCode, gameState: 'redemption' });
  
  // Auto start voting
  setTimeout(() => autoStartVoting(gameCode), TIMERS.REDEMPTION_VIDEO);
}

async function autoStartVoting(gameCode: string) {
  // Start voting round automatically by creating a RedemptionRound
  const game = await Game.findOne({ code: gameCode });
  if (!game) return;

  // Find players eliminated in the current round
  const eligiblePlayers = await Player.find({
    gameId: game._id,
    status: 'eliminated',
    eliminatedRound: game.currentQuestionIndex,
  });

  if (eligiblePlayers.length === 0) {
    // No voting needed; proceed to next question timer
    setTimeout(() => autoNextQuestion(gameCode), TIMERS.VOTING_DURATION);
    return;
  }

  const endsAt = new Date(Date.now() + TIMERS.VOTING_DURATION);
  const round = new RedemptionRound({
    gameId: game._id,
    questionIndex: game.currentQuestionIndex,
    status: 'active',
    endsAt,
  });
  await round.save();

  // Broadcast with roundId so clients can open modal
  broadcastToGame(gameCode, { type: 'VOTING_STARTED', gameCode, roundId: round._id.toString() });
  
  // Auto end voting and continue to next question
  setTimeout(() => autoNextQuestion(gameCode), TIMERS.VOTING_DURATION);
}

async function autoNextQuestion(gameCode: string) {
  const game = await Game.findOne({ code: gameCode });
  if (!game) return;

  // If there is an active redemption round for the current question, end it automatically
  const activeRound = await RedemptionRound.findOne({
    gameId: game._id,
    questionIndex: game.currentQuestionIndex,
    status: 'active',
  });

  if (activeRound) {
    // Tally votes
    const voteCounts = await (await import('./models/Vote.js')).Vote.aggregate([
      { $match: { redemptionRoundId: activeRound._id } },
      { $group: { _id: '$votedForPlayerId', votes: { $sum: 1 } } },
      { $sort: { votes: -1, _id: 1 } },
    ]);

    const winnerVote = voteCounts.length > 0 ? voteCounts[0] : null;
    const winnerId = winnerVote ? winnerVote._id : null;

    if (winnerId) {
      const updatedPlayer = await Player.findOneAndUpdate(
        { _id: winnerId, gameId: game._id },
        { $set: { status: 'active', eliminatedRound: null } },
        { new: true }
      );
      if (updatedPlayer) {
        // Increase prize pot
        game.currentPrizePot += game.prizePotIncrement;
        await game.save();
      }
    }

    activeRound.status = 'completed';
    activeRound.redeemedPlayerId = winnerId;
    await activeRound.save();

    // Notify clients voting has ended
    broadcastToGame(gameCode, { type: 'VOTING_ENDED', gameCode, roundId: activeRound._id.toString(), redeemedPlayerId: winnerId ? winnerId.toString() : null });
  }

  game.currentQuestionIndex = (game.currentQuestionIndex || 0) + 1;
  game.gameState = 'question';
  game.updatedAt = new Date();
  await game.save();

  broadcastToGame(gameCode, { type: 'NEXT_QUESTION', gameCode });
  broadcastToGame(gameCode, { type: 'GAME_STATE_CHANGED', gameCode, gameState: 'question' });
  
  // Start the cycle again
  setTimeout(() => autoRevealAnswer(gameCode), TIMERS.QUESTION_DURATION);
}