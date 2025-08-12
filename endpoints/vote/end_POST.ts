import dbConnect from "../../lib/db/connect";
import { Game } from "../../lib/models/Game";
import { Player } from "../../lib/models/Player";
import { RedemptionRound } from "../../lib/models/RedemptionRound";
import { Vote } from "../../lib/models/Vote";
import { schema, OutputType, VoteTally } from "./end_POST.schema";
import superjson from 'superjson';
import { broadcastToGame } from "../../lib/websocket.js";

async function endVote(roundId: string, hostName: string): Promise<OutputType> {
  // 1. Validate round and host
  const round = await RedemptionRound.findById(roundId).populate('gameId');

  if (!round || !round.gameId) {
    throw new Error("Voting round not found.");
  }
  if (round.gameId.hostName !== hostName) {
    throw new Error("Only the host can end the voting round.");
  }
  if (round.status !== 'active') {
    throw new Error("This voting round has already been completed.");
  }

  // 2. Tally votes
  const voteCounts = await Vote.aggregate([
    { $match: { redemptionRoundId: round._id } },
    { $group: { _id: '$votedForPlayerId', votes: { $sum: 1 } } },
    { $sort: { votes: -1, _id: 1 } }, // Order by votes descending, then player ID ascending
  ]);

  // 3. Determine winner
  const winnerVote = voteCounts.length > 0 ? voteCounts[0] : null;
  const winnerId = winnerVote ? winnerVote._id : null;
  let redeemedPlayer: any | null = null;

  // 4. Update player and game state if there is a winner
  if (winnerId) {
    const updatedPlayer = await Player.findOneAndUpdate(
      { _id: winnerId, gameId: round.gameId._id },
      { $set: { status: 'active', eliminatedRound: null } },
      { new: true }
    );
    
    if (updatedPlayer) {
      redeemedPlayer = updatedPlayer.toObject();
      console.log(`Player ${winnerId} has been redeemed in game ${round.gameId.code}.`);
      
      // Increase prize pot
      round.gameId.currentPrizePot += round.gameId.prizePotIncrement;
      await round.gameId.save();
      console.log(`Prize pot for game ${round.gameId.code} increased by ${round.gameId.prizePotIncrement}.`);
    }
  } else {
    console.log(`No votes cast in round ${roundId}. No player redeemed.`);
  }

  // 5. Mark redemption round as completed
  round.status = 'completed';
  round.redeemedPlayerId = winnerId;
  await round.save();

  // Notify clients with vote result
  if (round.gameId?.code) {
    broadcastToGame(round.gameId.code, {
      type: 'vote_result',
      gameCode: round.gameId.code,
      roundId: round._id.toString(),
      winner: redeemedPlayer ? { playerId: redeemedPlayer._id.toString(), username: redeemedPlayer.username } : null,
    });
  }

  // 6. Get final tallies for the response
  const eligibleCandidates = await Player.find({
    gameId: round.gameId._id,
    eliminatedRound: round.questionIndex,
  });

  const finalVoteTallies: VoteTally[] = eligibleCandidates.map(candidate => {
    const count = voteCounts.find(vc => vc._id.toString() === candidate._id.toString());
    return {
      playerId: candidate._id.toString(),
      username: candidate.username,
      votes: count?.votes ?? 0,
    };
  });

  return {
    redeemedPlayer: redeemedPlayer,
    finalVoteTallies: finalVoteTallies,
  };
}

export async function handle(request: Request): Promise<Response> {
  try {
    await dbConnect();
    const json = superjson.parse(await request.text());
    const { roundId, hostName } = schema.parse(json);

    const result = await endVote(roundId, hostName);

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