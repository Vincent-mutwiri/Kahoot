import { schema, OutputType } from "./info_GET.schema";
import dbConnect from "../../lib/db/connect";
import { Game } from "../../lib/models/Game";
import { Player } from "../../lib/models/Player";
import superjson from 'superjson';

export async function handle(request: Request): Promise<Response> {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const input = schema.parse({
      gameCode: url.searchParams.get('gameCode'),
    });

    const game = await Game.findOne({ code: input.gameCode.toUpperCase() });

    if (!game) {
      return new Response(superjson.stringify({ error: "Game not found" }), { status: 404 });
    }

    const players = await Player.find({ gameId: game._id }).sort({ username: 'asc' });

    const response: OutputType = {
      game: game.toObject(),
      players: players.map(p => p.toObject()),
    };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching game info:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}