import { Game } from './models/Game.js';
import { broadcastToGame } from './websocket.js';

const TIMERS = {
  QUESTION_DURATION: 30000, // 30 seconds
  ELIMINATION_VIDEO: 5000,  // 5 seconds
  SURVIVORS_VIDEO: 3000,    // 3 seconds
  REDEMPTION_VIDEO: 2000,   // 2 seconds
  VOTING_DURATION: 20000,   // 20 seconds
};

export async function startAutoFlow(gameCode: string) {
  const game = await Game.findOne({ code: gameCode });
  if (!game || game.status !== 'active') return;

  // Start question timer
  setTimeout(() => autoRevealAnswer(gameCode), TIMERS.QUESTION_DURATION);
}

async function autoRevealAnswer(gameCode: string) {
  const game = await Game.findOne({ code: gameCode });
  if (!game || game.status !== 'active') return;

  broadcastToGame(gameCode, { type: 'REVEAL_ANSWER', gameCode });
  
  // Auto advance to elimination
  setTimeout(() => autoAdvanceToElimination(gameCode), 2000);
}

async function autoAdvanceToElimination(gameCode: string) {
  const game = await Game.findOne({ code: gameCode });
  if (!game) return;

  game.gameState = 'elimination';
  await game.save();
  broadcastToGame(gameCode, { type: 'GAME_STATE_CHANGED', gameCode, gameState: 'elimination' });
  
  // Auto advance to survivors
  setTimeout(() => autoAdvanceToSurvivors(gameCode), TIMERS.ELIMINATION_VIDEO);
}

async function autoAdvanceToSurvivors(gameCode: string) {
  const game = await Game.findOne({ code: gameCode });
  if (!game) return;

  game.gameState = 'survivors';
  await game.save();
  broadcastToGame(gameCode, { type: 'GAME_STATE_CHANGED', gameCode, gameState: 'survivors' });
  
  // Auto advance to redemption
  setTimeout(() => autoAdvanceToRedemption(gameCode), TIMERS.SURVIVORS_VIDEO);
}

async function autoAdvanceToRedemption(gameCode: string) {
  const game = await Game.findOne({ code: gameCode });
  if (!game) return;

  game.gameState = 'redemption';
  await game.save();
  broadcastToGame(gameCode, { type: 'GAME_STATE_CHANGED', gameCode, gameState: 'redemption' });
  
  // Auto start voting
  setTimeout(() => autoStartVoting(gameCode), TIMERS.REDEMPTION_VIDEO);
}

async function autoStartVoting(gameCode: string) {
  // Start voting round automatically
  broadcastToGame(gameCode, { type: 'VOTING_STARTED', gameCode });
  
  // Auto end voting and continue to next question
  setTimeout(() => autoNextQuestion(gameCode), TIMERS.VOTING_DURATION);
}

async function autoNextQuestion(gameCode: string) {
  const game = await Game.findOne({ code: gameCode });
  if (!game) return;

  game.currentQuestionIndex = (game.currentQuestionIndex || 0) + 1;
  game.gameState = 'question';
  game.updatedAt = new Date();
  await game.save();

  broadcastToGame(gameCode, { type: 'NEXT_QUESTION', gameCode });
  broadcastToGame(gameCode, { type: 'GAME_STATE_CHANGED', gameCode, gameState: 'question' });
  
  // Start the cycle again
  setTimeout(() => autoRevealAnswer(gameCode), TIMERS.QUESTION_DURATION);
}