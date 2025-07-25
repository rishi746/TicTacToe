// Dialog elements
let startDialog = document.getElementById('startDialog');
let createGameBtn = document.getElementById('createGameBtn');
let joinGameBtn = document.getElementById('joinGameBtn');
let tournamentBtn = document.getElementById('tournamentBtn'); // New: For navigating to tournament options
let leaderboardBtn = document.getElementById('leaderboardBtn'); // New: For navigating to leaderboard

let joinDialog = document.getElementById('joinDialog');
let joinDialogTitle = document.getElementById('joinDialogTitle');
let joinDialogSubtitle = document.getElementById('joinDialogSubtitle');
let actionBtn = document.getElementById('actionBtn'); // This will be Create Game or Join Game button

let roomFullDialog = document.getElementById('roomFullDialog');
let tryAgainBtn = document.getElementById('tryAgainBtn');

let invalidRoomDialog = document.getElementById('invalidRoomDialog');
let invalidRoomTitle = document.getElementById('invalidRoomTitle');
let invalidRoomMessage = document.getElementById('invalidRoomMessage');
let invalidRoomOkBtn = document.getElementById('invalidRoomOkBtn');

let gameContainer = document.getElementById('gameContainer');
let roomInput = document.getElementById('roomInput');
let nameInput = document.getElementById('nameInput');

// Scoreboard elements
let yourSymbol = document.getElementById('yourSymbol');
let yourName = document.getElementById('yourName');
let yourScore = document.getElementById('yourScore');
let opponentSymbol = document.getElementById('opponentSymbol');
let opponentName = document.getElementById('opponentName');
let opponentScore = document.getElementById('opponentScore');

// Game elements
let boxes = document.querySelectorAll('.box');
let winner = document.querySelector('.Winner');
let line = document.querySelector('.line');
let countdownBar = document.querySelector('.countdown-bar');
let turnIndicator = document.querySelector('.turn-indicator');
let chatMessages = document.getElementById('chatMessages');
let chatInput = document.getElementById('chatInput');
let sendBtn = document.getElementById('sendBtn');

// Game variables
let socket;
let playerSymbol = "";
let playerName = "";
let opponentPlayerName = "";
let turn = "X";
let gameActive = false;
let scores = { player: 0, opponent: 0 };
let originalTitle = document.title;
let isTabActive = true;
let gameActionType = ''; // 'create', 'join', 'tournamentMatchJoin'

// Tournament Elements (matching index.html IDs)
let tournamentModeDialog = document.getElementById('tournamentModeDialog');
let createTournamentBtn = document.getElementById('createTournamentBtn'); // Inside tournamentModeDialog
let joinTournamentBtn = document.getElementById('joinTournamentBtn'); // Inside tournamentModeDialog
let backFromTournamentBtn = document.getElementById('backFromTournamentBtn');

let createTournamentDialog = document.getElementById('createTournamentDialog');
let tournamentIdInput = document.getElementById('tournamentIdInput');
let tournamentNameInput = document.getElementById('tournamentNameInput');
let tournamentTypeSelect = document.getElementById('tournamentTypeSelect');
let createTournamentConfirmBtn = document.getElementById('createTournamentConfirmBtn');
let backFromCreateTournamentBtn = document.getElementById('backFromCreateTournamentBtn');

let joinTournamentDialog = document.getElementById('joinTournamentDialog');
let joinTournamentIdInput = document.getElementById('joinTournamentIdInput');
let joinTournamentNameInput = document.getElementById('joinTournamentNameInput');
let joinTournamentConfirmBtn = document.getElementById('joinTournamentConfirmBtn');
let backFromJoinTournamentBtn = document.getElementById('backFromJoinTournamentBtn');

let tournamentLobbyDialog = document.getElementById('tournamentLobbyDialog');
let tournamentLobbyTitle = document.getElementById('tournamentLobbyTitle');
let tournamentPlayersList = document.getElementById('tournamentPlayersList');
let startTournamentButton = document.getElementById('startTournamentBtn'); // Corrected from 'startTournamentButton'
let leaveTournamentLobbyBtn = document.getElementById('leaveTournamentBtn'); // Corrected from 'leaveTournamentLobbyBtn'

let tournamentBracketDialog = document.getElementById('tournamentBracketDialog');
let tournamentRoundInfo = document.getElementById('tournamentRoundInfo'); // Corrected from 'currentRoundDisplay'
let bracketContainer = document.getElementById('bracketContainer'); // Corrected from 'tournamentBracketDisplay'
let closeBracketViewBtn = document.getElementById('closeBracketBtn'); // Corrected from 'closeBracketViewBtn'

let leaderboardSection = document.getElementById('leaderboardSection'); // Corrected from 'leaderboardDialog' (this is the overlay)
let leaderboardTableBody = document.getElementById('leaderboardTableBody'); // Corrected from 'leaderboardList'
let closeLeaderboardDialogBtn = document.getElementById('closeLeaderboardDialogBtn'); // Corrected from 'closeLeaderboardBtn'

// Game state variables for tournament
let currentTournament = null;
let currentMatchScore = { player: 0, opponent: 0 };
let bestOfCount = 0; // Will be 3, 5, or 7
let tournamentGameInProgress = false; // Flag to indicate if current game is part of a tournament match
let currentTournamentMatchId = null; // Store the current match ID from the tournament bracket

const winningCombos = [
  [0, 1, 2],
  [0, 3, 6],
  [0, 4, 8],
  [1, 4, 7],
  [2, 5, 8],
  [2, 4, 6],
  [3, 4, 5],
  [6, 7, 8]
];

const linePositions = {
  0: { top: "16.67%", left: "0%", width: "100%", rotate: "0deg" },
  1: { top: "0%", left: "16.67%", width: "100%", rotate: "90deg" },
  2: { top: "0%", left: "0%", width: "141.5%", rotate: "45deg" },
  3: { top: "16.67%", left: "50%", width: "100%", rotate: "90deg" },
  4: { top: "16.67%", left: "83.33%", width: "100%", rotate: "90deg" },
  5: { top: "0%", left: "0%", width: "141.5%", rotate: "-45deg" },
  6: { top: "50%", left: "0%", width: "100%", rotate: "0deg" },
  7: { top: "83.33%", left: "0%", width: "100%", rotate: "0deg" }
};

// Initialize hidden elements
line.classList.add('hide');
winner.classList.add('hide');
countdownBar.classList.add('hide');
gameContainer.classList.add('hide'); // Ensure game container is hidden initially

// --- Socket Initialization (Moved to top level) ---
socket = io(); // Connect to the socket.io server

// --- Initial Dialog Flow ---
startDialog.classList.remove('hide'); // Show the initial start dialog first

// Event listeners for main start dialog
createGameBtn.addEventListener('click', () => {
    startDialog.classList.add('hide');
    joinDialog.classList.remove('hide');
    joinDialogTitle.textContent = "Create Your Game Room";
    joinDialogSubtitle.textContent = "Enter a unique room ID and your name.";
    actionBtn.textContent = "Create Game";
    gameActionType = 'create';
    roomInput.focus();
});

joinGameBtn.addEventListener('click', () => {
    startDialog.classList.add('hide');
    joinDialog.classList.remove('hide');
    joinDialogTitle.textContent = "Join An Existing Game";
    joinDialogSubtitle.textContent = "Enter the room ID and your name to join.";
    actionBtn.textContent = "Join Game";
    gameActionType = 'join';
    roomInput.focus();
});

tournamentBtn.addEventListener('click', () => {
    startDialog.classList.add('hide');
    tournamentModeDialog.classList.remove('hide');
});

leaderboardBtn.addEventListener('click', () => {
    startDialog.classList.add('hide');
    leaderboardSection.classList.remove('hide');
    socket.emit('get-leaderboard'); // Request leaderboard data
});


// Event listeners for Tournament Mode Dialog
createTournamentBtn.addEventListener('click', () => {
    tournamentModeDialog.classList.add('hide');
    createTournamentDialog.classList.remove('hide');
    tournamentIdInput.focus();
});

joinTournamentBtn.addEventListener('click', () => {
    tournamentModeDialog.classList.add('hide');
    joinTournamentDialog.classList.remove('hide');
    joinTournamentIdInput.focus();
});

backFromTournamentBtn.addEventListener('click', () => {
    tournamentModeDialog.classList.add('hide');
    startDialog.classList.remove('hide');
});

// Event listeners for Create Tournament Dialog
createTournamentConfirmBtn.addEventListener('click', () => {
    const tournamentId = tournamentIdInput.value.trim();
    const name = tournamentNameInput.value.trim();
    const type = tournamentTypeSelect.value;

    if (!tournamentId) {
        tournamentIdInput.focus();
        return;
    }
    if (!name) {
        tournamentNameInput.focus();
        return;
    }

    playerName = name; // Set global playerName
    socket.emit("create-tournament", { tournamentId, type, playerName });
});

backFromCreateTournamentBtn.addEventListener('click', () => {
    createTournamentDialog.classList.add('hide');
    tournamentModeDialog.classList.remove('hide');
});

// Event listeners for Join Tournament Dialog
joinTournamentConfirmBtn.addEventListener('click', () => {
    const tournamentId = joinTournamentIdInput.value.trim();
    const name = joinTournamentNameInput.value.trim();

    if (!tournamentId) {
        joinTournamentIdInput.focus();
        return;
    }
    if (!name) {
        joinTournamentNameInput.focus();
        return;
    }

    playerName = name; // Set global playerName
    socket.emit("join-tournament", { tournamentId, playerName });
});

backFromJoinTournamentBtn.addEventListener('click', () => {
    joinTournamentDialog.classList.add('hide');
    tournamentModeDialog.classList.remove('hide');
});


// Main action button for regular games
actionBtn.addEventListener('click', () => {
    const roomId = roomInput.value.trim();
    const name = nameInput.value.trim();

    if (!roomId) {
        roomInput.focus();
        return;
    }

    if (!name) {
        nameInput.focus();
        return;
    }

    playerName = name;

    if (gameActionType === 'create' || gameActionType === 'join') {
        socket.emit("join-room", { roomId, playerName: name, type: gameActionType });
    } else if (gameActionType === 'tournamentMatchJoin') {
        // For joining a tournament match room
        socket.emit("join-room", {
            roomId,
            playerName: name,
            type: 'join', // Always 'join' for tournament matches as rooms are pre-created
            tournamentId: currentTournament.tournamentId,
            matchId: currentTournamentMatchId
        });
    }
});

// Enter key handlers for inputs in regular join/create game dialog
roomInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (roomInput.value.trim()) {
            nameInput.focus();
        }
    }
});

nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        actionBtn.click();
    }
});

// --- Socket Event Handlers ---

socket.on("player-assigned", (data) => {
    playerSymbol = data.symbol;
    playerName = data.playerName;
    boxes.forEach(box => box.disabled = true);

    yourSymbol.textContent = playerSymbol;
    yourName.textContent = `${playerName} (You)`;

    joinDialog.classList.add('hide');
    gameContainer.classList.remove('hide');

    if (data.symbol === "X") {
        winner.classList.remove("hide");
        winner.innerText = "Waiting for opponent...";
    }

    addSystemMessage(`You joined as ${playerName} (${playerSymbol})`);

    // Check if this is a tournament match
    if (gameActionType === 'tournamentMatchJoin' && currentTournamentMatchId) {
        tournamentGameInProgress = true; // Set flag
        // Update scoreboard to show current match score (0-0 initially)
        yourScore.textContent = currentMatchScore.player;
        opponentScore.textContent = currentMatchScore.opponent;
        addSystemMessage(`Match score: ${currentMatchScore.player} - ${currentMatchScore.opponent} (Best of ${bestOfCount})`);
    } else {
        tournamentGameInProgress = false; // Ensure flag is false for regular games
        yourScore.textContent = scores.player;
        opponentScore.textContent = scores.opponent;
    }
});

socket.on("both-players-ready", (data) => {
    winner.classList.remove("hide");
    winner.innerText = "Game Started!";
    gameActive = true;
    turnIndicator.classList.remove("hide");
    updateTurnIndicator();
    enableChat(); // Enable chat when game starts
    // Update opponent info in scoreboard
    if (data && data.opponentName) {
        opponentPlayerName = data.opponentName;
        opponentName.textContent = opponentPlayerName;
        opponentSymbol.textContent = playerSymbol === "X" ? "O" : "X";
    }
    if (playerSymbol === "X") { // Only X can make the first move
        boxes.forEach((box) => {
            if (box.innerText === "") box.disabled = false;
        });
    }
    setTimeout(() => {
        winner.classList.add('hide');
    }, 2000);
});

socket.on("room-full", () => {
    joinDialog.classList.add('hide');
    roomFullDialog.classList.remove('hide');
});

socket.on("room-not-found", () => {
    joinDialog.classList.add('hide');
    invalidRoomDialog.classList.remove('hide');
    invalidRoomTitle.textContent = "Room Not Found";
    invalidRoomMessage.textContent = "The room ID you entered does not exist.";
    invalidRoomOkBtn.textContent = "Ok";
});

tryAgainBtn.addEventListener('click', () => {
    roomFullDialog.classList.add('hide');
    startDialog.classList.remove('hide');
    roomInput.value = '';
    nameInput.value = '';
});

invalidRoomOkBtn.addEventListener('click', () => {
    invalidRoomDialog.classList.add('hide');
    startDialog.classList.remove('hide');
    roomInput.value = '';
    nameInput.value = '';
});

socket.on("player-moved", (data) => {
    boxes[data.index].innerText = data.symbol;
    turn = data.nextTurn;
    updateTurnIndicator();
    if (data.nextTurn === playerSymbol) {
        boxes.forEach((box) => {
            if (box.innerText === "") box.disabled = false;
        });
    } else {
        boxes.forEach(box => box.disabled = true);
    }
});

socket.on("game-reset", (data) => {
    boxes.forEach(box => {
        box.innerText = "";
        box.disabled = true;
    });
    line.classList.add("hide");
    winner.classList.add("hide");
    countdownBar.classList.add("hide");
    gameActive = true; // Game is active again after reset
    turn = data.nextTurn; // Get who starts next game
    updateTurnIndicator();
    if (playerSymbol === turn) {
        boxes.forEach((box) => {
            if (box.innerText === "") box.disabled = false;
        });
    }
    addSystemMessage("Game board has been reset.");
});

socket.on("opponent-left", () => {
    addSystemMessage("Your opponent has left the room. Waiting for a new opponent or room will close.");
    boxes.forEach(box => box.disabled = true);
    gameActive = false;
    winner.classList.remove("hide");
    winner.innerText = "Opponent Left!";
    turnIndicator.classList.add("hide");
    disableChat();
});

socket.on("room-closed", () => {
    addSystemMessage("The room has been closed due to opponent leaving or inactivity.");
    // Hide game elements and show initial dialog
    gameContainer.classList.add('hide');
    startDialog.classList.remove('hide'); // Go back to start screen
    resetGameAndUI();
});

socket.on("chat-message", (message) => {
    addChatMessage(message.sender, message.text, message.senderSocketId === socket.id);
    if (!isTabActive) {
        document.title = "New Message! - " + originalTitle;
    }
});

// --- Tournament Specific Socket Event Handlers ---

socket.on("tournament-created", (data) => {
    const { tournamentId, type } = data;
    currentTournament = { tournamentId, type, players: [], status: 'waiting' }; // Initialize tournament data
    createTournamentDialog.classList.add('hide');
    tournamentLobbyDialog.classList.remove('hide');
    tournamentLobbyTitle.textContent = `Tournament Lobby: ${tournamentId} (${type.toUpperCase()})`;
    updateTournamentLobby([{ id: socket.id, name: playerName, wins: 0, losses: 0 }], socket.id); // Add self to lobby
    addSystemMessage(`Tournament "${tournamentId}" (${type.toUpperCase()}) created. Waiting for players...`);
    startTournamentButton.classList.remove('hide'); // Show start button for creator
});

socket.on("tournament-updated", (data) => {
    const { players, status, type, tournamentId } = data;
    if (!currentTournament) { // If joining an existing tournament
        currentTournament = { tournamentId: tournamentId, type, players, status }; // tournamentId comes from data
    } else {
        currentTournament.players = players;
        currentTournament.status = status;
    }
    joinTournamentDialog.classList.add('hide'); // Hide join dialog if joining
    createTournamentDialog.classList.add('hide'); // Hide create dialog if updated
    tournamentLobbyDialog.classList.remove('hide');
    tournamentLobbyTitle.textContent = `Tournament Lobby: ${currentTournament.tournamentId} (${currentTournament.type.toUpperCase()})`;
    updateTournamentLobby(currentTournament.players, socket.id);
    addSystemMessage(`Tournament "${currentTournament.tournamentId}" updated. Players: ${players.length}`);
    // Hide start button if not the creator or if already started
    const isCreator = currentTournament.players.some(p => p.id === socket.id && p.isCreator);
    if (isCreator && currentTournament.status === 'waiting') {
        startTournamentButton.classList.remove('hide');
    } else {
        startTournamentButton.classList.add('hide');
    }
});

socket.on("tournament-started", (data) => {
    const { bracket, currentRound, type } = data;
    currentTournament.bracket = bracket;
    currentTournament.currentRound = currentRound;
    currentTournament.status = 'active';

    tournamentLobbyDialog.classList.add('hide');
    tournamentBracketDialog.classList.remove('hide'); // Show bracket view
    updateTournamentBracketDisplay();
    addSystemMessage(`Tournament "${currentTournament.tournamentId}" has started!`);
});

socket.on("tournament-round-complete", (data) => {
    const { currentRound, bracket } = data;
    currentTournament.currentRound = currentRound;
    currentTournament.bracket = bracket;
    updateTournamentBracketDisplay();
    addSystemMessage(`Round ${currentRound - 1} complete! Starting Round ${currentRound}.`);
});

socket.on("tournament-match-ready", (data) => {
    const { roomId, matchId, opponent, tournamentType } = data;
    currentTournamentMatchId = matchId;
    bestOfCount = parseInt(tournamentType.replace('bo', '')); // e.g., 'bo3' -> 3
    currentMatchScore = { player: 0, opponent: 0 }; // Reset score for the new match

    addSystemMessage(`Your next tournament match is ready! Room: ${roomId}, Opponent: ${opponent.name}. Best of ${bestOfCount}.`);

    // Automatically join the tournament match room
    joinDialogTitle.textContent = `Tournament Match - ${opponent.name}`;
    joinDialogSubtitle.textContent = `Joining room ${roomId} for your Best of ${bestOfCount} match.`;
    roomInput.value = roomId;
    nameInput.value = playerName; // Pre-fill player name
    actionBtn.textContent = "Join Match";
    gameActionType = 'tournamentMatchJoin'; // New action type for tournament matches

    // Hide other dialogs and show join dialog
    tournamentBracketDialog.classList.add('hide');
    joinDialog.classList.remove('hide');

    // Trigger join
    // This will cause the actionBtn's click listener to be invoked.
    actionBtn.click();
});

socket.on("tournament-complete", (data) => {
    const { winner, finalBracket, leaderboard } = data;
    currentTournament.status = 'completed';
    currentTournament.bracket = finalBracket;
    updateTournamentBracketDisplay(); // Show final bracket

    let winnerMessage = "Tournament completed! No clear winner.";
    if (winner && winner.name) {
        winnerMessage = `Congratulations to ${winner.name} for winning the tournament!`;
    }
    addSystemMessage(winnerMessage);

    // Display leaderboard
    updateLeaderboardDisplay(leaderboard);
    tournamentBracketDialog.classList.add('hide'); // Hide bracket
    leaderboardSection.classList.remove('hide'); // Show leaderboard
    
    // Reset tournament state
    currentTournament = null;
    currentTournamentMatchId = null;
    tournamentGameInProgress = false;
    bestOfCount = 0;
    currentMatchScore = { player: 0, opponent: 0 };
});

socket.on("tournament-error", (data) => {
    addSystemMessage(`Tournament Error: ${data.message}`);
    invalidRoomDialog.classList.remove('hide');
    invalidRoomTitle.textContent = "Tournament Error";
    invalidRoomMessage.textContent = data.message;
    invalidRoomOkBtn.textContent = "Ok"; // Reusing this for general errors
    // Optionally, navigate back to tournament start or main start
    tournamentLobbyDialog.classList.add('hide');
    createTournamentDialog.classList.add('hide');
    joinTournamentDialog.classList.add('hide');
    tournamentModeDialog.classList.remove('hide');
});

socket.on("leaderboard-data", (data) => {
    updateLeaderboardDisplay(data);
});

// --- Game Logic Functions ---

function boxClicked() {
    if (!gameActive || playerSymbol !== turn) return;

    let index = parseInt(this.dataset.index);
    if (boxes[index].innerText === "") {
        socket.emit("player-move", { index });
    }
}

boxes.forEach((box, index) => {
    box.dataset.index = index;
    box.addEventListener("click", boxClicked);
});

const checkWinner = () => {
    let matchWinnerSymbol = null; // Store symbol of the winner for this game
    let isDraw = false;

    for (let i = 0; i < winningCombos.length; i++) {
        let [a, b, c] = winningCombos[i];
        let valA = boxes[a].innerText;
        let valB = boxes[b].innerText;
        let valC = boxes[c].innerText;

        if (valA !== "" && valA === valB && valB === valC) {
            boxes.forEach(box => box.disabled = true);
            winner.classList.remove("hide");

            // Update score
            if (valA === playerSymbol) {
                scores.player++;
                yourScore.textContent = scores.player;
                winner.innerText = `You Win!`;
            } else {
                scores.opponent++;
                opponentScore.textContent = scores.opponent;
                winner.innerText = `${opponentPlayerName || 'Opponent'} Wins!`;
            }

            matchWinnerSymbol = valA; // Found a winner

            const style = linePositions[i];
            line.style.transition = "none";
            line.style.transform = `rotate(${style.rotate}) scaleX(0)`;
            void line.offsetWidth; // Trigger reflow

            Object.assign(line.style, {
                top: style.top,
                left: style.left,
                width: style.width,
                transform: `rotate(${style.rotate}) scaleX(1)`,
                transition: "transform 1s cubic-bezier(0.4, 0, 0.2, 1)"
            });

            line.classList.remove("hide");
            gameActive = false;
            updateTurnIndicator();
            updateBoxCursors();
            startAutoResetCountdown(matchWinnerSymbol, false); // Pass winner and not a draw
            return;
        }
    }

    isDraw = [...boxes].every(box => box.innerText !== "");
    if (isDraw) {
        winner.classList.remove("hide");
        winner.innerText = "It's a Draw!";
        gameActive = false;
        updateTurnIndicator();
        updateBoxCursors();
        startAutoResetCountdown(null, true); // Pass null for winner and true for draw
    }
};

const startAutoResetCountdown = (gameWinnerSymbol, isDraw) => {
    let countdown = 5;
    let width = 0;
    countdownBar.classList.remove("hide");
    countdownBar.style.width = "0%";

    const interval = setInterval(() => {
        if (!tournamentGameInProgress) { // For regular games
            winner.innerText = `New game starts in ${countdown}...`;
        } else { // For tournament games, show match progress
            winner.innerText = `Next game in ${countdown}...`; // Indicate game in match
        }
        width += 20;
        countdownBar.style.width = `${width}%`;
        countdown--;

        if (countdown < 0) {
            clearInterval(interval);
            if (tournamentGameInProgress && currentTournamentMatchId) {
                // Report match result to server
                if (gameWinnerSymbol === playerSymbol) {
                    currentMatchScore.player++;
                } else if (gameWinnerSymbol !== null) { // Opponent won
                    currentMatchScore.opponent++;
                }

                yourScore.textContent = currentMatchScore.player;
                opponentScore.textContent = currentMatchScore.opponent;

                addSystemMessage(`Match score: ${currentMatchScore.player} - ${currentMatchScore.opponent} (Best of ${bestOfCount})`);

                const playerWins = currentMatchScore.player;
                const opponentWins = currentMatchScore.opponent;
                const winsNeeded = Math.ceil(bestOfCount / 2);

                if (playerWins >= winsNeeded || opponentWins >= winsNeeded) {
                    // Match series is over
                    socket.emit("tournament-match-result", {
                        tournamentId: currentTournament.tournamentId,
                        matchId: currentTournamentMatchId,
                        winnerSymbol: (playerWins >= winsNeeded) ? playerSymbol : (playerSymbol === "X" ? "O" : "X"), // Send symbol of the series winner
                        score: currentMatchScore // Send full score of the match series
                    });

                    // Transition back to tournament lobby/bracket
                    gameContainer.classList.add('hide');
                    tournamentBracketDialog.classList.remove('hide');
                    tournamentGameInProgress = false; // Match finished
                    currentTournamentMatchId = null; // Reset match ID
                    currentMatchScore = { player: 0, opponent: 0 }; // Reset score for next tournament match
                    // Do not reset game board here; server will handle next match.
                    return;
                }

                // If match series is not over, reset for next game in the best-of series
                socket.emit("reset-game");
            } else {
                // Regular game, just reset
                socket.emit("reset-game");
            }
        }
    }, 1000);
};

// --- UI Helper Functions ---
function updateTurnIndicator() {
    if (!gameActive) {
        turnIndicator.classList.add("hide");
        return;
    }
    turnIndicator.classList.remove("hide");
    if (turn === playerSymbol) {
        turnIndicator.innerText = "Your Turn";
        turnIndicator.classList.remove("opponent-turn");
        turnIndicator.classList.add("your-turn");
    } else {
        turnIndicator.innerText = `${opponentPlayerName || 'Opponent'}'s Turn`;
        turnIndicator.classList.remove("your-turn");
        turnIndicator.classList.add("opponent-turn");
    }
    updateBoxCursors();
}

function updateBoxCursors() {
    boxes.forEach(box => {
        if (box.innerText === "" && gameActive && turn === playerSymbol) {
            box.style.cursor = 'pointer';
        } else {
            box.style.cursor = 'not-allowed';
        }
    });
}

function addChatMessage(sender, text, isSelf) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    if (isSelf) {
        messageElement.classList.add('self');
    } else {
        messageElement.classList.add('other');
    }
    messageElement.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to bottom
}

function enableChat() {
    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatInput.placeholder = "Type your message...";
}

function disableChat() {
    chatInput.disabled = true;
    sendBtn.disabled = true;
    chatInput.placeholder = "Chat is disabled.";
}

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});

sendBtn.addEventListener('click', () => {
    const messageText = chatInput.value.trim();
    if (messageText) {
        socket.emit("chat-message", { text: messageText });
        chatInput.value = ''; // Clear input
    }
});

function addSystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'system');
    messageElement.innerHTML = `<em>System: ${message}</em>`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Reset entire game and UI state
function resetGameAndUI() {
    playerSymbol = "";
    playerName = "";
    opponentPlayerName = "";
    turn = "X";
    gameActive = false;
    scores = { player: 0, opponent: 0 };
    yourScore.textContent = '0';
    opponentScore.textContent = '0';
    boxes.forEach(box => {
        box.innerText = "";
        box.disabled = true;
    });
    line.classList.add('hide');
    winner.classList.add('hide');
    countdownBar.classList.add('hide');
    turnIndicator.classList.add('hide');
    chatMessages.innerHTML = '';
    disableChat();
    updateBoxCursors();
    document.title = originalTitle;

    // Reset tournament specific flags
    currentTournament = null;
    currentMatchScore = { player: 0, opponent: 0 };
    bestOfCount = 0;
    tournamentGameInProgress = false;
    currentTournamentMatchId = null;
}


// --- Tournament UI Helper Functions ---

function updateTournamentLobby(players, currentSocketId) {
    tournamentPlayersList.innerHTML = '';
    if (players.length === 0) {
        tournamentPlayersList.innerHTML = '<li class="player-item"><span class="player-name">No players in lobby yet.</span></li>';
        return;
    }
    players.forEach(player => {
        const li = document.createElement('li');
        li.classList.add('player-item');
        const playerNameSpan = document.createElement('span');
        playerNameSpan.classList.add('player-name');
        playerNameSpan.textContent = `${player.name} ${player.id === currentSocketId ? '(You)' : ''}`;
        
        const playerStatusSpan = document.createElement('span');
        playerStatusSpan.classList.add('player-status');
        playerStatusSpan.textContent = player.isCreator ? '(Host)' : '';

        li.appendChild(playerNameSpan);
        li.appendChild(playerStatusSpan);
        tournamentPlayersList.appendChild(li);
    });
}

function updateTournamentBracketDisplay() {
    bracketContainer.innerHTML = '';
    if (!currentTournament || !currentTournament.bracket) {
        bracketContainer.textContent = 'Bracket not available.';
        return;
    }

    tournamentRoundInfo.textContent = `Current Round: ${currentTournament.currentRound}`;

    const rounds = {};
    currentTournament.bracket.forEach(match => {
        if (!rounds[match.round]) {
            rounds[match.round] = [];
        }
        rounds[match.round].push(match);
    });

    for (const roundNum in rounds) {
        const roundDiv = document.createElement('div');
        roundDiv.classList.add('bracket-round');
        const roundTitle = document.createElement('h3');
        roundTitle.textContent = `Round ${roundNum}`;
        roundDiv.appendChild(roundTitle);

        rounds[roundNum].forEach(match => {
            const matchDiv = document.createElement('div');
            matchDiv.classList.add('bracket-match');
            if (match.winner) {
                matchDiv.classList.add('completed');
            }
            const player1Name = match.player1 ? match.player1.name : 'TBD';
            const player2Name = match.player2 ? match.player2.name : 'TBD';
            const winnerName = match.winner ? match.winner.name : 'Pending';

            matchDiv.innerHTML = `
                <div class="bracket-players">
                    <span class="bracket-player ${match.winner && match.winner.id === match.player1?.id ? 'winner' : ''}">${player1Name}</span>
                    <span class="bracket-vs">vs</span>
                    <span class="bracket-player ${match.winner && match.winner.id === match.player2?.id ? 'winner' : ''}">${player2Name}</span>
                </div>
                ${match.winner ? `<p class="bracket-score">Winner: ${winnerName}</p>` : ''}
                ${match.score ? `<p class="bracket-score">Score: ${match.score.player1}-${match.score.player2}</p>` : ''}
            `;
            roundDiv.appendChild(matchDiv);
        });
        bracketContainer.appendChild(roundDiv);
    }
}

function updateLeaderboardDisplay(leaderboardData) {
    leaderboardTableBody.innerHTML = ''; // Clear previous entries
    if (!leaderboardData || leaderboardData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" style="text-align: center; color: rgba(255,255,255,0.7);">No leaderboard data available yet.</td>`;
        leaderboardTableBody.appendChild(row);
        return;
    }

    leaderboardData.forEach((entry, index) => {
        const row = document.createElement('tr');
        const rankClass = index < 3 ? 'leaderboard-rank top-3' : 'leaderboard-rank';
        row.innerHTML = `
            <td><span class="${rankClass}">${index + 1}</span></td>
            <td>${entry.playerName}</td>
            <td>${entry.wins}</td>
            <td>${entry.losses}</td>
            <td>${entry.tournaments}</td>
            <td>${entry.rating.toFixed(2)}</td>
        `;
        leaderboardTableBody.appendChild(row);
    });
}

// Event listeners for new Tournament UI elements
startTournamentButton.addEventListener('click', () => {
    if (currentTournament && currentTournament.tournamentId) {
        socket.emit("start-tournament", { tournamentId: currentTournament.tournamentId });
    }
});

leaveTournamentLobbyBtn.addEventListener('click', () => {
    if (currentTournament && currentTournament.tournamentId) {
        socket.emit("leave-tournament-lobby", { tournamentId: currentTournament.tournamentId });
        currentTournament = null; // Clear local tournament state
        tournamentLobbyDialog.classList.add('hide');
        tournamentModeDialog.classList.remove('hide'); // Go back to tournament mode selection
        addSystemMessage("Left tournament lobby.");
    }
});

closeBracketViewBtn.addEventListener('click', () => {
    tournamentBracketDialog.classList.add('hide');
    // Decide where to go after closing bracket: back to lobby (if waiting), or start dialog
    if (currentTournament && currentTournament.status === 'waiting') {
        tournamentLobbyDialog.classList.remove('hide');
    } else {
        tournamentModeDialog.classList.remove('hide'); // If tournament completed/active, go back to main tournament selection
    }
});

closeLeaderboardDialogBtn.addEventListener('click', () => {
    leaderboardSection.classList.add('hide');
    startDialog.classList.remove('hide'); // Go back to initial start dialog
});

// Window focus/blur for title notification
window.addEventListener('focus', () => {
    isTabActive = true;
    document.title = originalTitle;
});

window.addEventListener('blur', () => {
    isTabActive = false;
});

// Initial setup on page load
updateBoxCursors();