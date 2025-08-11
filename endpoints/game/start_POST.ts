import dbConnect from "../../lib/db/connect";
import { Game } from "../../lib/models/Game";
import { schema, OutputType } from "./start_POST.schema";
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
      return new Response(superjson.stringify({ error: "Only the host can start the game." }), { status: 403 });
    }

    if (game.status !== 'lobby') {
      return new Response(superjson.stringify({ error: `Game is already ${game.status}.` }), { status: 409 });
    }

    game.status = 'active';
    game.currentQuestionIndex = 0; // Start with the first question
    game.updatedAt = new Date();
    await game.save();

    return new Response(superjson.stringify(game.toObject() satisfies OutputType));
  } catch (error) {
    console.error("Error starting game:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}