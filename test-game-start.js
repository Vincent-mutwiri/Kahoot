#!/usr/bin/env node

/**
 * Quick test to verify players can see when host starts the game
 */

const BASE_URL = 'http://localhost:3000';

async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
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

async function testGameStart() {
  console.log('🎮 Testing Game Start Visibility\n');
  
  try {
    // 1. Create game
    console.log('1. Creating game...');
    const createResult = await apiRequest('/_api/game/create', 'POST', {
      hostName: 'TestHost',
      initialPrizePot: 1000,
      maxPlayers: 10
    });
    
    if (!createResult.success) {
      throw new Error(`Failed to create game: ${createResult.error}`);
    }
    
    const gameCode = createResult.data.code;
    console.log(`   ✅ Game created: ${gameCode}`);
    
    // 2. Add a test question
    console.log('2. Adding test question...');
    const addQuestionResult = await apiRequest('/_api/question/add', 'POST', {
      gameCode,
      hostName: 'TestHost',
      questionText: "Test question?",
      optionA: "A", optionB: "B", optionC: "C", optionD: "D",
      correctAnswer: "A"
    });
    
    if (!addQuestionResult.success) {
      throw new Error(`Failed to add question: ${addQuestionResult.error}`);
    }
    console.log('   ✅ Question added');
    
    // 3. Add test player
    console.log('3. Adding test player...');
    const joinResult = await apiRequest('/_api/game/join', 'POST', {
      gameCode,
      username: 'TestPlayer'
    });
    
    if (!joinResult.success) {
      throw new Error(`Failed to join game: ${joinResult.error}`);
    }
    console.log('   ✅ Player joined');
    
    // 4. Check initial game state (should be lobby)
    console.log('4. Checking initial game state...');
    const initialGameInfo = await apiRequest(`/_api/game/info?gameCode=${gameCode}`);
    if (initialGameInfo.success) {
      console.log(`   📊 Initial status: ${initialGameInfo.data.game.status}`);
      console.log(`   📊 Initial gameState: ${initialGameInfo.data.game.gameState}`);
    }
    
    // 5. Check player state before game starts
    console.log('5. Checking player state before start...');
    const initialPlayerState = await apiRequest(`/_api/player/state?gameCode=${gameCode}&username=TestPlayer`);
    if (initialPlayerState.success) {
      console.log(`   👤 Player sees game status: ${initialPlayerState.data.game.status}`);
      console.log(`   👤 Player sees game state: ${initialPlayerState.data.game.gameState}`);
    }
    
    // 6. Start the game
    console.log('6. Starting game...');
    const startResult = await apiRequest('/_api/game/start', 'POST', {
      gameCode,
      hostName: 'TestHost'
    });
    
    if (!startResult.success) {
      throw new Error(`Failed to start game: ${startResult.error}`);
    }
    console.log('   ✅ Game started by host');
    
    // 7. Check game state after start
    console.log('7. Checking game state after start...');
    const updatedGameInfo = await apiRequest(`/_api/game/info?gameCode=${gameCode}`);
    if (updatedGameInfo.success) {
      console.log(`   📊 Updated status: ${updatedGameInfo.data.game.status}`);
      console.log(`   📊 Updated gameState: ${updatedGameInfo.data.game.gameState}`);
      console.log(`   📊 Current question index: ${updatedGameInfo.data.game.currentQuestionIndex}`);
    }
    
    // 8. Check if player can see the game has started
    console.log('8. Checking if player sees game started...');
    const updatedPlayerState = await apiRequest(`/_api/player/state?gameCode=${gameCode}&username=TestPlayer`);
    if (updatedPlayerState.success) {
      const playerData = updatedPlayerState.data;
      console.log(`   👤 Player sees game status: ${playerData.game.status}`);
      console.log(`   👤 Player sees game state: ${playerData.game.gameState}`);
      console.log(`   👤 Player sees current question: ${playerData.currentQuestion ? 'YES' : 'NO'}`);
      
      if (playerData.game.status === 'active') {
        console.log('   ✅ SUCCESS: Player can see the game has started!');
        
        if (playerData.currentQuestion) {
          console.log(`   ✅ Player can see question: "${playerData.currentQuestion.questionText}"`);
        } else {
          console.log('   ⚠️  Player cannot see current question (may need to wait)');
        }
      } else {
        console.log('   ❌ ISSUE: Player still sees game as not started');
      }
    } else {
      console.log('   ❌ Failed to get player state after game start');
    }
    
    // 9. Test WebSocket message (simulate)
    console.log('9. WebSocket should broadcast game start...');
    console.log('   ℹ️  In the browser, WebSocket will trigger refetch when game starts');
    console.log('   ℹ️  Players should see transition from lobby to question view');
    
    console.log('\n🎯 TEST RESULTS:');
    if (updatedPlayerState.success && updatedPlayerState.data.game.status === 'active') {
      console.log('✅ Game start visibility: WORKING');
      console.log('✅ Players can see when host starts the game');
    } else {
      console.log('❌ Game start visibility: NOT WORKING');
      console.log('❌ Players cannot see when host starts the game');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Check server and run test
async function main() {
  try {
    await fetch(`${BASE_URL}/_api/game/info?gameCode=test`);
    console.log('✅ Server is running\n');
    await testGameStart();
  } catch (error) {
    console.error('❌ Server is not running. Start with: npm run dev');
  }
}

main().catch(console.error);