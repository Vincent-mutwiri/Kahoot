import { db } from "../../helpers/db";
import { schema, OutputType, VoteTally } from "./state_GET.schema";
import superjson from 'superjson';
import { sql } from "kysely";

export async function handle(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const { roundId } = schema.parse({
      roundId: url.searchParams.get('roundId'),
    });

    // 1. Get the redemption round details
    const round = await db
      .selectFrom('redemptionRounds')
      .selectAll()
      .where('id', '=', roundId)
      .executeTakeFirst();

    if (!round) {
      return new Response(superjson.stringify({ error: "Voting round not found." }), { status: 404 });
    }

    // 2. Get eligible candidates for this round
    const eligibleCandidates = await db
      .selectFrom('players')
      .select(['id', 'username'])
      .where('gameId', '=', round.gameId)
      .where('status', '=', 'eliminated')
      .where('eliminatedRound', '=', round.questionIndex)
      .orderBy('id', 'asc')
      .execute();

    // 3. Get current vote tallies
    const voteCounts = await db
      .selectFrom('votes')
      .select([
        'votedForPlayerId',
        sql<string>`count(id)`.as('votes')
      ])
      .where('redemptionRoundId', '=', roundId)
      .groupBy('votedForPlayerId')
      .execute();

    const voteTallies: VoteTally[] = eligibleCandidates.map(candidate => {
      const count = voteCounts.find(vc => vc.votedForPlayerId === candidate.id);
      return {
        playerId: candidate.id,
        username: candidate.username,
        votes: parseInt(count?.votes ?? '0', 10),
      };
    });

    // 4. Calculate time remaining
    const now = Date.now();
    const endsAt = new Date(round.endsAt).getTime();
    const timeRemaining = round.status === 'active' ? Math.max(0, Math.round((endsAt - now) / 1000)) : 0;

    const response: OutputType = {
      status: round.status,
      timeRemaining,
      voteTallies,
      eligibleCandidates,
    };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error getting vote state:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}