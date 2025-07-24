// Dialog elements
let startDialog = document.getElementById('startDialog');
let createGameBtn = document.getElementById('createGameBtn');
let joinGameBtn = document.getElementById('joinGameBtn');

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
let gameActionType = ''; // 'create' or 'join'

// Initialize hidden elements
line.classList.add('hide');
winner.classList.add('hide');
countdownBar.classList.add('hide');
gameContainer.classList.add('hide'); // Ensure game container is hidden initially

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

// --- Initial Dialog Flow ---
startDialog.classList.remove('hide'); // Show the start dialog first

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
  initializeSocket(roomId, name, gameActionType);
});

// Enter key handlers for inputs
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

function initializeSocket(roomId, name, type) {
  socket = io();
  socket.emit("join-room", { roomId, playerName: name, type });

  // Socket event handlers
  socket.on("player-assigned", (data) => {
    playerSymbol = data.symbol;
    playerName = data.playerName;
    boxes.forEach(box => box.disabled = true);
    
    // Update scoreboard
    yourSymbol.textContent = playerSymbol;
    yourName.textContent = `${playerName} (You)`; // Add (You)
    
    // Hide dialog and show game
    joinDialog.classList.add('hide');
    gameContainer.classList.remove('hide');
    
    if (data.symbol === "X") {
      winner.classList.remove("hide");
      winner.innerText = "Waiting for opponent...";
    }
    
    addSystemMessage(`You joined as ${playerName} (${playerSymbol})`);
  });

  socket.on("both-players-ready", (data) => {
    winner.classList.remove("hide");
    winner.innerText = "Game Started!";
    gameActive = true;
    turnIndicator.classList.remove("hide");
    updateTurnIndicator();
    enableChat();
    
    // Update opponent info in scoreboard
    if (data && data.opponentName) {
      opponentPlayerName = data.opponentName;
      opponentName.textContent = opponentPlayerName;
      opponentSymbol.textContent = playerSymbol === "X" ? "O" : "X";
    }
    
    if (playerSymbol === "X") {
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
    invalidRoomMessage.textContent = "The room ID you entered does not exist. Please check and try again.";
  });

  socket.on("room-already-exists", () => {
    joinDialog.classList.add('hide');
    invalidRoomDialog.classList.remove('hide');
    invalidRoomTitle.textContent = "Room Already Exists";
    invalidRoomMessage.textContent = "A room with this ID already exists. Please choose a different ID or join the existing room.";
  });

  socket.on("player-left", () => {
    winner.classList.remove("hide");
    winner.innerText = "Opponent left. Waiting...";
    gameActive = false;
    boxes.forEach((box) => box.disabled = true);
    updateTurnIndicator();
    disableChat();
  });

  socket.on("move-made", ({ index, symbol }) => {
    const box = boxes[index];
    box.innerText = symbol;
    box.disabled = true;
    turn = symbol === "X" ? "O" : "X";
    updateTurnIndicator();
    updateBoxCursors(); // Update cursors after a move
    
    if (playerSymbol === turn && gameActive) {
      boxes.forEach((box) => {
        if (box.innerText === "") box.disabled = false;
      });
    } else {
      boxes.forEach((box) => box.disabled = true);
    }
    checkWinner();
  });

  socket.on("reset-board", () => {
    boxes.forEach((box) => {
      box.innerText = "";
      box.disabled = true;
    });
    winner.classList.add("hide");
    line.classList.add("hide");
    line.style.transform = "scaleX(0)";
    countdownBar.classList.add("hide");
    countdownBar.style.width = "0%";
    turn = "X";
    gameActive = true;
    updateTurnIndicator();
    updateBoxCursors(); // Update cursors after reset
    
    if (playerSymbol === "X") {
      boxes.forEach((box) => {
        if (box.innerText === "") box.disabled = false;
      });
    }
  });

  // Chat event handlers
  socket.on("chat-history", (history) => {
    chatMessages.innerHTML = '<div class="message system">Welcome! Start chatting once both players join.</div>';
    history.forEach(msg => {
      displayChatMessage(msg);
    });
  });

  socket.on("chat-message", (messageData) => {
    displayChatMessage(messageData);
  });
}

// Game logic
boxes.forEach((box, index) => {
  box.addEventListener("click", () => {
    if (!gameActive) return;
    if (playerSymbol === turn && box.innerText === "") {
      box.innerText = playerSymbol;
      box.disabled = true;
      socket.emit("make-move", { index, symbol: playerSymbol });
      turn = playerSymbol === "X" ? "O" : "X";
      updateTurnIndicator();
      updateBoxCursors(); // Update cursors after a move
      checkWinner();
    }
  });

  // Cursor hover effects
  box.addEventListener('mouseover', () => {
    if (!box.disabled && gameActive && playerSymbol === turn) {
      if (playerSymbol === 'X') {
        box.classList.add('cursor-x');
      } else {
        box.classList.add('cursor-o');
      }
    }
  });

  box.addEventListener('mouseout', () => {
    box.classList.remove('cursor-x', 'cursor-o');
  });
});


const checkWinner = () => {
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
      
      const style = linePositions[i];
      line.style.transition = "none";
      line.style.transform = `rotate(${style.rotate}) scaleX(0)`;
      void line.offsetWidth;
      
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
      updateBoxCursors(); // Update cursors after game ends
      startAutoResetCountdown();
      return;
    }
  }
  
  const isDraw = [...boxes].every(box => box.innerText !== "");
  if (isDraw) {
    winner.classList.remove("hide");
    winner.innerText = "It's a Draw!";
    gameActive = false;
    updateTurnIndicator();
    updateBoxCursors(); // Update cursors after game ends
    startAutoResetCountdown();
  }
};

const startAutoResetCountdown = () => {
  let countdown = 5;
  let width = 0;
  countdownBar.classList.remove("hide");
  countdownBar.style.width = "0%";
  
  const interval = setInterval(() => {
    winner.innerText = `New game starts in ${countdown}...`;
    width += 20;
    countdownBar.style.width = `${width}%`;
    countdown--;
    
    if (countdown < 0) {
      clearInterval(interval);
      socket.emit("reset-game");
    }
  }, 1000);
};

const updateTurnIndicator = () => {
  if (!gameActive) {
    turnIndicator.innerText = "";
    return;
  }
  
  const isMyTurn = playerSymbol === turn;
  turnIndicator.innerText = isMyTurn ? "Your turn" : `${opponentPlayerName || 'Opponent'}'s turn`;
  
  // Update tab title when it's opponent's turn and tab is not active
  if (!isTabActive && !isMyTurn) {
    document.title = "Your opponent is waiting - StrategiX";
  }
};

// Function to update box cursors based on current turn
const updateBoxCursors = () => {
  boxes.forEach(box => {
    box.classList.remove('cursor-x', 'cursor-o'); // Remove existing cursor classes
    if (!box.disabled && gameActive && playerSymbol === turn) {
      if (playerSymbol === 'X') {
        box.classList.add('cursor-x');
      } else {
        box.classList.add('cursor-o');
      }
    }
  });
};

// Chat functionality
function enableChat() {
  chatInput.disabled = false;
  sendBtn.disabled = false;
}

function disableChat() {
  chatInput.disabled = true;
  sendBtn.disabled = true;
}

function displayChatMessage(messageData) {
  const messageDiv = document.createElement('div');
  
  if (messageData.type === 'system') {
    messageDiv.className = 'message system';
    messageDiv.textContent = messageData.message;
  } else if (messageData.type === 'player') {
    if (messageData.senderId === socket.id) {
      messageDiv.className = 'message own';
      messageDiv.textContent = messageData.message;
    } else {
      messageDiv.className = 'message other';
      messageDiv.textContent = messageData.message;
    }
  }
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addSystemMessage(message) {
  displayChatMessage({
    type: 'system',
    message: message,
    timestamp: Date.now()
  });
}

function sendMessage() {
  const message = chatInput.value.trim();
  if (message === '' || chatInput.disabled) return;
  
  socket.emit("chat-message", { message });
  chatInput.value = '';
}

// Event listeners for chat
sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Input validation
chatInput.addEventListener('input', (e) => {
  // Limit message length
  if (e.target.value.length > 200) {
    e.target.value = e.target.value.substring(0, 200);
  }
});

// Tab visibility detection
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    isTabActive = false;
    if (gameActive && playerSymbol !== turn) {
      document.title = "Your opponent is waiting - StrategiX";
    }
  } else {
    isTabActive = true;
    document.title = originalTitle;
  }
});

// Dialog event handlers for retry/invalid room
tryAgainBtn.addEventListener('click', () => {
  roomFullDialog.classList.add('hide');
  startDialog.classList.remove('hide'); // Go back to the start dialog
  roomInput.value = '';
  nameInput.value = '';
});

invalidRoomOkBtn.addEventListener('click', () => {
  invalidRoomDialog.classList.add('hide');
  startDialog.classList.remove('hide'); // Go back to the start dialog
  roomInput.value = '';
  nameInput.value = '';
});

// Initial setup
updateBoxCursors(); // Set initial cursors
