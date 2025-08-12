import { connectToDatabase } from '../../lib/db/mongodb.js';
import { GlobalQuestion } from '../../lib/models/GlobalQuestion.js';

export async function handle(request: Request): Promise<Response> {
  try {
    const { questionText, answers, correctAnswerIndex, mediaUrl, category, difficulty, createdBy } = await request.json();

    await connectToDatabase();

    const globalQuestion = new GlobalQuestion({
      questionText,
      answers,
      correctAnswerIndex,
      mediaUrl,
      category: category || 'General',
      difficulty: difficulty || 'Medium',
      createdBy,
      isPublic: true
    });

    await globalQuestion.save();

    return new Response(JSON.stringify({ success: true, questionId: globalQuestion._id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error saving global question:', error);
    return new Response(JSON.stringify({ error: 'Failed to save question' }), { status: 500 });
  }
}