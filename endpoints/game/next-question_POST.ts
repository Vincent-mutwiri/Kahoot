import dbConnect from "../../lib/db/connect";
import { Game } from "../../lib/models/Game";
import { Player } from "../../lib/models/Player";
import { schema, OutputType } from "./next-question_POST.schema";
import superjson from 'superjson';
import { broadcastToGame } from "../../lib/websocket.js";

const QUESTION_TIME_LIMIT_MS = 30 * 1000; // 30 seconds

export async function handle(request: Request): Promise<Response> {
  try {
    await dbConnect();
    const json = superjson.parse(await request.text());
    const { gameCode, hostName } = schema.parse(json);

    const game = await Game.findOne({ code: gameCode });

    if (!game) {
      return new Response(superjson.stringify({ error: "Game not found." }), { status: 404 });
    }

    if (game.hostName !== hostName) {
      return new Response(superjson.stringify({ error: "Only the host can advance the game." }), { status: 403 });
    }

    if (game.status !== 'active') {
      return new Response(superjson.stringify({ error: "Game is not active." }), { status: 409 });
    }

    // Lock the game row to prevent concurrent modifications
    const currentGame = await Game.findOne({ _id: game._id, status: 'active' });

    if (!currentGame) {
      throw new Error("Game is no longer active or not found.");
    }

    const currentIndex = currentGame.currentQuestionIndex ?? -1;

    // If there was a previous question, eliminate players who didn't answer in time
    if (currentIndex >= 0) {
      const previousQuestionStartTime = currentGame.updatedAt?.getTime();
      
      if (previousQuestionStartTime) {
        const timeElapsed = Date.now() - previousQuestionStartTime;
        
        // If the time limit for the previous question has passed, eliminate players who are still active
        // Use idempotent elimination that won't double-eliminate players
        if (timeElapsed >= QUESTION_TIME_LIMIT_MS) {
          const playersToEliminate = await Player.updateMany(
            { gameId: currentGame._id, status: 'active', eliminatedRound: null },
            { $set: { status: 'eliminated', eliminatedRound: currentIndex } }
          );
          
          if (playersToEliminate.modifiedCount > 0) {
            console.log(`[Game ${gameCode}] Eliminated ${playersToEliminate.modifiedCount} players who didn't answer question ${currentIndex} in time.`);
          } else {
            console.log(`[Game ${gameCode}] No players needed elimination for question ${currentIndex} (all had already answered or been eliminated)`);
          }
        } else {
          console.log(`[Game ${gameCode}] Advancing to next question before timeout (${timeElapsed}ms elapsed, ${QUESTION_TIME_LIMIT_MS}ms limit)`);
        }
      } else {
        console.warn(`[Game ${gameCode}] Previous question start time not found, skipping timeout elimination`);
      }
    }

    const nextIndex = currentIndex + 1;
    console.log(`[Game ${gameCode}] Advancing from question ${currentIndex} to question ${nextIndex}`);

    // Update the game to the next question with a new timestamp
    currentGame.currentQuestionIndex = nextIndex;
    currentGame.updatedAt = new Date();
    await currentGame.save();

    console.log(`[Game ${gameCode}] Successfully advanced to question ${currentGame.currentQuestionIndex}`);
    // Push update to all clients in this game
    broadcastToGame(gameCode, {
      type: 'next_round',
      roundId: currentGame.currentQuestionIndex.toString(),
      questionId: currentGame.currentQuestionIndex,
      answerWindowMs: QUESTION_TIME_LIMIT_MS,
    });
    broadcastToGame(gameCode, { type: 'GAME_STATE_CHANGED', gameCode });
    return new Response(superjson.stringify(currentGame.toObject() satisfies OutputType));
  } catch (error) {
        console.error("Error advancing to next question:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}