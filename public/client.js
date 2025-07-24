let boxes = document.querySelectorAll('.box');
let reset = document.querySelector('.reset');
// let turn = true;
let winner = document.querySelector('.Winner');
let line = document.querySelector('.line');

// Hide elements initially
line.classList.add('hide');
winner.classList.add('hide');

// Winning combinations (index-based)
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
const socket = io();
let playerSymbol = "";
let turn = "X";

socket.on("player-assigned", (symbol) => {
    playerSymbol = symbol;
    alert("You are player " + symbol);
});

socket.on("room-full", () => {
    alert("Room is full. Try again later.");
});

socket.on("move-made", ({ index, symbol }) => {
    const box = document.querySelectorAll(".box")[index];
    box.innerText = symbol;
    box.disabled = true;
    turn = symbol === "X" ? "O" : "X";
    checkWinner();
});

// Click event
document.querySelectorAll(".box").forEach((box, index) => {
    box.addEventListener("click", () => {
        if (playerSymbol === turn && box.innerText === "") {
            box.innerText = playerSymbol;
            box.disabled = true;
            socket.emit("make-move", { index, symbol: playerSymbol });
            turn = playerSymbol === "X" ? "O" : "X";
        }
    });
});

// Line styles corresponding to the winningCombos index
const linePositions = {
    0: { top: "5vw", left: "0vw", width: "30vw", rotate: "0deg" },      // Row 1
    1: { top: "0vw", left: "5vw", width: "30vw", rotate: "90deg" },     // Column 1
    2: { top: "0vw", left: "0vw", width: "42vw", rotate: "45deg" },     // Diagonal
    3: { top: "0vw", left: "15vw", width: "30vw", rotate: "90deg" },    // Column 2
    4: { top: "0vw", left: "25vw", width: "30vw", rotate: "90deg" },    // Column 3
    5: { top: "0vw", left: "0vw", width: "42vw", rotate: "-45deg" },    // Anti-diagonal
    6: { top: "15vw", left: "0vw", width: "30vw", rotate: "0deg" },     // Row 2
    7: { top: "25vw", left: "0vw", width: "30vw", rotate: "0deg" }      // Row 3
};

// Reset button handler
reset.addEventListener("click", () => {
    
     socket.emit("reset-game");
    

});
socket.on("reset-board", () => {
    boxes.forEach((box) => {
        box.innerText = "";
        box.disabled = false;
    });
    winner.classList.add('hide');
    line.classList.add('hide');
    line.style.transform = "scaleX(0)";
});


// Box click handler


// Winner checking logic
const checkWinner = () => {
    for (let i = 0; i < winningCombos.length; i++) {
        let pattern = winningCombos[i];
        let pos1value = boxes[pattern[0]].innerText;
        let pos2value = boxes[pattern[1]].innerText;
        let pos3value = boxes[pattern[2]].innerText;

        if (pos1value !== "" && pos1value === pos2value && pos2value === pos3value) {
            boxes.forEach((box) => {
                box.disabled = true;
            });

            winner.classList.remove('hide');
            winner.innerText = "Winner is " + pos1value;

            // Show winning line
            const style = linePositions[i];
            Object.assign(line.style, {
                top: style.top,
                left: style.left,
                width: style.width,
                transform: `rotate(${style.rotate}) scaleX(1)`
            });
            line.classList.remove("hide");

            return;
        }
    }

    // Check for draw
    let isDraw = true;
    boxes.forEach((box) => {
        if (box.innerText === "") {
            isDraw = false;
        }
    });
    if (isDraw) {
        winner.classList.remove('hide');
        winner.innerText = "It's a Draw!";
    }
};
