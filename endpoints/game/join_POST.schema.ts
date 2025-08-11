import { z } from "zod";
import superjson from 'superjson';
import type { Selectable } from "kysely";
import type { Players } from "../../helpers/schema";

export const schema = z.object({
  gameCode: z.string().length(6, "Game code must be 6 characters").regex(/^[a-zA-Z0-9]+$/, "Game code must be alphanumeric"),
  username: z.string().min(2, "Username must be at least 2 characters").max(50, "Username cannot exceed 50 characters"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Players>;

export const postGameJoin = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/game/join`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await result.text();
  if (!result.ok) {
    const errorObject = superjson.parse(text) as { error?: string };
    throw new Error(errorObject.error || "Failed to join game");
  }
  
  return superjson.parse<OutputType>(text);
};