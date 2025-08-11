import { db } from "../../helpers/db";
import { schema, OutputType, InputType } from "./delete_POST.schema";
import superjson from 'superjson';
import { Transaction, sql } from "kysely";
import { DB } from "../../helpers/schema";

async function deleteQuestionTransaction(trx: Transaction<DB>, validatedInput: InputType) {
  const { gameCode, hostName, questionId } = validatedInput;

  // 1. Find the game and validate the host
  const game = await trx
    .selectFrom('games')
    .select(['id', 'hostName', 'status', 'currentQuestionIndex'])
    .where('code', '=', gameCode)
    .executeTakeFirst();

  if (!game) {
    throw new Error("Game not found.");
  }

  if (game.hostName !== hostName) {
    throw new Error("Unauthorized: You are not the host of this game.");
  }

  // 2. Find the question to delete
  const questionToDelete = await trx
    .selectFrom('questions')
    .select(['questionIndex'])
    .where('id', '=', questionId)
    .where('gameId', '=', game.id)
    .executeTakeFirst();

  if (!questionToDelete) {
    throw new Error("Question not found in this game.");
  }

  // 3. Check if the question is deletable
  if (game.status === 'active' && game.currentQuestionIndex !== null && questionToDelete.questionIndex <= game.currentQuestionIndex) {
    throw new Error("Cannot delete a question that has already been asked or is currently active.");
  }
  if (game.status === 'finished') {
    throw new Error("Cannot delete questions in a finished game.");
  }

  // 4. Delete the question
  const deleteResult = await trx
    .deleteFrom('questions')
    .where('id', '=', questionId)
    .executeTakeFirst();

  if (deleteResult.numDeletedRows === 0n) {
      throw new Error("Failed to delete the question.");
  }

  // 5. Re-index subsequent questions
  await trx
    .updateTable('questions')
    .set({
      questionIndex: sql`question_index - 1`
    })
    .where('gameId', '=', game.id)
    .where('questionIndex', '>', questionToDelete.questionIndex)
    .execute();

  return { success: true, deletedQuestionId: questionId };
}

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const validatedInput = schema.parse(json);

    const result = await db.transaction().execute(
        (trx) => deleteQuestionTransaction(trx, validatedInput)
    );
    
    return new Response(superjson.stringify(result satisfies OutputType), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
    });

  } catch (error) {
    console.error("Error deleting question:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
    });
  }
}