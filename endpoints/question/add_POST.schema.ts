import { z } from "zod";
import superjson from 'superjson';
import type { Selectable } from "kysely";
import type { Questions } from "../../helpers/schema";

export const schema = z.object({
  gameCode: z.string().length(6, "Game code must be 6 characters").regex(/^[a-zA-Z0-9]+$/, "Game code must be alphanumeric"),
  hostName: z.string().min(1, "Host name is required"),
  questionText: z.string().min(5, "Question text must be at least 5 characters long."),
  optionA: z.string().min(1, "Option A is required."),
  optionB: z.string().min(1, "Option B is required."),
  optionC: z.string().min(1, "Option C is required."),
  optionD: z.string().min(1, "Option D is required."),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Questions>;

export const postQuestionAdd = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/question/add`, {
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
    throw new Error(errorObject.error || "Failed to add question");
  }
  
  return superjson.parse<OutputType>(text);
};