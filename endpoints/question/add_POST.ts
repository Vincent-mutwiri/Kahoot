import dbConnect from "../../lib/db/connect";
import { Game } from "../../lib/models/Game";
import { Question } from "../../lib/models/Question";
import { schema, OutputType } from "./add_POST.schema";
import superjson from 'superjson';

async function addQuestionTransaction(validatedInput: import("./add_POST.schema").InputType) {
  const { gameCode, hostName, questionText, optionA, optionB, optionC, optionD, correctAnswer } = validatedInput;

  // 1. Find the game and validate the host
  const game = await Game.findOne({ code: gameCode });

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
  const questionCount = await Question.countDocuments({ gameId: game._id });
  const questionIndex = questionCount;

  // 3. Insert the new question
  const newQuestion = new Question({
    gameId: game._id,
    questionIndex,
    questionText,
    optionA,
    optionB,
    optionC,
    optionD,
    correctAnswer,
  });
  await newQuestion.save();

  return newQuestion;
}


export async function handle(request: Request) {
  try {
    await dbConnect();
    const json = superjson.parse(await request.text());
    const validatedInput = schema.parse(json);

    const newQuestion = await addQuestionTransaction(validatedInput);
    
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