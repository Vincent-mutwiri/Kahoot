import { connectToDatabase } from '../../lib/db/mongodb.js';
import { GlobalQuestion } from '../../lib/models/GlobalQuestion.js';

export async function handle(request: Request): Promise<Response> {
  try {
    await connectToDatabase();

    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const difficulty = url.searchParams.get('difficulty');

    const filter: any = { isPublic: true };
    if (category && category !== 'All') filter.category = category;
    if (difficulty && difficulty !== 'All') filter.difficulty = difficulty;

    const questions = await GlobalQuestion.find(filter)
      .sort({ createdAt: -1 })
      .select('_id questionText category difficulty createdBy createdAt');

    return new Response(JSON.stringify({ questions }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting global questions:', error);
    return new Response(JSON.stringify({ error: 'Failed to get questions' }), { status: 500 });
  }
}