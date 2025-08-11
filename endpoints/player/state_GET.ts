import { db } from "../../helpers/db";
import { schema, OutputType } from "./state_GET.schema";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Games, Players, Questions } from "../../helpers/schema";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const gameCode = url.searchParams.get('gameCode');
    const username = url.searchParams.get('username');

    const { gameCode: validatedGameCode, username: validatedUsername } = schema.parse({ gameCode, username });

    const game = await db
      .selectFrom('games')
      .where('code', '=', validatedGameCode)
      .selectAll()
      .executeTakeFirst();

    if (!game) {
      return new Response(superjson.stringify({ error: "Game not found." }), { status: 404 });
    }

    const player = await db
      .selectFrom('players')
      .where('gameId', '=', game.id)
      .where('username', '=', validatedUsername)
      .selectAll()
      .executeTakeFirst();

    if (!player) {
      return new Response(superjson.stringify({ error: "Player not found in this game." }), { status: 404 });
    }

    const allPlayers = await db
      .selectFrom('players')
      .where('gameId', '=', game.id)
      .select(['id', 'username', 'status', 'eliminatedRound'])
      .orderBy('username')
      .execute();

    let currentQuestion: Selectable<Questions> | null = null;
    if (game.status === 'active' && game.currentQuestionIndex !== null) {
    currentQuestion = await db
      .selectFrom('questions')
      .where('gameId', '=', game.id)
      .where('questionIndex', '=', game.currentQuestionIndex)
      .selectAll()
      .executeTakeFirst() || null;
    }

    const output: OutputType = {
      game: {
        ...game,
        // Omit sensitive data for players
        hostName: game.hostName === player.username ? game.hostName : 'Host',
      },
      player,
      players: allPlayers,
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