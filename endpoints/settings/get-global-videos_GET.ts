import { connectToDatabase } from '../../lib/db/mongodb.js';
import { GlobalSettings } from '../../lib/models/GlobalSettings.js';

export async function handle(request: Request): Promise<Response> {
  try {
    await connectToDatabase();

    let settings = await GlobalSettings.findOne({ settingType: 'default_videos' });
    
    if (!settings) {
      settings = new GlobalSettings({
        settingType: 'default_videos',
        eliminationVideoUrl: '',
        survivorVideoUrl: '',
        redemptionVideoUrl: ''
      });
      await settings.save();
    }

    return new Response(JSON.stringify({
      eliminationVideoUrl: settings.eliminationVideoUrl,
      survivorVideoUrl: settings.survivorVideoUrl,
      redemptionVideoUrl: settings.redemptionVideoUrl
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting global videos:', error);
    return new Response(JSON.stringify({ error: 'Failed to get global videos' }), { status: 500 });
  }
}