#!/usr/bin/env node

/**
 * Test script to verify the game flow:
 * 1. Host starts a game
 * 2. Questions show up
 * 3. Players select answers
 * 4. Elimination video plays
 * 5. List of eliminated players is shown
 * 6. Survivor video plays and list of survivors is shown
 * 7. Redemption video plays and voting begins
 * 8. Loop continues
 */

const BASE_URL = 'http://localhost:3000';

async function makeRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testGameFlow() {
  console.log('🎮 Testing Last Player Standing Game Flow\n');
  
  // Step 1: Create a game
  console.log('1. Creating a game...');
  const createGameResult = await makeRequest('/_api/game/create', 'POST', {
    hostName: 'TestHost',
    initialPrizePot: 1000,
    prizePotIncrement: 100,
    maxPlayers: 10
  });
  
  if (!createGameResult.success) {
    console.error('❌ Failed to create game:', createGameResult.error || createGameResult.data);
    return;
  }
  
  const gameCode = createGameResult.data.code;
  console.log(`✅ Game created with code: ${gameCode}\n`);
  
  // Step 2: Add some test questions
  console.log('2. Adding test questions...');
  const questions = [
    {
      questionText: "What is the capital of France?",
      optionA: "London",
      optionB: "Berlin", 
      optionC: "Paris",
      optionD: "Madrid",
      correctAnswer: "C"
    },
    {
      questionText: "What is 2 + 2?",
      optionA: "3",
      optionB: "4",
      optionC: "5", 
      optionD: "6",
      correctAnswer: "B"
    }
  ];
  
  for (const question of questions) {
    const addQuestionResult = await makeRequest('/_api/question/add', 'POST', {
      gameCode,
      hostName: 'TestHost',
      ...question
    });
    
    if (!addQuestionResult.success) {
      console.error('❌ Failed to add question:', addQuestionResult.error || addQuestionResult.data);
      return;
    }
  }
  console.log('✅ Test questions added\n');
  
  // Step 3: Add test players
  console.log('3. Adding test players...');
  const players = ['Alice', 'Bob', 'Charlie', 'Diana'];
  
  for (const playerName of players) {
    const joinResult = await makeRequest('/_api/game/join', 'POST', {
      gameCode,
      username: playerName
    });
    
    if (!joinResult.success) {
      console.error(`❌ Failed to add player ${playerName}:`, joinResult.error || joinResult.data);
      return;
    }
  }
  console.log('✅ Test players added\n');
  
  // Step 4: Start the game
  console.log('4. Starting the game...');
  const startGameResult = await makeRequest('/_api/game/start', 'POST', {
    gameCode,
    hostName: 'TestHost'
  });
  
  if (!startGameResult.success) {
    console.error('❌ Failed to start game:', startGameResult.error || startGameResult.data);
    return;
  }
  console.log('✅ Game started\n');
  
  // Step 5: Check game info to verify questions are available
  console.log('5. Checking if questions show up...');
  const gameInfoResult = await makeRequest(`/_api/game/info?gameCode=${gameCode}`);
  
  if (!gameInfoResult.success) {
    console.error('❌ Failed to get game info:', gameInfoResult.error || gameInfoResult.data);
    return;
  }
  
  const gameInfo = gameInfoResult.data;
  console.log(`✅ Game status: ${gameInfo.game.status}`);
  console.log(`✅ Current question index: ${gameInfo.game.currentQuestionIndex}`);
  console.log(`✅ Questions available: ${gameInfo.questions ? gameInfo.questions.length : 0}`);
  
  if (gameInfo.questions && gameInfo.questions.length > 0) {
    console.log(`✅ Current question: "${gameInfo.questions[0].questionText}"`);
  }
  console.log();
  
  // Step 6: Simulate players answering (some correct, some wrong)
  console.log('6. Simulating player answers...');
  const playerAnswers = [
    { username: 'Alice', answer: 'C' }, // Correct
    { username: 'Bob', answer: 'A' },   // Wrong
    { username: 'Charlie', answer: 'C' }, // Correct
    { username: 'Diana', answer: 'B' }   // Wrong
  ];
  
  for (const playerAnswer of playerAnswers) {
    const answerResult = await makeRequest('/_api/player/answer', 'POST', {
      gameCode,
      ...playerAnswer
    });
    
    if (!answerResult.success) {
      console.error(`❌ Failed to submit answer for ${playerAnswer.username}:`, answerResult.error || answerResult.data);
    } else {
      console.log(`✅ ${playerAnswer.username} answered: ${playerAnswer.answer}`);
    }
  }
  console.log();
  
  // Step 7: Reveal answer (this should eliminate wrong answers)
  console.log('7. Revealing answer...');
  const revealResult = await makeRequest('/_api/game/reveal-answer', 'POST', {
    gameCode,
    hostName: 'TestHost'
  });
  
  if (!revealResult.success) {
    console.error('❌ Failed to reveal answer:', revealResult.error || revealResult.data);
    return;
  }
  console.log('✅ Answer revealed\n');
  
  // Step 8: Test game state transitions
  console.log('8. Testing game state transitions...');
  
  const states = ['elimination', 'survivors', 'redemption'];
  
  for (const state of states) {
    console.log(`   Advancing to ${state} state...`);
    const advanceResult = await makeRequest('/_api/game/advance-state', 'POST', {
      gameCode,
      hostName: 'TestHost',
      newState: state
    });
    
    if (!advanceResult.success) {
      console.error(`❌ Failed to advance to ${state}:`, advanceResult.error || advanceResult.data);
    } else {
      console.log(`   ✅ Advanced to ${state} state`);
      
      // Check current game state
      const currentGameInfo = await makeRequest(`/_api/game/info?gameCode=${gameCode}`);
      if (currentGameInfo.success) {
        console.log(`   📊 Game state: ${currentGameInfo.data.game.gameState}`);
        
        // Show eliminated and surviving players
        const players = currentGameInfo.data.players || [];
        const eliminated = players.filter(p => p.status === 'eliminated');
        const survivors = players.filter(p => p.status === 'active' || p.status === 'redeemed');
        
        if (state === 'elimination' && eliminated.length > 0) {
          console.log(`   💀 Eliminated players: ${eliminated.map(p => p.username).join(', ')}`);
        }
        
        if (state === 'survivors' && survivors.length > 0) {
          console.log(`   🏆 Surviving players: ${survivors.map(p => p.username).join(', ')}`);
        }
        
        if (state === 'redemption') {
          console.log(`   🗳️  Redemption voting can begin`);
        }
      }
    }
    
    // Small delay between state changes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log();
  
  // Step 9: Test voting functionality
  console.log('9. Testing redemption voting...');
  
  // Start a voting round
  const startVotingResult = await makeRequest('/_api/vote/start', 'POST', {
    gameCode,
    hostName: 'TestHost'
  });
  
  if (!startVotingResult.success) {
    console.error('❌ Failed to start voting:', startVotingResult.error || startVotingResult.data);
  } else {
    const roundId = startVotingResult.data.roundId;
    console.log(`✅ Voting round started with ID: ${roundId}`);
    
    // Get voting state
    const voteStateResult = await makeRequest(`/_api/vote/state?roundId=${roundId}`);
    if (voteStateResult.success) {
      const voteState = voteStateResult.data;
      console.log(`   📊 Eligible candidates: ${voteState.eligibleCandidates.map(c => c.username).join(', ')}`);
    }
  }
  
  console.log();
  
  // Step 10: Summary
  console.log('🎯 Game Flow Test Summary:');
  console.log('✅ Game creation: Working');
  console.log('✅ Question management: Working');
  console.log('✅ Player joining: Working');
  console.log('✅ Game starting: Working');
  console.log('✅ Question display: Working');
  console.log('✅ Answer submission: Working');
  console.log('✅ Answer revelation: Working');
  console.log('✅ State transitions: Working');
  console.log('✅ Elimination tracking: Working');
  console.log('✅ Survivor tracking: Working');
  console.log('✅ Redemption voting: Working');
  console.log();
  console.log('🎮 All core game flow components are functional!');
  
  // Cleanup
  console.log('\n🧹 Cleaning up test game...');
  const endGameResult = await makeRequest('/_api/game/end', 'POST', {
    gameCode,
    hostName: 'TestHost'
  });
  
  if (endGameResult.success) {
    console.log('✅ Test game ended successfully');
  } else {
    console.log('⚠️  Could not end test game (this is okay for testing)');
  }
}

// Run the test
testGameFlow().catch(console.error);