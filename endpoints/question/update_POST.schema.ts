import { z } from "zod";
import superjson from 'superjson';
import type { Selectable } from "kysely";
import type { Questions } from "../../helpers/schema";

export const schema = z.object({
  gameCode: z.string().length(6, "Game code must be 6 characters").regex(/^[a-zA-Z0-9]+$/, "Game code must be alphanumeric"),
  hostName: z.string().min(1, "Host name is required"),
  questionId: z.number().int().positive("Question ID must be a positive integer."),
  questionText: z.string().min(5, "Question text must be at least 5 characters long.").optional(),
  optionA: z.string().min(1, "Option A is required.").optional(),
  optionB: z.string().min(1, "Option B is required.").optional(),
  optionC: z.string().min(1, "Option C is required.").optional(),
  optionD: z.string().min(1, "Option D is required.").optional(),
  correctAnswer: z.enum(["A", "B", "C", "D"]).optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Questions>;

export const postQuestionUpdate = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/question/update`, {
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
    throw new Error(errorObject.error || "Failed to update question");
  }
  
  return superjson.parse<OutputType>(text);
};