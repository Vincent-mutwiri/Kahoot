# Last Player Standing Game Project
        
Product Requirements Document: Last Player Standing
1. Overview & Vision
This document outlines the requirements for "Last Player Standing," a real-time, multiplayer quiz game. The vision is to create a high-stakes, engaging web application where a host controls the flow of timed trivia rounds. Players are eliminated for incorrect or late answers, and the prize pot grows with each round. The game culminates when only one player remains, winning the entire pot. The user experience should be immersive, drawing thematic inspiration from modern thriller aesthetics like "Squid Game," with a focus on clear UI states, dramatic animations, and synchronized sounds.

2. User Roles
The Host (Game Master): The central figure who creates and controls the game. They manage the lobby, start rounds, reveal answers, and trigger interstitial media (GIFs/sounds) to enhance the experience.
The Player: A participant whose goal is to survive by answering questions correctly and quickly. They can be in an "active," "eliminated," or "redeemed" state.
The Spectator: A user who has been eliminated or has joined to watch. They can see the game progress, including leaderboards and questions, but cannot participate.

3. Core Features & Mechanics
3.1. Game Setup & Lobby
Game Creation: The host initiates a new game, which generates a unique, shareable 6-character alphanumeric code. The host also configures the initial prize pot and its growth mechanism (e.g., +$100 per round).
Player Join: Players join using the game code and a unique username for that game session. The system must prevent duplicate usernames in the same lobby.
Real-time Lobby: The lobby screen displays the current prize pot, a list of joined players, and their status.

3.2. Gameplay Loop
Host-Controlled Rounds: The game only progresses based on the host's actions. The host must manually trigger the start of each round, the reveal of the correct answer, and the transition to the next question.
Timed Questions: When a round starts, a multiple-choice question is displayed to all active players with a prominent 30-second countdown timer.
Answer Submission & Locking: Players select an answer. Once submitted, their choice is locked and cannot be changed.
Elimination Logic:
Players who choose the wrong answer are instantly eliminated.
Players who fail to answer before the timer expires are instantly eliminated.
The elimination status must be broadcast to all clients in real-time. Eliminated players' screens should immediately update to a "spectator" view with a clear "You are Eliminated" message.
Prize Pot Growth: After the answer reveal, the prize pot increases by the pre-configured amount, and the new total is displayed to all users.

3.3. Redemption Round
Voting Phase: Following the answer reveal, a 20-second voting round automatically begins if there were any eliminations.
Eligibility: Only players eliminated in the most recent round are eligible for redemption.
Voting Mechanism: Surviving players can cast one vote for one of the eligible eliminated players.
Real-time Vote Tally: The vote counts for each eligible player are displayed and updated live.
Redemption: The single player with the most votes is redeemed. Their status is changed back to "active," and a global notification announces their return.

3.4. Host Dashboard & Controls
Master Control Panel: A dedicated UI for the host with the following controls:
Game Flow: Buttons to "Start Game," "Start Next Question," "Reveal Answer," and "End Game."
Player Management: A real-time list of all players, their status (active/eliminated), and key stats.
Media Injection: An input field to paste a URL for a GIF and a button to "Show Media." This will display the GIF in a full-screen overlay for all players. A "Hide Media" button will dismiss it.
Sound Triggers: Buttons to play specific sound effects (e.g., "elimination sound," "suspense music") for all players.

4. UI/UX & Theming
Aesthetic: A dark, modern, and immersive theme inspired by "Squid Game."
Color Palette: Primary colors should be dark grays and blacks, with vibrant pink, teal, and yellow as accents for buttons, timers, and highlights.
Typography: Use the "Squada One" font for all major headings, timers, and game codes to establish a strong thematic identity.
Visual States: The UI must clearly communicate the current state of the game:
Lobby: Clean list of players, prominent game code.
Question Active: Large question text, clear options, and a highly visible countdown timer that changes color (e.g., green -> yellow -> red) as time runs out.
Eliminated View: A desaturated or blurred background with a stark "ELIMINATED" message.
Animations & Transitions:
Use smooth transitions between game states.
Animate the prize pot increasing.
When players are eliminated, their names on the leaderboard should dramatically turn red and move to the "Eliminated" list.

5. Acceptance Criteria
A new game can be created by a host, and players can join using the generated code.
The host must be the only user capable of advancing the game state.
Eliminations and leaderboard updates must appear for all users with less than a 1-second delay.
The prize pot must increase exactly once per question, after the answer reveal.
The redemption round must only include players from the most recent round of eliminations and revive at most one player.
The host can successfully display and hide a GIF overlay on all player screens.

Made with Floot.

# Instruction

For security reasons, the env.json file is not populated - you will need to generate or retrive the values yourself. For JWT secrets, you need to generate it with

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then paste the value.

For Floot Database, you need to request a pg_dump from support and upload it to your own postgres database, then fill up the connection string value.

Floot OAuth will not work in self-hosting environments.

For other exteranal services, retrive your API keys and fill up the values.

Then, you can build and start the service with this:

```
npm install -g pnpm
pnpm install
pnpm vite build
pnpm tsx server.ts
```
