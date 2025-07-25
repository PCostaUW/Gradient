import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, push, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase app and database
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentRoomId = null;
let currentPlayerName = null;

// Create or join room and register player
export function createOrJoinRoom() {
  const roomId = document.getElementById('room-id').value.trim();
  const playerName = document.getElementById('player-name').value.trim();
  if (!roomId || !playerName) {
    alert("Enter room name and your player name");
    return;
  }

  currentRoomId = roomId;
  currentPlayerName = playerName;

  document.getElementById('room-section').style.display = 'none';
  document.getElementById('game-section').style.display = 'block';
  document.getElementById('scoreboard').style.display = 'block';

  const roomRef = ref(db, `rooms/${roomId}`);

  // Initialize room if it doesn't exist
  set(roomRef, {
    state: {
      spectrum: { start: "Hot", end: "Cold" },
      clue: "lava",
      value: 70,
      round: 1,
      guessesSubmitted: 0,
      roundActive: true
    },
    players: {}
  });

  // Add player to room if not exists, initialize score 0
  set(ref(db, `rooms/${roomId}/players/${playerName}`), {
    score: 0,
    guess: null
  });

  // Listen for state changes (clue, spectrum, round info)
  onValue(ref(db, `rooms/${roomId}/state`), (snapshot) => {
    const state = snapshot.val();
    if (!state) return;

    document.getElementById('spectrum-label').textContent = `${state.spectrum.start} ←→ ${state.spectrum.end}`;
    document.getElementById('clue-label').textContent = `Clue: ${state.clue}`;

    // Enable/disable guess submit based on roundActive
    document.getElementById('guess-slider').disabled = !state.roundActive;
  });

  // Listen for players' scores to update scoreboard
  onValue(ref(db, `rooms/${roomId}/players`), (snapshot) => {
    const players = snapshot.val() || {};
    const scoreList = document.getElementById('score-list');
    scoreList.innerHTML = '';
    for (const [name, data] of Object.entries(players)) {
      const li = document.createElement('li');
      li.textContent = `${name}: ${data.score} points`;
      scoreList.appendChild(li);
    }
  });
}

// Player submits a guess
export function submitGuess() {
  const guessValue = parseInt(document.getElementById('guess-slider').value);
  if (!currentRoomId || !currentPlayerName) {
    alert("Join a room first");
    return;
  }

  const playerGuessRef = ref(db, `rooms/${currentRoomId}/players/${currentPlayerName}`);

  // Update player's guess
  update(playerGuessRef, { guess: guessValue });

  // Increment guessesSubmitted count atomically
  const guessesRef = ref(db, `rooms/${currentRoomId}/state/guessesSubmitted`);
  guessesRef.transaction(current => (current || 0) + 1);

  // Check if all players have submitted guess, then calculate scores
  checkAndScoreRound();
}

// Check if all players submitted guesses and score round
function checkAndScoreRound() {
  const playersRef = ref(db, `rooms/${currentRoomId}/players`);
  const stateRef = ref(db, `rooms/${currentRoomId}/state`);

  Promise.all([
    playersRef.get(),
    stateRef.get()
  ]).then(([playersSnap, stateSnap]) => {
    const players = playersSnap.val() || {};
    const state = stateSnap.val();

    if (!state || !players) return;

    const totalPlayers = Object.keys(players).length;
    const guessesSubmitted = state.guessesSubmitted || 0;

    if (guessesSubmitted >= totalPlayers && state.roundActive) {
      // All guesses in, score and start next round
      scoreRound(players, state);
    }
  });
}

// Score round and prepare next round
function scoreRound(players, state) {
  const updates = {};
  const correctValue = state.value;

  // Calculate score for each player
  for (const [name, pdata] of Object.entries(players)) {
    const guess = pdata.guess;
    if (guess === null || guess === undefined) continue;

    // Simple scoring: inverse of distance
    const diff = Math.abs(guess - correctValue);
    const scoreIncrement = Math.max(0, 100 - diff);

    updates[`players/${name}/score`] = (pdata.score || 0) + scoreIncrement;
    updates[`players/${name}/guess`] = null; // reset guess for next round
  }

  // Reset guessesSubmitted, roundActive false to block guessing during transition
  updates[`state/guessesSubmitted`] = 0;
  updates[`state/roundActive`] = false;

  update(ref(db, `rooms/${currentRoomId}`), updates).then(() => {
    // After a delay, start next round
    setTimeout(() => startNextRound(state.round + 1), 5000);
  });
}

// Start next round with new spectrum/clue/value
function startNextRound(nextRoundNum) {
  const roomRef = ref(db, `rooms/${currentRoomId}/state`);

  // For demo: rotate spectrum and clues simply
  const spectra = [
    { start: "Wet", end: "Dry" },
    { start: "Bright", end: "Dark" },
    { start: "Soft", end: "Hard" },
  ];
  const clues = ["rain", "night", "feather"];
  const values = [30, 60, 80];

  const index = (nextRoundNum - 1) % spectra.length;

  set(roomRef, {
    spectrum: spectra[index],
    clue: clues[index],
    value: values[index],
    round: nextRoundNum,
    guessesSubmitted: 0,
    roundActive: true
  });
}

// Add custom spectrum entered by the user
export function addCustomSpectrum() {
  const start = document.getElementById('custom-start').value.trim();
  const end = document.getElementById('custom-end').value.trim();

  if (!start || !end) {
    alert("Please enter both start and end of the spectrum");
    return;
  }

  if (!currentRoomId) {
    alert("You must join a room first");
    return;
  }

  const spectraRef = ref(db, `rooms/${currentRoomId}/spectrums`);

  push(spectraRef, { start, end })
    .then(() => {
      alert("Spectrum added successfully!");
      document.getElementById('custom-start').value = '';
      document.getElementById('custom-end').value = '';
    })
    .catch(error => {
      alert("Failed to add spectrum: " + error.message);
    });
}

// Attach event listeners after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('join-room')?.addEventListener('click', createOrJoinRoom);
  document.getElementById('submit-guess')?.addEventListener('click', submitGuess);
  document.getElementById('add-spectrum')?.addEventListener('click', addCustomSpectrum);
});
