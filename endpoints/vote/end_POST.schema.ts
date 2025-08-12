import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Players } from "../../helpers/schema";

export const schema = z.object({
  roundId: z.union([z.string().min(1), z.number().int().positive()]).transform((v) => v.toString()),
  hostName: z.string().min(1, "Host name is required"),
});

export type InputType = z.infer<typeof schema>;

export type VoteTally = {
  playerId: string; // Mongoose ObjectId as string
  username: string;
  votes: number;
};

export type OutputType = {
  redeemedPlayer: Selectable<Players> | null;
  finalVoteTallies: VoteTally[];
};

export const postVoteEnd = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/vote/end`, {
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
    throw new Error(errorObject.error || "Failed to end voting round");
  }
  
  return superjson.parse<OutputType>(text);
};