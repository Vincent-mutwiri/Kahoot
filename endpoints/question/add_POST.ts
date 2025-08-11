import { db } from "../../helpers/db";
import { schema, OutputType } from "./add_POST.schema";
import superjson from 'superjson';
import { Transaction } from "kysely";
import { DB } from "../../helpers/schema";

async function addQuestionTransaction(trx: Transaction<DB>, validatedInput: import("./add_POST.schema").InputType) {
  const { gameCode, hostName, questionText, optionA, optionB, optionC, optionD, correctAnswer } = validatedInput;

  // 1. Find the game and validate the host
  const game = await trx
    .selectFrom('games')
    .select(['id', 'hostName', 'status'])
    .where('code', '=', gameCode)
    .executeTakeFirst();

  if (!game) {
    throw new Error("Game not found.");
  }

  if (game.hostName !== hostName) {
    throw new Error("Unauthorized: You are not the host of this game.");
  }

  if (game.status === 'finished') {
    throw new Error("Cannot add questions to a finished game.");
  }

  // 2. Determine the next question index
  const questionCountResult = await trx
    .selectFrom('questions')
    .select(eb => eb.fn.count<string>('id').as('count'))
    .where('gameId', '=', game.id)
    .executeTakeFirst();
  
  const questionIndex = parseInt(questionCountResult?.count ?? '0', 10);

  // 3. Insert the new question
  const newQuestion = await trx
    .insertInto('questions')
    .values({
      gameId: game.id,
      questionIndex,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return newQuestion;
}


export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const validatedInput = schema.parse(json);

    const newQuestion = await db.transaction().execute(
        (trx) => addQuestionTransaction(trx, validatedInput)
    );
    
    return new Response(superjson.stringify(newQuestion satisfies OutputType), {
        headers: { 'Content-Type': 'application/json' },
        status: 201, // Created
    });

  } catch (error) {
    console.error("Error adding question:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
    });
  }
}