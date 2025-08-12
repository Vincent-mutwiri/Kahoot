import { connectToDatabase } from '../../lib/db/mongodb.js';
import { Game } from '../../lib/models/Game.js';

export async function handle(request: Request): Promise<Response> {
  try {
    const { gameCode, hostName, videoType, url } = await request.json();

    if (!['elimination', 'survivor', 'redemption'].includes(videoType)) {
      return new Response(JSON.stringify({ error: 'Invalid video type' }), { status: 400 });
    }

    await connectToDatabase();

    const fieldToUpdate = `${videoType}VideoUrl`;
    
    const game = await Game.findOneAndUpdate(
      { code: gameCode, hostName },
      { $set: { [fieldToUpdate]: url } },
      { new: true }
    );

    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error setting sequence video:', error);
    return new Response(JSON.stringify({ error: 'Failed to set video URL' }), { status: 500 });
  }
}