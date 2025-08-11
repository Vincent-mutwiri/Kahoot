import { db } from "../../helpers/db";
import { schema, OutputType } from "./answer_POST.schema";
import superjson from 'superjson';
import { Transaction } from "kysely";
import { DB } from "../../helpers/schema";

const QUESTION_TIME_LIMIT_MS = 30 * 1000; // 30 seconds

async function handleAnswerSubmission(trx: Transaction<DB>, gameCode: string, username: string, answer: string): Promise<OutputType> {
  // 1. Find the game and player with proper locking
  const game = await trx
    .selectFrom('games')
    .where('code', '=', gameCode)
    .selectAll()
    .forUpdate()
    .executeTakeFirst();

  if (!game) {
    throw new Error("Game not found.");
  }
  if (game.status !== 'active') {
    throw new Error("Game is not currently active.");
  }
  if (game.currentQuestionIndex === null) {
    throw new Error("There is no active question to answer.");
  }

  const player = await trx
    .selectFrom('players')
    .where('gameId', '=', game.id)
    .where('username', '=', username)
    .selectAll()
    .forUpdate()
    .executeTakeFirst();

  if (!player) {
    throw new Error("Player not found in this game.");
  }
  
  // Idempotent check - if player is already eliminated, don't allow answer submission
  if (player.status !== 'active') {
    if (player.status === 'eliminated') {
      console.log(`Player ${username} attempted to submit answer after elimination in game ${gameCode}`);
      return { status: 'eliminated', message: "You have already been eliminated and cannot submit answers." };
    }
    throw new Error("Only active players can submit answers.");
  }

  // 2. Check timing with more precise validation
  const questionStartTime = game.updatedAt?.getTime();
  if (!questionStartTime) {
    throw new Error("Invalid game state - question start time not found.");
  }

  const timeElapsed = Date.now() - questionStartTime;
  if (timeElapsed > QUESTION_TIME_LIMIT_MS) {
    // Time is up - use idempotent elimination that only affects active players
    const eliminationResult = await trx
      .updateTable('players')
      .set({ 
        status: 'eliminated',
        eliminatedRound: game.currentQuestionIndex
      })
      .where('id', '=', player.id)
      .where('status', '=', 'active') // Only eliminate if still active
      .returningAll()
      .execute();
    
    if (eliminationResult.length > 0) {
      console.log(`Player ${username} eliminated due to timeout in game ${gameCode}, question ${game.currentQuestionIndex}`);
    }
    
    return { status: 'eliminated', message: "Time's up! You have been eliminated." };
  }

  // 3. Get the current question and validate the answer
  const question = await trx
    .selectFrom('questions')
    .where('gameId', '=', game.id)
    .where('questionIndex', '=', game.currentQuestionIndex)
    .selectAll()
    .executeTakeFirst();

  if (!question) {
    throw new Error("Current question could not be found.");
  }

  if (answer === question.correctAnswer) {
    // Correct answer, player remains active. No state change needed.
    console.log(`Player ${username} answered correctly in game ${gameCode}, question ${game.currentQuestionIndex}`);
    return { status: 'active', message: "Answer submitted successfully." };
  } else {
    // Incorrect answer - use idempotent elimination that only affects active players
    const eliminationResult = await trx
      .updateTable('players')
      .set({ 
        status: 'eliminated',
        eliminatedRound: game.currentQuestionIndex
      })
      .where('id', '=', player.id)
      .where('status', '=', 'active') // Only eliminate if still active
      .returningAll()
      .execute();
    
    if (eliminationResult.length > 0) {
      console.log(`Player ${username} eliminated due to incorrect answer in game ${gameCode}, question ${game.currentQuestionIndex}`);
    }
    
    return { status: 'eliminated', message: "Incorrect answer. You have been eliminated." };
  }
}

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { gameCode, username, answer } = schema.parse(json);

    const result = await db.transaction().execute((trx) => 
      handleAnswerSubmission(trx, gameCode, username, answer)
    );
    
    return new Response(superjson.stringify(result satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in player/answer_POST:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { 
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}