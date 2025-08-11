import { db } from "../../helpers/db";
import { schema, OutputType } from "./start_POST.schema";
import superjson from 'superjson';
import { Transaction } from "kysely";
import { DB } from "../../helpers/schema";

const REDEMPTION_ROUND_DURATION_MS = 20 * 1000; // 20 seconds

async function startVote(trx: Transaction<DB>, gameCode: string, hostName: string): Promise<OutputType> {
  // 1. Validate game and host
  const game = await trx
    .selectFrom('games')
    .selectAll()
    .where('code', '=', gameCode)
    .forUpdate()
    .executeTakeFirst();

  if (!game) {
    throw new Error("Game not found.");
  }
  if (game.hostName !== hostName) {
    throw new Error("Only the host can start a redemption round.");
  }
  if (game.status !== 'active') {
    throw new Error("Game is not active.");
  }
  if (game.currentQuestionIndex === null) {
    throw new Error("No active question round to start voting for.");
  }

  // 2. Find players eliminated in the current round
  const eligiblePlayers = await trx
    .selectFrom('players')
    .select(['id', 'username'])
    .where('gameId', '=', game.id)
    .where('status', '=', 'eliminated')
    .where('eliminatedRound', '=', game.currentQuestionIndex)
    .execute();

  if (eligiblePlayers.length === 0) {
    throw new Error("No players were eliminated in the last round, so no redemption round is needed.");
  }

  // 3. Check for an existing active round for this question to prevent duplicates
  const existingRound = await trx
    .selectFrom('redemptionRounds')
    .where('gameId', '=', game.id)
    .where('questionIndex', '=', game.currentQuestionIndex)
    .where('status', '=', 'active')
    .select('id')
    .executeTakeFirst();

  if (existingRound) {
    throw new Error("A redemption round is already active for this question.");
  }

  // 4. Create the redemption round
  const endsAt = new Date(Date.now() + REDEMPTION_ROUND_DURATION_MS);
  const newRound = await trx
    .insertInto('redemptionRounds')
    .values({
      gameId: game.id,
      questionIndex: game.currentQuestionIndex,
      status: 'active',
      endsAt: endsAt,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  console.log(`Redemption round ${newRound.id} started for game ${gameCode}, question ${game.currentQuestionIndex}`);

  return {
    roundId: newRound.id,
    endsAt: newRound.endsAt,
    eligiblePlayers: eligiblePlayers,
  };
}

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const { gameCode, hostName } = schema.parse(json);

    const result = await db.transaction().execute((trx) => 
      startVote(trx, gameCode, hostName)
    );

    return new Response(superjson.stringify(result satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error starting vote round:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { 
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}