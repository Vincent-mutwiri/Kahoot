import { z } from "zod";
import superjson from 'superjson';
import type { Selectable } from "kysely";
import type { Games } from "../../helpers/schema";

export const schema = z.object({
  hostName: z.string().min(2, "Host name must be at least 2 characters").max(50, "Host name cannot exceed 50 characters"),
  initialPrizePot: z.number().int().min(0, "Initial prize pot must be a positive number"),
  prizePotIncrement: z.number().int().min(0, "Prize pot increment must be a positive number"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Games>;

export const postGameCreate = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/game/create`, {
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
    if (text) {
      const errorObject = superjson.parse(text) as { error?: string };
      throw new Error(errorObject?.error || "Failed to create game");
    }
    throw new Error("Failed to create game: An unknown server error occurred.");
  }
  
  return superjson.parse<OutputType>(text);
};