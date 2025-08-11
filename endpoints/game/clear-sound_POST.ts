import { schema, OutputType, InputType } from "./clear-sound_POST.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const { gameCode } = schema.parse(json);

    const game = await db
      .selectFrom('games')
      .select('id')
      .where('code', '=', gameCode)
      .executeTakeFirst();

    if (!game) {
      return new Response(superjson.stringify({ error: "Game not found." }), { status: 404 });
    }

    await db
      .updateTable('games')
      .set({ soundId: null })
      .where('id', '=', game.id)
      .execute();

    const response: OutputType = { success: true };
    return new Response(superjson.stringify(response));
  } catch (error) {
    console.error("Error clearing sound:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}

export const postGameClearSound = async (input: InputType): Promise<OutputType> => {
    const request = new Request('http://localhost/_api/game/clear-sound', {
        method: 'POST',
        body: superjson.stringify(input),
    });
    const response = await handle(request);
    return superjson.parse(await response.text());
}