import dbConnect from "../../lib/db/connect";
import { Game } from "../../lib/models/Game";
import { Player } from "../../lib/models/Player";
import { Question } from "../../lib/models/Question";
import { schema, OutputType } from "./answer_POST.schema";
import superjson from 'superjson';

const QUESTION_TIME_LIMIT_MS = 30 * 1000; // 30 seconds

async function handleAnswerSubmission(gameCode: string, username: string, answer: string): Promise<OutputType> {
  // 1. Find the game and player
  const game = await Game.findOne({ code: gameCode });

  if (!game) {
    throw new Error("Game not found.");
  }
  if (game.status !== 'active') {
    throw new Error("Game is not currently active.");
  }
  if (game.currentQuestionIndex === null) {
    throw new Error("There is no active question to answer.");
  }

  const player = await Player.findOne({
    gameId: game._id,
    username: username,
  });

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
    // Time is up - eliminate player
    player.status = 'eliminated';
    player.eliminatedRound = game.currentQuestionIndex;
    await player.save();
    
    console.log(`Player ${username} eliminated due to timeout in game ${gameCode}, question ${game.currentQuestionIndex}`);
    return { status: 'eliminated', message: "Time's up! You have been eliminated." };
  }

  // 3. Get the current question and validate the answer
  const question = await Question.findOne({
    gameId: game._id,
    questionIndex: game.currentQuestionIndex,
  });

  if (!question) {
    throw new Error("Current question could not be found.");
  }

  if (answer === question.correctAnswer) {
    // Correct answer, player remains active. No state change needed.
    console.log(`Player ${username} answered correctly in game ${gameCode}, question ${game.currentQuestionIndex}`);
    return { status: 'active', message: "Answer submitted successfully." };
  } else {
    // Incorrect answer - eliminate player
    player.status = 'eliminated';
    player.eliminatedRound = game.currentQuestionIndex;
    await player.save();
    
    console.log(`Player ${username} eliminated due to incorrect answer in game ${gameCode}, question ${game.currentQuestionIndex}`);
    return { status: 'eliminated', message: "Incorrect answer. You have been eliminated." };
  }
}

export async function handle(request: Request) {
  try {
    await dbConnect();
    const json = superjson.parse(await request.text());
    const { gameCode, username, answer } = schema.parse(json);

    const result = await handleAnswerSubmission(gameCode, username, answer);
    
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