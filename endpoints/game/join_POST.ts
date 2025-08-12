import { schema, OutputType } from "./join_POST.schema";
import dbConnect from "../../lib/db/connect";
import { Game } from "../../lib/models/Game";
import { Player } from "../../lib/models/Player";
import superjson from 'superjson';

export async function handle(request: Request): Promise<Response> {
  try {
    await dbConnect();
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const game = await Game.findOne({ code: input.gameCode.toUpperCase() });

    if (!game) {
      throw new Error("Game not found.");
    }

    if (game.status !== 'lobby') {
      throw new Error("This game is no longer accepting new players.");
    }

    const existingPlayer = await Player.findOne({ 
      gameId: game._id, 
      username: { $regex: new RegExp(`^${input.username}`, 'i') } 
    });

    if (existingPlayer) {
      throw new Error("This username is already taken in this game.");
    }

    const newPlayer = new Player({
      gameId: game._id,
      username: input.username,
    });

    await newPlayer.save();

    return new Response(superjson.stringify(newPlayer.toObject() as OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error joining game:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}