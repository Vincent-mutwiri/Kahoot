# Game Flow Testing Checklist

## Overview
This checklist helps verify that the complete game flow works as expected:

1. ✅ Host starts a game
2. ✅ Questions show up for players
3. ✅ Players select their answers
4. ✅ Elimination video plays
5. ✅ List of eliminated players is shown
6. ✅ Survivor video plays and list of survivors is shown
7. ✅ Redemption video plays and voting begins
8. ✅ Players vote to redeem one person
9. ✅ Loop continues to next question

## Manual Testing Steps

### Setup Phase
1. **Start the server**
   ```bash
   npm run dev
   ```

2. **Open two browser windows/tabs:**
   - Host dashboard: `http://localhost:3000/host/[GAME_CODE]`
   - Player view: `http://localhost:3000/game/[GAME_CODE]`

### Test Execution

#### Step 1: Game Creation & Setup
- [ ] Create a new game from home page
- [ ] Note the game code
- [ ] Add at least 2-3 test questions in host dashboard
- [ ] Join the game as 2-4 test players (use different browser tabs/incognito)
- [ ] Verify all players appear in the lobby

#### Step 2: Start Game & Question Display
- [ ] Click "Start Game" in host dashboard
- [ ] **VERIFY:** Questions show up for all players
- [ ] **VERIFY:** Timer starts counting down
- [ ] **VERIFY:** Players can see question text and options A, B, C, D

#### Step 3: Answer Submission
- [ ] Have players select different answers (some correct, some wrong)
- [ ] **VERIFY:** Players can select answers
- [ ] **VERIFY:** Selected answers are highlighted
- [ ] **VERIFY:** Players cannot change answers after selection

#### Step 4: Answer Revelation & Elimination
- [ ] Click "Reveal Answer" in host dashboard
- [ ] **VERIFY:** Correct answer is shown
- [ ] **VERIFY:** Players with wrong answers are marked as eliminated

#### Step 5: Elimination Sequence
- [ ] Click "Start Elimination" in host dashboard
- [ ] **VERIFY:** Game state changes to 'elimination'
- [ ] **VERIFY:** Elimination video plays (if configured)
- [ ] **VERIFY:** List of eliminated players is displayed
- [ ] **VERIFY:** Eliminated players see elimination view

#### Step 6: Survivors Sequence
- [ ] Click "Show Survivors" in host dashboard
- [ ] **VERIFY:** Game state changes to 'survivors'
- [ ] **VERIFY:** Survivor video plays (if configured)
- [ ] **VERIFY:** List of surviving players is displayed
- [ ] **VERIFY:** Survivors are clearly identified

#### Step 7: Redemption Sequence
- [ ] Click "Start Redemption" in host dashboard
- [ ] **VERIFY:** Game state changes to 'redemption'
- [ ] **VERIFY:** Redemption video plays (if configured)
- [ ] **VERIFY:** Voting interface appears for surviving players

#### Step 8: Redemption Voting
- [ ] Click "Start Voting" in host dashboard
- [ ] **VERIFY:** Voting modal opens for surviving players
- [ ] **VERIFY:** Eliminated players are shown as voting candidates
- [ ] **VERIFY:** Surviving players can cast votes
- [ ] **VERIFY:** Vote counts are displayed in real-time
- [ ] Click "End Voting" after players vote
- [ ] **VERIFY:** Voting results are shown
- [ ] **VERIFY:** Redeemed player (if any) is marked as 'redeemed'

#### Step 9: Loop Continuation
- [ ] Click "Next Question" in host dashboard
- [ ] **VERIFY:** Game advances to next question
- [ ] **VERIFY:** New question is displayed to all active players
- [ ] **VERIFY:** Redeemed players can participate again
- [ ] **VERIFY:** Game loop can repeat from Step 3

## Expected Game States Flow

```
lobby → question → elimination → survivors → redemption → question → ...
```

## Key Components to Verify

### Host Dashboard
- [ ] Master controls work (Start Game, Reveal Answer, Next Question)
- [ ] State advancement buttons work (Elimination, Survivors, Redemption)
- [ ] Player lists update correctly (Active vs Eliminated)
- [ ] Voting controls work (Start/End Voting)

### Player View
- [ ] Question display with timer
- [ ] Answer selection interface
- [ ] Elimination view for eliminated players
- [ ] Survivor celebration view
- [ ] Redemption voting interface
- [ ] Real-time updates via WebSocket

### Game State Management
- [ ] Proper state transitions
- [ ] Player status updates (active → eliminated → redeemed)
- [ ] Question progression
- [ ] Prize pot updates

## Video Integration Points

### Elimination Video
- **When:** After answer revelation, when advancing to 'elimination' state
- **Shows:** Dramatic elimination sequence
- **Displays:** List of eliminated players

### Survivor Video
- **When:** When advancing to 'survivors' state
- **Shows:** Celebration/survival sequence
- **Displays:** List of surviving players

### Redemption Video
- **When:** When advancing to 'redemption' state
- **Shows:** Voting/redemption sequence
- **Triggers:** Voting interface for survivors

## Troubleshooting

### Common Issues
1. **Questions not showing:** Check if questions were added to the game
2. **Players not eliminated:** Verify answer submission and revelation
3. **Videos not playing:** Check if video URLs are configured in settings
4. **Voting not working:** Ensure voting round is started and players are eligible
5. **WebSocket issues:** Check browser console for connection errors

### Debug Tools
- Browser Developer Tools (Network, Console tabs)
- Host dashboard player lists
- Game info API endpoint: `/_api/game/info?gameCode=[CODE]`

## Success Criteria

✅ **Complete Flow Working:** All 9 steps execute without errors
✅ **State Management:** Game states transition properly
✅ **Player Management:** Elimination and redemption work correctly
✅ **Video Integration:** Videos play at appropriate times
✅ **Voting System:** Redemption voting functions properly
✅ **Loop Continuation:** Game can continue to subsequent rounds

---

**Note:** Run the automated test script `test-specific-flow.js` for a programmatic verification of the API endpoints, then use this manual checklist to verify the UI components work correctly.