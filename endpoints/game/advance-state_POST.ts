import { connectToDatabase } from '../../lib/db/mongodb.js';
import { Game } from '../../lib/models/Game.js';
import { Player } from '../../lib/models/Player.js';

export async function handle(request: Request): Promise<Response> {
  try {
    const { gameCode, hostName, newState } = await request.json();

    await connectToDatabase();

    const game = await Game.findOne({ code: gameCode, hostName });
    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), { status: 404 });
    }

    // Handle state-specific logic
    if (newState === 'elimination') {
      // Find players who didn't answer correctly and eliminate them
      const players = await Player.find({ gameId: game._id, status: 'active' });
      const eliminatedPlayers = [];
      
      for (const player of players) {
        // Logic to check if player answered correctly would go here
        // For now, we'll assume this is handled in the answer endpoint
      }
    }

    game.gameState = newState;
    await game.save();

    return new Response(JSON.stringify({ success: true, gameState: newState }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error advancing game state:', error);
    return new Response(JSON.stringify({ error: 'Failed to advance game state' }), { status: 500 });
  }
}