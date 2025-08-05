let size = 6;
let fullBoard = [];
let board = [];
let initialBoard = [];
let timerInterval = null;
let timerSeconds = 0;
let useTimer = false;

// =========================
// Menús y temporizador
// =========================

function updateTimerText() {
  const min = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const sec = (timerSeconds % 60).toString().padStart(2, '0');
  document.getElementById('timer').textContent = `Tiempo: ${min}:${sec}`;
}

function startGameConfirmed() {
  document.getElementById('menu-timer').style.display = 'none';
  document.getElementById('game').style.display = 'block';

  timerSeconds = 0;
  newGame();

  if (useTimer) {
    document.getElementById('timer').style.display = 'block';
    updateTimerText();
    timerInterval = setInterval(() => {
      timerSeconds++;
      updateTimerText();
    }, 1000);
  } else {
    document.getElementById('timer').style.display = 'none';
    if (timerInterval) clearInterval(timerInterval);
  }
}

function backToMenu() {
  document.getElementById('game').style.display = 'none';
  document.getElementById('menu-level').style.display = 'block';
  document.getElementById('menu-timer').style.display = 'none';
  document.getElementById('menu-finish').style.display = 'none';

  if (timerInterval) clearInterval(timerInterval);
  document.getElementById('timer').style.display = 'none';
}

function selectLevel(n) {
  size = n;
  document.getElementById('menu-level').style.display = 'none';
  document.getElementById('menu-timer').style.display = 'block';
}

// =========================
// Juego y tablero
// =========================

function generateValidBoard() {
  let attempts = 0;
  while (attempts < 1000) {
    const board = [];
    for (let i = 0; i < size; i++) {
      let row;
      do {
        row = Array.from({ length: size }, () => Math.round(Math.random()));
      } while (!isValidLine(row));
      board.push(row);
    }

    if (checkAllRules(board)) return board;
    attempts++;
  }
  alert("No se pudo generar un tablero válido.");
  return Array.from({ length: size }, () => Array(size).fill(""));
}

function isValidLine(line) {
  // No más de dos iguales seguidos
  for (let i = 0; i < line.length - 2; i++) {
    if (line[i] === line[i + 1] && line[i] === line[i + 2]) return false;
  }
  // Número equilibrado
  const count0 = line.filter(x => x === 0).length;
  const count1 = line.filter(x => x === 1).length;
  return count0 === count1;
}

function checkAllRules(board) {
  const n = board.length;

  for (let i = 0; i < n; i++) {
    const row = board[i];
    const col = board.map(r => r[i]);

    if (!isValidLine(row) || !isValidLine(col)) return false;

    for (let j = i + 1; j < n; j++) {
      if (arraysEqual(row, board[j])) return false;
      const colJ = board.map(r => r[j]);
      if (arraysEqual(col, colJ)) return false;
    }
  }
  return true;
}

function maskBoard(full, cluesCount = Math.floor(size * size * 0.5)) {
  let masked = full.map(row => row.slice());
  let cells = [];
  for (let i = 0; i < size; i++)
    for (let j = 0; j < size; j++)
      cells.push([i, j]);

  shuffleArray(cells);
  let toRemove = size * size - cluesCount;
  for (let i = 0; i < toRemove; i++) {
    const [r, c] = cells[i];
    masked[r][c] = "";
  }
  return masked;
}

function newGame() {
  fullBoard = generateValidBoard();
  board = maskBoard(fullBoard);
  initialBoard = board.map(r => r.slice());
  drawBoard();
}

function drawBoard() {
  const boardDiv = document.getElementById('board');
  boardDiv.innerHTML = "";

  for (let i = 0; i < size; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row';
    for (let j = 0; j < size; j++) {
      const cell = document.createElement('input');
      cell.type = 'text';
      cell.maxLength = 1;
      cell.dataset.row = i;
      cell.dataset.col = j;
      cell.className = 'cell';

      if (board[i][j] !== "") {
        cell.value = board[i][j];
        cell.disabled = true;
      } else {
        cell.value = "";
        cell.addEventListener('input', e => {
          const val = e.target.value;
          if (val === "0" || val === "1") {
            board[i][j] = parseInt(val);
          } else {
            e.target.value = "";
            board[i][j] = "";
          }
        });
      }
      rowDiv.appendChild(cell);
    }
    boardDiv.appendChild(rowDiv);
  }
}

// =========================
// Utilidades
// =========================

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// =========================
// Pista y comprobación
// =========================

function showHint() {
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (initialBoard[i][j] === "" && board[i][j] === "") {
        board[i][j] = fullBoard[i][j];
        drawBoard();
        return;
      }
    }
  }
  alert("No hay más pistas disponibles.");
}

function checkSolution() {
  for (let i = 0; i < size; i++)
    for (let j = 0; j < size; j++)
      if (parseInt(board[i][j]) !== fullBoard[i][j]) {
        alert("❌ Hay errores en el tablero.");
        return;
      }

  if (!checkAllRules(board)) {
    alert("❌ El tablero no cumple todas las reglas de Binairo.");
    return;
  }

  document.getElementById('game').style.display = 'none';
  document.getElementById('menu-finish').style.display = 'block';
  if (timerInterval) clearInterval(timerInterval);
}

// =========================
// Eventos del menú
// =========================

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-easy').onclick = () => selectLevel(6);
  document.getElementById('btn-medium').onclick = () => selectLevel(8);
  document.getElementById('btn-hard').onclick = () => selectLevel(10);

  document.getElementById('btn-timer-yes').onclick = () => {
    useTimer = true;
    startGameConfirmed();
  };
  document.getElementById('btn-timer-no').onclick = () => {
    useTimer = false;
    startGameConfirmed();
  };
  document.getElementById('btn-timer-back').onclick = backToMenu;

  document.getElementById('btn-replay-yes').onclick = () => {
    document.getElementById('menu-finish').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    newGame();
  };
  document.getElementById('btn-replay-no').onclick = backToMenu;
});

