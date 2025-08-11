import { schema, OutputType } from "./hide-media_POST.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const { gameCode, hostName } = schema.parse(json);

    const game = await db
      .selectFrom('games')
      .select(['id', 'hostName'])
      .where('code', '=', gameCode)
      .executeTakeFirst();

    if (!game) {
      return new Response(superjson.stringify({ error: "Game not found." }), { status: 404 });
    }

    if (game.hostName !== hostName) {
      return new Response(superjson.stringify({ error: "Only the host can hide media." }), { status: 403 });
    }

    await db
      .updateTable('games')
      .set({ mediaUrl: null })
      .where('id', '=', game.id)
      .execute();

    const response: OutputType = { success: true, message: "Media will be hidden shortly." };
    return new Response(superjson.stringify(response));
  } catch (error) {
    console.error("Error hiding media:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}