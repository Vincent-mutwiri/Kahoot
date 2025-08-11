import { schema, OutputType } from "./play-sound_POST.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const { gameCode, hostName, soundId } = schema.parse(json);

    const game = await db
      .selectFrom('games')
      .select(['id', 'hostName'])
      .where('code', '=', gameCode)
      .executeTakeFirst();

    if (!game) {
      return new Response(superjson.stringify({ error: "Game not found." }), { status: 404 });
    }

    if (game.hostName !== hostName) {
      return new Response(superjson.stringify({ error: "Only the host can play sounds." }), { status: 403 });
    }

    // In a real-time system, this would broadcast the soundId to all clients.
    // For now, we simulate success.
    console.log(`[Game ${gameCode}] Host triggered play sound: ${soundId}`);
    const response: OutputType = { success: true, message: "Play sound event triggered." };
    return new Response(superjson.stringify(response));
  } catch (error) {
    console.error("Error playing sound:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}