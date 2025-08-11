import dbConnect from "../../lib/db/connect";
import { RedemptionRound } from "../../lib/models/RedemptionRound";
import { Player } from "../../lib/models/Player";
import { Vote } from "../../lib/models/Vote";
import { schema, OutputType, VoteTally } from "./state_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request): Promise<Response> {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const { roundId } = schema.parse({
      roundId: url.searchParams.get('roundId'),
    });

    // 1. Get the redemption round details
    const round = await RedemptionRound.findById(roundId);

    if (!round) {
      return new Response(superjson.stringify({ error: "Voting round not found." }), { status: 404 });
    }

    // 2. Get eligible candidates for this round
    const eligibleCandidates = await Player.find({
      gameId: round.gameId,
      status: 'eliminated',
      eliminatedRound: round.questionIndex,
    }).sort({ _id: 1 });

    // 3. Get current vote tallies
    const voteCounts = await Vote.aggregate([
      { $match: { redemptionRoundId: round._id } },
      { $group: { _id: '$votedForPlayerId', votes: { $sum: 1 } } },
    ]);

    const voteTallies: VoteTally[] = eligibleCandidates.map(candidate => {
      const count = voteCounts.find(vc => vc._id.toString() === candidate._id.toString());
      return {
        playerId: candidate._id.toString(),
        username: candidate.username,
        votes: count?.votes ?? 0,
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
      eligibleCandidates: eligibleCandidates.map(p => p.toObject()),
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