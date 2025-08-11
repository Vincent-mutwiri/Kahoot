import { schema, OutputType } from "./end_POST.schema";
import dbConnect from "../../lib/db/connect";
import { Game } from "../../lib/models/Game";
import { Player } from "../../lib/models/Player";
import superjson from 'superjson';

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
      return new Response(superjson.stringify({ error: "Only the host can end the game." }), { status: 403 });
    }

    if (game.status === 'finished') {
      return new Response(superjson.stringify({ error: "Game is already finished." }), { status: 409 });
    }

    const activePlayers = await Player.find({ gameId: game._id, status: 'active' });

    if (activePlayers.length !== 1) {
      return new Response(superjson.stringify({ error: "Cannot end the game without a single winner." }), { status: 400 });
    }

    const winner = activePlayers[0];

    // Distribute the prize
    winner.balance += game.currentPrizePot;
    await winner.save();

    game.status = 'finished';
    await game.save();

    return new Response(superjson.stringify(game.toObject() as OutputType));
  } catch (error) {
    console.error("Error ending game:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}