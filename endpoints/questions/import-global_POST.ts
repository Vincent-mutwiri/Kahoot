import { connectToDatabase } from '../../lib/db/mongodb.js';
import { GlobalQuestion } from '../../lib/models/GlobalQuestion.js';
import { Question } from '../../lib/models/Question.js';
import { Game } from '../../lib/models/Game.js';

export async function handle(request: Request): Promise<Response> {
  try {
    const { gameCode, hostName, questionIds } = await request.json();

    await connectToDatabase();

    const game = await Game.findOne({ code: gameCode, hostName });
    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), { status: 404 });
    }

    const globalQuestions = await GlobalQuestion.find({ _id: { $in: questionIds } });
    
    for (const globalQ of globalQuestions) {
      const existingCount = await Question.countDocuments({ gameId: game._id });
      
      const question = new Question({
        gameId: game._id,
        questionIndex: existingCount,
        questionText: globalQ.questionText,
        answers: globalQ.answers,
        correctAnswerIndex: globalQ.correctAnswerIndex,
        mediaUrl: globalQ.mediaUrl
      });
      
      await question.save();
    }

    return new Response(JSON.stringify({ success: true, imported: globalQuestions.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error importing global questions:', error);
    return new Response(JSON.stringify({ error: 'Failed to import questions' }), { status: 500 });
  }
}