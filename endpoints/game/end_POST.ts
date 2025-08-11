import { schema, OutputType } from "./end_POST.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const { gameCode, hostName } = schema.parse(json);

    const game = await db
      .selectFrom('games')
      .selectAll()
      .where('code', '=', gameCode)
      .executeTakeFirst();

    if (!game) {
      return new Response(superjson.stringify({ error: "Game not found." }), { status: 404 });
    }

    if (game.hostName !== hostName) {
      return new Response(superjson.stringify({ error: "Only the host can end the game." }), { status: 403 });
    }

    if (game.status === 'finished') {
      return new Response(superjson.stringify({ error: "Game is already finished." }), { status: 409 });
    }

    const activePlayers = await db
      .selectFrom('players')
      .selectAll()
      .where('gameId', '=', game.id)
      .where('status', '=', 'active')
      .execute();

    if (activePlayers.length !== 1) {
      return new Response(superjson.stringify({ error: "Cannot end the game without a single winner." }), { status: 400 });
    }

    const winner = activePlayers[0];

    // Distribute the prize
    await db
      .updateTable('players')
      .set({ balance: winner.balance + game.currentPrizePot })
      .where('id', '=', winner.id)
      .execute();

    const updatedGame = await db
      .updateTable('games')
      .set({ 
        status: 'finished',
        updatedAt: new Date(),
      })
      .where('id', '=', game.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify(updatedGame satisfies OutputType));
  } catch (error) {
    console.error("Error ending game:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}