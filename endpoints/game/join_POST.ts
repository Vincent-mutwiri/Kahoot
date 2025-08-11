import { schema, OutputType } from "./join_POST.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const newPlayer = await db.transaction().execute(async (trx) => {
      const game = await trx
        .selectFrom('games')
        .select(['id', 'status'])
        .where('code', '=', input.gameCode.toUpperCase())
        .executeTakeFirst();

      if (!game) {
        throw new Error("Game not found.");
      }

      if (game.status !== 'lobby') {
        throw new Error("This game is no longer accepting new players.");
      }

      const existingPlayer = await trx
        .selectFrom('players')
        .select('id')
        .where('gameId', '=', game.id)
        .where(
          'username',
          'ilike',
          input.username
        )
        .executeTakeFirst();

      if (existingPlayer) {
        throw new Error("This username is already taken in this game.");
      }

      return await trx
        .insertInto('players')
        .values({
          gameId: game.id,
          username: input.username,
          status: 'active',
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    });

    return new Response(superjson.stringify(newPlayer satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error joining game:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}