import { connectToDatabase } from '../../lib/db/mongodb.js';
import { GlobalSettings } from '../../lib/models/GlobalSettings.js';

export async function handle(request: Request): Promise<Response> {
  try {
    const { videoType, url } = await request.json();

    if (!['elimination', 'survivor', 'redemption'].includes(videoType)) {
      return new Response(JSON.stringify({ error: 'Invalid video type' }), { status: 400 });
    }

    await connectToDatabase();

    const fieldToUpdate = `${videoType}VideoUrl`;
    
    await GlobalSettings.findOneAndUpdate(
      { settingType: 'default_videos' },
      { $set: { [fieldToUpdate]: url } },
      { upsert: true, new: true }
    );

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error setting global video:', error);
    return new Response(JSON.stringify({ error: 'Failed to set global video' }), { status: 500 });
  }
}