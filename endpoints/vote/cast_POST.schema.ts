import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  roundId: z.number().int().positive("Invalid round ID"),
  voterPlayerId: z.number().int().positive("Invalid voter player ID"),
  votedForPlayerId: z.number().int().positive("Invalid candidate player ID"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  message: string;
};

export const postVoteCast = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/vote/cast`, {
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
    throw new Error(errorObject.error || "Failed to cast vote");
  }
  
  return superjson.parse<OutputType>(text);
};