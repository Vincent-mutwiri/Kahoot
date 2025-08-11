import { db } from "../../helpers/db";
import { schema, OutputType } from "./cast_POST.schema";
import superjson from 'superjson';
import { Transaction } from "kysely";
import { DB } from "../../helpers/schema";

async function castVote(trx: Transaction<DB>, roundId: number, voterPlayerId: number, votedForPlayerId: number): Promise<OutputType> {
  // 1. Validate the redemption round
  const round = await trx
    .selectFrom('redemptionRounds')
    .selectAll()
    .where('id', '=', roundId)
    .forUpdate()
    .executeTakeFirst();

  if (!round) {
    throw new Error("Voting round not found.");
  }
  if (round.status !== 'active') {
    throw new Error("This voting round is no longer active.");
  }
  if (new Date() > new Date(round.endsAt)) {
    throw new Error("The time for voting has expired.");
  }

  // 2. Validate the voter
  const voter = await trx
    .selectFrom('players')
    .selectAll()
    .where('id', '=', voterPlayerId)
    .where('gameId', '=', round.gameId)
    .executeTakeFirst();

  if (!voter) {
    throw new Error("Voter not found in this game.");
  }
  if (voter.status !== 'active') {
    throw new Error("Only active players can vote.");
  }

  // 3. Validate the candidate (voted for player)
  const candidate = await trx
    .selectFrom('players')
    .selectAll()
    .where('id', '=', votedForPlayerId)
    .where('gameId', '=', round.gameId)
    .executeTakeFirst();

  if (!candidate) {
    throw new Error("Candidate player not found in this game.");
  }
  if (candidate.status !== 'eliminated' || candidate.eliminatedRound !== round.questionIndex) {
    throw new Error("This player is not eligible for redemption in this round.");
  }

  // 4. Prevent double voting
  const existingVote = await trx
    .selectFrom('votes')
    .where('redemptionRoundId', '=', roundId)
    .where('voterPlayerId', '=', voterPlayerId)
    .select('id')
    .executeTakeFirst();

  if (existingVote) {
    throw new Error("You have already voted in this round.");
  }

  // 5. Insert the vote
  await trx
    .insertInto('votes')
    .values({
      gameId: round.gameId,
      questionIndex: round.questionIndex,
      redemptionRoundId: roundId,
      voterPlayerId: voterPlayerId,
      votedForPlayerId: votedForPlayerId,
    })
    .execute();

  console.log(`Player ${voterPlayerId} voted for ${votedForPlayerId} in round ${roundId}`);

  return { success: true, message: "Your vote has been cast successfully." };
}

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const { roundId, voterPlayerId, votedForPlayerId } = schema.parse(json);

    const result = await db.transaction().execute((trx) =>
      castVote(trx, roundId, voterPlayerId, votedForPlayerId)
    );

    return new Response(superjson.stringify(result satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error casting vote:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}