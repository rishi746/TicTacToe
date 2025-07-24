# 🎮 Online Tic Tac Toe

A real-time 2-player **Tic Tac Toe** game built using **Node.js**, **Socket.io**, and vanilla **JavaScript**. This app allows two players to connect and play online in sync — complete with animated winning lines and clean UI.

![Game Screenshot](./public/tictactoe.png)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?logo=socket.io&logoColor=white)](https://socket.io/)

---

## 🚀 Features

- ✅ Online multiplayer with WebSocket (Socket.io)
- ✅ Real-time move sync across clients
- ✅ Animated line through the winning combination
- ✅ Winner / Draw detection
- ✅ Reset functionality
- ✅ Clean, responsive UI (using plain HTML/CSS/JS)

---

## 🖥️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Backend:** Node.js + Express
- **WebSocket:** Socket.io

---

## 📁 Project Structure

Directory structure:
└── rishi746-tictactoe/
    ├── package.json
    ├── server.js
    └── public/
        ├── 2.css
        ├── client.js
        └── index.html

---

## ⚙️ Installation & Setup

1. **Clone the repository:**

```bash
git clone https://github.com/rishi746/TicTacToe.git
cd TicTacToe
```

2. **Install dependencies:**

```bash
npm install
```

3. **Run the server:**
```bash
node server.js
```

4. **Open two browser tabs/windows:**

Go to: http://localhost:3000

## 🔧 Gameplay Logic

- Players are auto-assigned as **"X"** or **"O"** upon joining.
- Only the player whose turn it is can make a move.
- Moves are sent and synchronized in real-time using **Socket.io**.
- After each move:
  - The game checks for a winner or a draw.
  - If a player wins, an animated line appears through the winning combination.
  - A message is displayed announcing the winner or declaring a draw.
- A **Reset** button is available to clear the board for both players.

---

## 📦 To-Do / Improvements

- Add private game rooms using unique room codes
- Show player names and keep track of win/loss statistics
- Add single-player mode with basic or MiniMax AI
- Make the UI more responsive and mobile-friendly
- Improve UI/UX with animations and sound effects
- Handle unexpected disconnections more gracefully

---

## 🙌 Author

**Rishinandan D R**  
🔗 [GitHub: @rishi746](https://github.com/rishi746)
