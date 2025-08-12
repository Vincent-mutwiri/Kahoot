import dbConnect from "../../lib/db/connect";
import { Game } from "../../lib/models/Game";
import { Player } from "../../lib/models/Player";
import { RedemptionRound } from "../../lib/models/RedemptionRound";
import { Vote } from "../../lib/models/Vote";
import { broadcastToGame } from "../../lib/websocket.js";
import superjson from 'superjson';

export async function handle(request: Request): Promise<Response> {
  try {
    await dbConnect();
    const { gameCode, hostName } = superjson.parse(await request.text());

    const game = await Game.findOne({ code: gameCode });
    if (!game) {
      return new Response(superjson.stringify({ error: 'Game not found.' }), { status: 404 });
    }
    if (game.hostName !== hostName) {
      return new Response(superjson.stringify({ error: 'Only the host can end redemption.' }), { status: 403 });
    }

    // Locate active redemption round for current question
    const round = await RedemptionRound.findOne({
      gameId: game._id,
      questionIndex: game.currentQuestionIndex,
      status: 'active',
    });

    if (!round) {
      return new Response(superjson.stringify({ error: 'Redemption round not found.' }), { status: 404 });
    }

    // Tally votes
    const voteCounts = await Vote.aggregate([
      { $match: { redemptionRoundId: round._id } },
      { $group: { _id: '$votedForPlayerId', votes: { $sum: 1 } } },
      { $sort: { votes: -1, _id: 1 } },
    ]);

    const winnerVote = voteCounts[0] ?? null;
    let winnerPlayer: any = null;

    if (winnerVote) {
      winnerPlayer = await Player.findOneAndUpdate(
        { _id: winnerVote._id, gameId: game._id },
        { $set: { status: 'active', eliminatedRound: null } },
        { new: true }
      );
    }

    // Mark round as completed
    round.status = 'completed';
    round.redeemedPlayerId = winnerPlayer?._id ?? null;
    await round.save();

    // Broadcast vote result after redemption clip
    broadcastToGame(game.code, {
      type: 'vote_result',
      roundId: round._id.toString(),
      winner: winnerPlayer
        ? { playerId: winnerPlayer._id.toString(), username: winnerPlayer.username }
        : null,
    });

    // If everyone is eliminated, automatically revive top scorer
    const activeCount = await Player.countDocuments({ gameId: game._id, status: 'active' });
    if (activeCount === 0) {
      const topScorer = await Player.findOne({ gameId: game._id }).sort({ score: -1 });
      if (topScorer) {
        topScorer.status = 'active';
        topScorer.eliminatedRound = null;
        await topScorer.save();
      }
    }

    // Advance to next question
    const nextIndex = (game.currentQuestionIndex ?? 0) + 1;
    game.currentQuestionIndex = nextIndex;
    game.gameState = 'question';
    await game.save();

    const answerWindowMs = (game.roundDurationSeconds ?? 30) * 1000;
    broadcastToGame(game.code, {
      type: 'next_round',
      roundId: nextIndex.toString(),
      questionId: nextIndex,
      answerWindowMs,
    });

    return new Response(
      superjson.stringify({
        winner: winnerPlayer
          ? { id: winnerPlayer._id.toString(), username: winnerPlayer.username }
          : null,
        nextRound: {
          roundId: nextIndex.toString(),
          questionId: nextIndex,
          answerWindowMs,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error ending redemption:', error);
    const message = error instanceof Error ? error.message : 'Failed to end redemption';
    return new Response(superjson.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
