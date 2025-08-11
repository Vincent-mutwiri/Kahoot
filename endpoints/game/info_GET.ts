import { schema, OutputType } from "./info_GET.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';

export async function handle(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const input = schema.parse({
      gameCode: url.searchParams.get('gameCode'),
    });

    const game = await db
      .selectFrom('games')
      .selectAll()
      .where('code', '=', input.gameCode.toUpperCase())
      .executeTakeFirst();

    if (!game) {
      return new Response(superjson.stringify({ error: "Game not found" }), { status: 404 });
    }

    const players = await db
      .selectFrom('players')
      .selectAll()
      .where('gameId', '=', game.id)
      .orderBy('username', 'asc')
      .execute();

    const response: OutputType = {
      game,
      players,
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