import { schema, OutputType } from "./create_POST.schema";
import dbConnect from "../../lib/db/connect";
import { Game } from "../../lib/models/Game";
import superjson from 'superjson';

const ALPHANUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CODE_LENGTH = 6;

function generateRandomCode(): string {
  let result = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    result += ALPHANUMERIC.charAt(Math.floor(Math.random() * ALPHANUMERIC.length));
  }
  return result;
}

async function generateUniqueGameCode(): Promise<string> {
  let gameCode: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    gameCode = generateRandomCode();
    const existingGame = await Game.findOne({ code: gameCode });

    if (!existingGame) {
      return gameCode;
    }

    attempts++;
  } while (attempts < maxAttempts);

  throw new Error("Failed to generate a unique game code after multiple attempts.");
}

export async function handle(request: Request): Promise<Response> {
  try {
    await dbConnect();
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const gameCode = await generateUniqueGameCode();

    const newGame = new Game({
      code: gameCode,
      hostName: input.hostName,
      initialPrizePot: input.initialPrizePot,
      prizePotIncrement: input.prizePotIncrement,
      currentPrizePot: input.initialPrizePot,
    });

    await newGame.save();

    return new Response(superjson.stringify(newGame.toObject() as OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating game:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}