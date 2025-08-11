import dbConnect from "../../lib/db/connect";
import { Game } from "../../lib/models/Game";
import { Question } from "../../lib/models/Question";
import { schema, OutputType, InputType } from "./update_POST.schema";
import superjson from 'superjson';

async function updateQuestionTransaction(validatedInput: InputType) {
  const { gameCode, hostName, questionId, ...updateData } = validatedInput;

  // 1. Find the game and validate the host
  const game = await Game.findOne({ code: gameCode });

  if (!game) {
    throw new Error("Game not found.");
  }

  if (game.hostName !== hostName) {
    throw new Error("Unauthorized: You are not the host of this game.");
  }

  // 2. Find the question to update
  const question = await Question.findOne({
    _id: questionId,
    gameId: game._id,
  });

  if (!question) {
    throw new Error("Question not found in this game.");
  }

  // 3. Check if the question is editable
  if (game.status === 'active' && game.currentQuestionIndex !== null && question.questionIndex <= game.currentQuestionIndex) {
    throw new Error("Cannot update a question that has already been asked or is currently active.");
  }
  if (game.status === 'finished') {
    throw new Error("Cannot update questions in a finished game.");
  }

  // 4. Update the question
  const updatedQuestion = await Question.findByIdAndUpdate(questionId, updateData, { new: true });

  return updatedQuestion;
}

export async function handle(request: Request) {
  try {
    await dbConnect();
    const json = superjson.parse(await request.text());
    const validatedInput = schema.parse(json);

    const updatedQuestion = await updateQuestionTransaction(validatedInput);
    
    return new Response(superjson.stringify(updatedQuestion satisfies OutputType), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
    });

  } catch (error) {
    console.error("Error updating question:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
    });
  }
}