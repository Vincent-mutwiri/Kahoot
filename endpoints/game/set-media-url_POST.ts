import { connectToDatabase } from '../../lib/db/mongodb.js';
import { Game } from '../../lib/models/Game.js';

export async function handle(request: Request): Promise<Response> {
  try {
    const { gameCode, hostName, mediaUrl } = await request.json();

    await connectToDatabase();

    const game = await Game.findOne({ gameCode, hostName });
    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), { status: 404 });
    }

    game.mediaUrl = mediaUrl;
    await game.save();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error setting media URL:', error);
    return new Response(JSON.stringify({ error: 'Failed to set media URL' }), { status: 500 });
  }
}