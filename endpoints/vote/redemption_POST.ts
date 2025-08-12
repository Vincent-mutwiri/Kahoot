import { connectToDatabase } from '../../lib/db/mongodb.js';
import { Game } from '../../lib/models/Game.js';
import { Player } from '../../lib/models/Player.js';
import { RedemptionRound } from '../../lib/models/RedemptionRound.js';

export async function handle(request: Request): Promise<Response> {
  try {
    const { gameCode, voterUsername, targetPlayerId } = await request.json();

    await connectToDatabase();

    const game = await Game.findOne({ code: gameCode });
    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), { status: 404 });
    }

    const voter = await Player.findOne({ gameId: game._id, username: voterUsername, status: 'active' });
    if (!voter) {
      return new Response(JSON.stringify({ error: 'Only active players can vote' }), { status: 403 });
    }

    const targetPlayer = await Player.findById(targetPlayerId);
    if (!targetPlayer || targetPlayer.status !== 'eliminated' || targetPlayer.eliminatedRound !== game.currentQuestionIndex) {
      return new Response(JSON.stringify({ error: 'Invalid target player' }), { status: 400 });
    }

    // Find or create redemption round
    let redemptionRound = await RedemptionRound.findOne({ 
      gameId: game._id, 
      roundNumber: game.currentQuestionIndex 
    });

    if (!redemptionRound) {
      redemptionRound = new RedemptionRound({
        gameId: game._id,
        roundNumber: game.currentQuestionIndex,
        votes: []
      });
    }

    // Remove existing vote from this voter
    redemptionRound.votes = redemptionRound.votes.filter(vote => !vote.voterId.equals(voter._id));
    
    // Add new vote
    redemptionRound.votes.push({
      voterId: voter._id,
      targetPlayerId: targetPlayer._id
    });

    await redemptionRound.save();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing redemption vote:', error);
    return new Response(JSON.stringify({ error: 'Failed to process vote' }), { status: 500 });
  }
}