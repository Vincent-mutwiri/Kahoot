import { connectToDatabase } from '../../lib/db/mongodb.js';
import { Game } from '../../lib/models/Game.js';
import { Player } from '../../lib/models/Player.js';
import { RedemptionRound } from '../../lib/models/RedemptionRound.js';

export async function handle(request: Request): Promise<Response> {
  try {
    const { gameCode, hostName } = await request.json();

    await connectToDatabase();

    const game = await Game.findOne({ code: gameCode, hostName });
    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), { status: 404 });
    }

    const redemptionRound = await RedemptionRound.findOne({
      gameId: game._id,
      roundNumber: game.currentQuestionIndex
    });

    let redeemedPlayer = null;

    if (redemptionRound && redemptionRound.votes.length > 0) {
      // Count votes
      const voteCounts = new Map();
      redemptionRound.votes.forEach(vote => {
        const playerId = vote.targetPlayerId.toString();
        voteCounts.set(playerId, (voteCounts.get(playerId) || 0) + 1);
      });

      // Find player with most votes
      let maxVotes = 0;
      let winningPlayerId = null;
      
      for (const [playerId, votes] of voteCounts) {
        if (votes > maxVotes) {
          maxVotes = votes;
          winningPlayerId = playerId;
        }
      }

      if (winningPlayerId) {
        redeemedPlayer = await Player.findById(winningPlayerId);
        if (redeemedPlayer) {
          redeemedPlayer.status = 'redeemed';
          await redeemedPlayer.save();
        }
      }
    }

    // Keep gameState consistent for clients
    game.gameState = 'question';
    await game.save();

    return new Response(JSON.stringify({ 
      success: true, 
      redeemedPlayer: redeemedPlayer ? {
        id: redeemedPlayer._id,
        username: redeemedPlayer.username
      } : null
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error ending redemption:', error);
    return new Response(JSON.stringify({ error: 'Failed to end redemption' }), { status: 500 });
  }
}