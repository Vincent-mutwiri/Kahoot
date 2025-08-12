import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Players, RedemptionRoundStatus, RedemptionRoundStatusArrayValues } from "../../helpers/schema";

export const schema = z.object({
  roundId: z.string().min(1, 'Round ID is required'),
});

export type InputType = z.infer<typeof schema>;

export type VoteTally = {
  playerId: string; // Mongoose ObjectId as string
  username: string;
  votes: number;
};

export type OutputType = {
  status: RedemptionRoundStatus;
  timeRemaining: number; // in seconds
  voteTallies: VoteTally[];
  eligibleCandidates: Pick<Selectable<Players>, 'id' | 'username'>[];
};

export const getVoteState = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const query = new URLSearchParams({
    roundId: validatedParams.roundId.toString(),
  });

  const result = await fetch(`/_api/vote/state?${query.toString()}`, {
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
    throw new Error(errorObject.error || "Failed to get voting state");
  }
  
  return superjson.parse<OutputType>(text);
};