import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Players } from "../../helpers/schema";

export const schema = z.object({
  gameCode: z.string().length(6, "Game code must be 6 characters").regex(/^[a-zA-Z0-9]+$/, "Game code must be alphanumeric"),
  hostName: z.string().min(1, "Host name is required"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  roundId: string; // Mongoose ObjectId as string
  endsAt: Date;
  eligiblePlayers: Pick<Selectable<Players>, 'id' | 'username'>[];
};

export const postVoteStart = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/vote/start`, {
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
    throw new Error(errorObject.error || "Failed to start voting round");
  }
  
  return superjson.parse<OutputType>(text);
};