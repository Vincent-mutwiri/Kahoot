import dbConnect from "../../lib/db/connect";
import { Game } from "../../lib/models/Game";
import { Question } from "../../lib/models/Question";
import { schema, OutputType, InputType } from "./delete_POST.schema";
import superjson from 'superjson';

async function deleteQuestionTransaction(validatedInput: InputType) {
  const { gameCode, hostName, questionId } = validatedInput;

  // 1. Find the game and validate the host
  const game = await Game.findOne({ code: gameCode });

  if (!game) {
    throw new Error("Game not found.");
  }

  if (game.hostName !== hostName) {
    throw new Error("Unauthorized: You are not the host of this game.");
  }

  // 2. Find the question to delete
  const questionToDelete = await Question.findOne({
    _id: questionId,
    gameId: game._id,
  });

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
  const deleteResult = await Question.deleteOne({ _id: questionId });

  if (deleteResult.deletedCount === 0) {
      throw new Error("Failed to delete the question.");
  }

  // 5. Re-index subsequent questions
  await Question.updateMany(
    { gameId: game._id, questionIndex: { $gt: questionToDelete.questionIndex } },
    { $inc: { questionIndex: -1 } }
  );

  return { success: true, deletedQuestionId: questionId };
}

export async function handle(request: Request) {
  try {
    await dbConnect();
    const json = superjson.parse(await request.text());
    const validatedInput = schema.parse(json);

    const result = await deleteQuestionTransaction(validatedInput);
    
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