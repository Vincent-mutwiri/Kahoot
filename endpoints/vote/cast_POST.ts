import dbConnect from "../../lib/db/connect";
import { RedemptionRound } from "../../lib/models/RedemptionRound";
import { Player } from "../../lib/models/Player";
import { Vote } from "../../lib/models/Vote";
import { Game } from "../../lib/models/Game";
import { broadcastToGame } from "../../lib/websocket.js";
import { schema, OutputType } from "./cast_POST.schema";
import superjson from 'superjson';

async function castVote(roundId: string, voterPlayerId: string, votedForPlayerId: string): Promise<OutputType> {
  // 1. Validate the redemption round
  const round = await RedemptionRound.findById(roundId);

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
  const voter = await Player.findOne({
    _id: voterPlayerId,
    gameId: round.gameId,
  });

  if (!voter) {
    throw new Error("Voter not found in this game.");
  }
  if (voter.status !== 'active') {
    throw new Error("Only active players can vote.");
  }

  // 3. Validate the candidate (voted for player)
  const candidate = await Player.findOne({
    _id: votedForPlayerId,
    gameId: round.gameId,
  });

  if (!candidate) {
    throw new Error("Candidate player not found in this game.");
  }
  if (candidate.status !== 'eliminated' || candidate.eliminatedRound !== round.questionIndex) {
    throw new Error("This player is not eligible for redemption in this round.");
  }

  // 4. Prevent double voting
  const existingVote = await Vote.findOne({
    redemptionRoundId: roundId,
    voterPlayerId: voterPlayerId,
  });

  if (existingVote) {
    throw new Error("You have already voted in this round.");
  }

  // 5. Insert the vote
  const newVote = new Vote({
    gameId: round.gameId,
    questionIndex: round.questionIndex,
    redemptionRoundId: roundId,
    voterPlayerId: voterPlayerId,
    votedForPlayerId: votedForPlayerId,
  });
  await newVote.save();

  console.log(`Player ${voterPlayerId} voted for ${votedForPlayerId} in round ${roundId}`);

  // Broadcast current tally after each vote
  const voteCounts = await Vote.aggregate([
    { $match: { redemptionRoundId: round._id } },
    { $group: { _id: '$votedForPlayerId', votes: { $sum: 1 } } },
  ]);

  const tally = voteCounts.map(vc => ({
    playerId: vc._id.toString(),
    votes: vc.votes,
  }));

  const game = await Game.findById(round.gameId);
  if (game?.code) {
    broadcastToGame(game.code, {
      type: 'vote_tick',
      roundId: round._id.toString(),
      tallies: tally,
    });
  }

  return { success: true, message: "Your vote has been cast successfully." };
}

export async function handle(request: Request): Promise<Response> {
  try {
    await dbConnect();
    const json = superjson.parse(await request.text());
    const { roundId, voterPlayerId, votedForPlayerId } = schema.parse(json);

    const result = await castVote(roundId, voterPlayerId, votedForPlayerId);

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