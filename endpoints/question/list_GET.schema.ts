import { z } from "zod";
import superjson from 'superjson';
import type { Selectable } from "kysely";
import type { Questions } from "../../helpers/schema";

export const schema = z.object({
  gameCode: z.string().length(6, "Game code must be 6 characters").regex(/^[a-zA-Z0-9]+$/, "Game code must be alphanumeric"),
  hostName: z.string().min(1, "Host name is required"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Questions>[];

export const getQuestionList = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(params);
  const queryParams = new URLSearchParams({
    gameCode: validatedInput.gameCode,
    hostName: validatedInput.hostName,
  });

  const result = await fetch(`/_api/question/list?${queryParams.toString()}`, {
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
    throw new Error(errorObject.error || "Failed to list questions");
  }
  
  return superjson.parse<OutputType>(text);
};