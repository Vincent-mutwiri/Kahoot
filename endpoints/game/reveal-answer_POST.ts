import dbConnect from "../../lib/db/connect";
import { Game } from "../../lib/models/Game";
import { Player } from "../../lib/models/Player";
import { schema, OutputType } from "./reveal-answer_POST.schema";
import superjson from 'superjson';
import { broadcastToGame } from "../../lib/websocket";

const ELIMINATION_VIDEO_MS = 5_000;
const SURVIVOR_VIDEO_MS = 3_000;
const REDEMPTION_VIDEO_MS = 2_000;
const VOTE_WINDOW_MS = 20_000;

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
      return new Response(superjson.stringify({ error: "Only the host can reveal the answer." }), { status: 403 });
    }

    if (game.status !== 'active') {
      return new Response(superjson.stringify({ error: "Game is not active." }), { status: 409 });
    }
    
    if (game.currentQuestionIndex === null) {
      return new Response(superjson.stringify({ error: "No active question to reveal." }), { status: 409 });
    }

    // Increment prize pot once per question and keep gameState consistent
    game.currentPrizePot += game.prizePotIncrement;
    game.gameState = 'question';
    await game.save();

    // Gather round results
    const players = await Player.find({ gameId: game._id });
    const eliminated = players
      .filter(p => p.status === 'eliminated' && p.eliminatedRound === game.currentQuestionIndex)
      .map(p => p.username);
    const survivors = players.filter(p => p.status === 'active').map(p => p.username);

    const scoresDelta: Record<string, number> = {};
    players.forEach(p => {
      scoresDelta[p.username] = p.status === 'active' ? 100 : 0;
    });

    // Broadcast answer reveal and round results
    broadcastToGame(gameCode, {
      type: 'REVEAL_ANSWER',
      gameCode,
      questionIndex: game.currentQuestionIndex,
    });

    broadcastToGame(gameCode, {
      type: 'round_results',
      gameCode,
      eliminated,
      survivors,
      pot: game.currentPrizePot,
      scoresDelta,
      videos: {
        elimination: { url: game.eliminationVideoUrl, duration: ELIMINATION_VIDEO_MS },
        survivors: { url: game.survivorVideoUrl, duration: SURVIVOR_VIDEO_MS },
        redemption: { url: game.redemptionVideoUrl, duration: REDEMPTION_VIDEO_MS },
      },
      voteWindowMs: VOTE_WINDOW_MS,
    });

    const response: OutputType = { success: true, message: "Answer reveal triggered." };
    return new Response(superjson.stringify(response));
  } catch (error) {
    console.error("Error revealing answer:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}