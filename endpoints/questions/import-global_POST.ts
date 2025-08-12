import { connectToDatabase } from '../../lib/db/mongodb.js';
import { GlobalQuestion } from '../../lib/models/GlobalQuestion.js';
import { Question } from '../../lib/models/Question.js';
import { Game } from '../../lib/models/Game.js';

export async function handle(request: Request): Promise<Response> {
  try {
    const { gameCode, hostName, questionIds } = await request.json();
    console.log('Import request:', { gameCode, hostName, questionIds });

    await connectToDatabase();

    const game = await Game.findOne({ code: gameCode, hostName });
    if (!game) {
      console.log('Game not found:', { gameCode, hostName });
      return new Response(JSON.stringify({ error: 'Game not found' }), { status: 404 });
    }
    console.log('Game found:', game._id);

    const globalQuestions = await GlobalQuestion.find({ _id: { $in: questionIds } });
    console.log('Global questions found:', globalQuestions.length);
    
    for (const globalQ of globalQuestions) {
      console.log('Processing global question:', globalQ._id);
      const existingCount = await Question.countDocuments({ gameId: game._id });
      
      const question = new Question({
        gameId: game._id,
        questionIndex: existingCount,
        questionText: globalQ.questionText,
        optionA: globalQ.answers?.[0] || '',
        optionB: globalQ.answers?.[1] || '',
        optionC: globalQ.answers?.[2] || '',
        optionD: globalQ.answers?.[3] || '',
        correctAnswer: ['A', 'B', 'C', 'D'][globalQ.correctAnswerIndex] || 'A',
        isGlobal: true
      });
      
      console.log('Saving question:', question);
      await question.save();
    }

    return new Response(JSON.stringify({ success: true, imported: globalQuestions.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error importing global questions:', error);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({ error: error.message || 'Failed to import questions' }), { status: 500 });
  }
}