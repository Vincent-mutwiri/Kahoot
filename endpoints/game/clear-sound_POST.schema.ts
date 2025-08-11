import { z } from 'zod';

export const schema = z.object({
  gameCode: z.string(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean; message?: string };