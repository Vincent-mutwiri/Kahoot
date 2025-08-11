import { z } from "zod";
import superjson from 'superjson';
import { PlayerStatus, PlayerStatusArrayValues } from "../../helpers/schema";

export const schema = z.object({
  gameCode: z.string().length(6, "Game code must be 6 characters").regex(/^[a-zA-Z0-9]+$/, "Game code must be alphanumeric"),
  username: z.string().min(2, "Username must be at least 2 characters").max(50, "Username cannot exceed 50 characters"),
  answer: z.enum(['A', 'B', 'C', 'D']),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  status: PlayerStatus;
  message: string;
};

export const postPlayerAnswer = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/player/answer`, {
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
    throw new Error(errorObject.error || "Failed to submit answer");
  }
  
  return superjson.parse<OutputType>(text);
};