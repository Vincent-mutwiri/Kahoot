import { schema, OutputType } from "./next-question_POST.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';

const QUESTION_TIME_LIMIT_MS = 30 * 1000; // 30 seconds

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const { gameCode, hostName } = schema.parse(json);

    const game = await db
      .selectFrom('games')
      .selectAll()
      .where('code', '=', gameCode)
      .executeTakeFirst();

    if (!game) {
      return new Response(superjson.stringify({ error: "Game not found." }), { status: 404 });
    }

    if (game.hostName !== hostName) {
      return new Response(superjson.stringify({ error: "Only the host can advance the game." }), { status: 403 });
    }

    if (game.status !== 'active') {
      return new Response(superjson.stringify({ error: "Game is not active." }), { status: 409 });
    }

    const updatedGame = await db.transaction().execute(async (trx) => {
      // Lock the game row to prevent concurrent modifications
      const currentGame = await trx
        .selectFrom('games')
        .select(['id', 'currentQuestionIndex', 'updatedAt', 'status'])
        .where('id', '=', game.id)
        .where('status', '=', 'active') // Additional safety check
        .forUpdate()
        .executeTakeFirst();

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
            const playersToEliminate = await trx
              .updateTable('players')
              .set({ 
                status: 'eliminated',
                eliminatedRound: currentIndex
              })
              .where('gameId', '=', currentGame.id)
              .where('status', '=', 'active') // Only eliminate currently active players
              .where('eliminatedRound', 'is', null) // Additional safety check
              .returningAll()
              .execute();
            
            if (playersToEliminate.length > 0) {
              console.log(`[Game ${gameCode}] Eliminated ${playersToEliminate.length} players who didn't answer question ${currentIndex} in time:`, 
                playersToEliminate.map(p => p.username).join(', '));
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
      return await trx
        .updateTable('games')
        .set({ 
          currentQuestionIndex: nextIndex,
          updatedAt: new Date(),
        })
        .where('id', '=', currentGame.id)
        .where('status', '=', 'active') // Additional safety check
        .returningAll()
        .executeTakeFirstOrThrow();
    });

    console.log(`[Game ${gameCode}] Successfully advanced to question ${updatedGame.currentQuestionIndex}`);
    return new Response(superjson.stringify(updatedGame satisfies OutputType));
  } catch (error) {
        console.error("Error advancing to next question:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}