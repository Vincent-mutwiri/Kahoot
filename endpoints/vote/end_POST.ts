import { db } from "../../helpers/db";
import { schema, OutputType, VoteTally } from "./end_POST.schema";
import superjson from 'superjson';
import { Transaction, sql } from "kysely";
import { DB, Players } from "../../helpers/schema";
import { Selectable } from "kysely";

async function endVote(trx: Transaction<DB>, roundId: number, hostName: string): Promise<OutputType> {
  // 1. Validate round and host
  const round = await trx
    .selectFrom('redemptionRounds')
    .innerJoin('games', 'games.id', 'redemptionRounds.gameId')
    .where('redemptionRounds.id', '=', roundId)
    .select(['redemptionRounds.id', 'redemptionRounds.status', 'redemptionRounds.gameId', 'redemptionRounds.questionIndex', 'games.hostName', 'games.prizePotIncrement'])
    .forUpdate()
    .executeTakeFirst();

  if (!round) {
    throw new Error("Voting round not found.");
  }
  if (round.hostName !== hostName) {
    throw new Error("Only the host can end the voting round.");
  }
  if (round.status !== 'active') {
    throw new Error("This voting round has already been completed.");
  }

  // 2. Tally votes
  const voteCounts = await trx
    .selectFrom('votes')
    .select(['votedForPlayerId', sql<string>`count(id)`.as('votes')])
    .where('redemptionRoundId', '=', roundId)
    .groupBy('votedForPlayerId')
    .orderBy(sql`count(id) desc`) // Order by votes descending
    .orderBy('votedForPlayerId', 'asc') // Tie-break with lower player ID
    .execute();

  // 3. Determine winner
  const winnerVote = voteCounts.length > 0 ? voteCounts[0] : null;
  const winnerId = winnerVote ? winnerVote.votedForPlayerId : null;
  let redeemedPlayer: Selectable<Players> | null = null;

  // 4. Update player and game state if there is a winner
  if (winnerId) {
    const updatedPlayer = await trx
      .updateTable('players')
      .set({
        status: 'active',
        eliminatedRound: null,
      })
      .where('id', '=', winnerId)
      .where('gameId', '=', round.gameId)
      .returningAll()
      .executeTakeFirst();
    
    if (updatedPlayer) {
      redeemedPlayer = updatedPlayer;
      console.log(`Player ${winnerId} has been redeemed in game ${round.gameId}.`);
      
      // Increase prize pot
      await trx
        .updateTable('games')
        .set((eb) => ({
          currentPrizePot: eb('currentPrizePot', '+', round.prizePotIncrement)
        }))
        .where('id', '=', round.gameId)
        .execute();
      console.log(`Prize pot for game ${round.gameId} increased by ${round.prizePotIncrement}.`);
    }
  } else {
    console.log(`No votes cast in round ${roundId}. No player redeemed.`);
  }

  // 5. Mark redemption round as completed
  await trx
    .updateTable('redemptionRounds')
    .set({
      status: 'completed',
      redeemedPlayerId: winnerId,
    })
    .where('id', '=', roundId)
    .execute();

  // 6. Get final tallies for the response
  const eligibleCandidates = await trx
    .selectFrom('players')
    .select(['id', 'username'])
    .where('gameId', '=', round.gameId)
    .where('eliminatedRound', '=', round.questionIndex)
    .execute();

  const finalVoteTallies: VoteTally[] = eligibleCandidates.map(candidate => {
    const count = voteCounts.find(vc => vc.votedForPlayerId === candidate.id);
    return {
      playerId: candidate.id,
      username: candidate.username,
      votes: parseInt(count?.votes ?? '0', 10),
    };
  });

  return {
    redeemedPlayer: redeemedPlayer,
    finalVoteTallies: finalVoteTallies,
  };
}

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const { roundId, hostName } = schema.parse(json);

    const result = await db.transaction().execute((trx) =>
      endVote(trx, roundId, hostName)
    );

    return new Response(superjson.stringify(result satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error ending vote round:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}