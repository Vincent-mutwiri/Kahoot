import { schema, OutputType } from "./create_POST.schema";
import { db } from "../../helpers/db";

import superjson from 'superjson';
import { Kysely, sql } from "kysely";
import { DB } from "../../helpers/schema";

const ALPHANUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CODE_LENGTH = 6;

function generateRandomCode(): string {
  let result = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    result += ALPHANUMERIC.charAt(Math.floor(Math.random() * ALPHANUMERIC.length));
  }
  return result;
}

async function generateUniqueGameCode(trx: Kysely<DB>): Promise<string> {
  let gameCode: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    gameCode = generateRandomCode();
    const existingGame = await trx
      .selectFrom('games')
      .select('id')
      .where('code', '=', gameCode)
      .executeTakeFirst();

    if (!existingGame) {
      return gameCode;
    }

    attempts++;
  } while (attempts < maxAttempts);

  throw new Error("Failed to generate a unique game code after multiple attempts.");
}

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const newGame = await db.transaction().execute(async (trx) => {
      const gameCode = await generateUniqueGameCode(trx as Kysely<DB>);

      return await trx
        .insertInto('games')
        .values({
          code: gameCode,
          hostName: input.hostName,
          initialPrizePot: input.initialPrizePot,
          prizePotIncrement: input.prizePotIncrement,
          status: 'lobby',
          currentPrizePot: input.initialPrizePot,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    });

    return new Response(superjson.stringify(newGame satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating game:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}