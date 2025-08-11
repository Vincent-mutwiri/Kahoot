import { schema, OutputType } from "./start_POST.schema";
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
      return new Response(superjson.stringify({ error: "Only the host can start the game." }), { status: 403 });
    }

    if (game.status !== 'lobby') {
      return new Response(superjson.stringify({ error: `Game is already ${game.status}.` }), { status: 409 });
    }

    const updatedGame = await db
      .updateTable('games')
      .set({ 
        status: 'active',
        currentQuestionIndex: 0, // Start with the first question
        updatedAt: new Date(),
      })
      .where('id', '=', game.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify(updatedGame satisfies OutputType));
  } catch (error) {
    console.error("Error starting game:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}