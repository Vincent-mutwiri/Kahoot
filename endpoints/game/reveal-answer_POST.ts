import dbConnect from "../../lib/db/connect";
import { Game } from "../../lib/models/Game";
import { schema, OutputType } from "./reveal-answer_POST.schema";
import superjson from 'superjson';
import { broadcastToGame } from "../../lib/websocket.js";

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

    // Trigger clients to reveal the answer via WebSocket broadcast
    broadcastToGame(gameCode, { type: 'REVEAL_ANSWER', gameCode, questionIndex: game.currentQuestionIndex });
    broadcastToGame(gameCode, { type: 'GAME_STATE_CHANGED', gameCode });
    const response: OutputType = { success: true, message: "Answer reveal triggered." };
    return new Response(superjson.stringify(response));
  } catch (error) {
    console.error("Error revealing answer:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}