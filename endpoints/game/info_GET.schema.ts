import { z } from "zod";
import superjson from 'superjson';
import type { Selectable } from "kysely";
import type { Games, Players } from "../../helpers/schema";

export const schema = z.object({
  gameCode: z.string().length(6, "Game code must be 6 characters").regex(/^[a-zA-Z0-9]+$/, "Game code must be alphanumeric"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  game: Selectable<Games>;
  players: Selectable<Players>[];
};

export const getGameInfo = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const queryParams = new URLSearchParams({ gameCode: validatedParams.gameCode });
  
  const result = await fetch(`/_api/game/info?${queryParams.toString()}`, {
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
    throw new Error(errorObject.error || "Failed to fetch game info");
  }
  
  return superjson.parse<OutputType>(text);
};