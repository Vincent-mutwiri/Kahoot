import { z } from "zod";
import superjson from 'superjson';
import type { Selectable } from "kysely";
import type { Games, Players } from "../../helpers/schema";

export const schema = z.object({
  gameCode: z.string().length(6, "Game code must be 6 characters").regex(/^[a-zA-Z0-9]+$/, "Game code must be alphanumeric"),
  username: z.string().min(2, "Username must be at least 2 characters").max(50, "Username cannot exceed 50 characters"),
});

export type InputType = z.infer<typeof schema>;

type PublicQuestion = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  questionIndex: number;
  correctAnswer: string | null; // Null for active players, revealed for spectators/hosts
};

export type OutputType = {
  game: Selectable<Games>;
  player: Selectable<Players>;
  players: Pick<Selectable<Players>, 'id' | 'username' | 'status' | 'eliminatedRound'>[];
  currentQuestion: PublicQuestion | null;
  questionStartTimeMs: number | null;
};

export const getPlayerState = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const queryParams = new URLSearchParams({ 
    gameCode: validatedParams.gameCode,
    username: validatedParams.username,
  });
  
  const result = await fetch(`/_api/player/state?${queryParams.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await result.text();
  if (!result.ok) {
    const errorObject = superjson.parse(text) as { error?: string };
    throw new Error(errorObject.error || "Failed to fetch player state");
  }
  
  return superjson.parse<OutputType>(text);
};