import { schema, OutputType } from "./show-media_POST.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const { gameCode, hostName, mediaUrl } = schema.parse(json);

    const game = await db
      .selectFrom('games')
      .select(['id', 'hostName'])
      .where('code', '=', gameCode)
      .executeTakeFirst();

    if (!game) {
      return new Response(superjson.stringify({ error: "Game not found." }), { status: 404 });
    }

    if (game.hostName !== hostName) {
      return new Response(superjson.stringify({ error: "Only the host can show media." }), { status: 403 });
    }

    // In a real-time system, this would broadcast the mediaUrl to all clients.
    // For now, we simulate success.
    console.log(`[Game ${gameCode}] Host triggered show media: ${mediaUrl}`);
    const response: OutputType = { success: true, message: "Show media event triggered." };
    return new Response(superjson.stringify(response));
  } catch (error) {
    console.error("Error showing media:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}