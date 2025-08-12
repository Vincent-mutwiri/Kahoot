import dbConnect from "../../lib/db/connect";
import { Game } from "../../lib/models/Game";
import { Player } from "../../lib/models/Player";
import { RedemptionRound } from "../../lib/models/RedemptionRound";
import { broadcastToGame } from "../../lib/websocket.js";
import { schema, OutputType } from "./start_POST.schema";
import superjson from 'superjson';

const REDEMPTION_ROUND_DURATION_MS = 20 * 1000; // 20 seconds

async function startVote(gameCode: string, hostName: string): Promise<OutputType> {
  // 1. Validate game and host
  const game = await Game.findOne({ code: gameCode });

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
  const eligiblePlayers = await Player.find({
    gameId: game._id,
    status: 'eliminated',
    eliminatedRound: game.currentQuestionIndex,
  });

  if (eligiblePlayers.length === 0) {
    throw new Error("No players were eliminated in the last round, so no redemption round is needed.");
  }

  // 3. Check for an existing active round for this question to prevent duplicates
  const existingRound = await RedemptionRound.findOne({
    gameId: game._id,
    questionIndex: game.currentQuestionIndex,
    status: 'active',
  });

  if (existingRound) {
    throw new Error("A redemption round is already active for this question.");
  }

  // 4. Create the redemption round
  const endsAt = new Date(Date.now() + REDEMPTION_ROUND_DURATION_MS);
  const newRound = new RedemptionRound({
    gameId: game._id,
    questionIndex: game.currentQuestionIndex,
    status: 'active',
    endsAt: endsAt,
  });
  await newRound.save();

  console.log(`Redemption round ${newRound._id} started for game ${gameCode}, question ${game.currentQuestionIndex}`);

  // Notify clients with the new round id to open voting modal
  broadcastToGame(gameCode, { type: 'VOTING_STARTED', gameCode, roundId: newRound._id.toString() });

  return {
    roundId: newRound._id.toString(),
    endsAt: newRound.endsAt,
    eligiblePlayers: eligiblePlayers.map(p => p.toObject()),
  };
}

export async function handle(request: Request): Promise<Response> {
  try {
    await dbConnect();
    const json = superjson.parse(await request.text());
    const { gameCode, hostName } = schema.parse(json);

    const result = await startVote(gameCode, hostName);

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