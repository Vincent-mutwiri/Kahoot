import dbConnect from "../../lib/db/connect";
import { Game } from "../../lib/models/Game";
import { Question } from "../../lib/models/Question";
import { schema, OutputType } from "./list_GET.schema";
import superjson from 'superjson';
import { URLSearchParams } from "url";

export async function handle(request: Request) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const params = new URLSearchParams(url.search);
    
    const validatedInput = schema.parse({
        gameCode: params.get('gameCode'),
        hostName: params.get('hostName'),
    });

    const { gameCode, hostName } = validatedInput;

    // 1. Find the game and validate the host
    const game = await Game.findOne({ code: gameCode });

    if (!game) {
      throw new Error("Game not found.");
    }

    if (game.hostName !== hostName) {
      throw new Error("Unauthorized: You are not the host of this game.");
    }

    // 2. Fetch all questions for the game, ordered by their index
    const questions = await Question.find({ gameId: game._id }).sort({ questionIndex: 'asc' });

    return new Response(superjson.stringify(questions.map(q => q.toObject()) satisfies OutputType), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
    });

  } catch (error) {
    console.error("Error listing questions:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
    });
  }
}