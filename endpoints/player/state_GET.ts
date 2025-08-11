import dbConnect from "../../lib/db/connect";
import { Game } from "../../lib/models/Game";
import { Player } from "../../lib/models/Player";
import { Question } from "../../lib/models/Question";
import { schema, OutputType } from "./state_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const gameCode = url.searchParams.get('gameCode');
    const username = url.searchParams.get('username');

    const { gameCode: validatedGameCode, username: validatedUsername } = schema.parse({ gameCode, username });

    const game = await Game.findOne({ code: validatedGameCode });

    if (!game) {
      return new Response(superjson.stringify({ error: "Game not found." }), { status: 404 });
    }

    const player = await Player.findOne({
      gameId: game._id,
      username: validatedUsername,
    });

    if (!player) {
      return new Response(superjson.stringify({ error: "Player not found in this game." }), { status: 404 });
    }

    const allPlayers = await Player.find({ gameId: game._id }).sort({ username: 'asc' });

    let currentQuestion: any | null = null;
    if (game.status === 'active' && game.currentQuestionIndex !== null) {
    currentQuestion = await Question.findOne({
      gameId: game._id,
      questionIndex: game.currentQuestionIndex,
    });
    }

    const output: OutputType = {
      game: {
        ...game.toObject(),
        // Omit sensitive data for players
        hostName: game.hostName === player.username ? game.hostName : 'Host',
      },
      player: player.toObject(),
      players: allPlayers.map(p => p.toObject()),
      currentQuestion: currentQuestion ? {
        questionText: currentQuestion.questionText,
        optionA: currentQuestion.optionA,
        optionB: currentQuestion.optionB,
        optionC: currentQuestion.optionC,
        optionD: currentQuestion.optionD,
        questionIndex: currentQuestion.questionIndex,
        // Only include correct answer if the game is over or player is host
        correctAnswer: (game.status === 'finished' || game.hostName === player.username) ? currentQuestion.correctAnswer : null,
      } : null,
      questionStartTimeMs: (game.status === 'active' && currentQuestion) ? game.updatedAt?.getTime() || null : null,
    };

    return new Response(superjson.stringify(output satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in player/state_GET:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { 
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}