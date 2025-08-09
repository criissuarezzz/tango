let size = 6;
let fullBoard = [];
let board = [];
let initialBoard = [];
let constraints = []; // Matriz con restricciones "=" o "x"
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
// Generación de tablero
// =========================

function generateValidBoard() {
  let b = Array.from({ length: size }, () => Array(size).fill(""));

  function backtrack(row, col) {
    if (row === size) return true;
    let nextRow = col === size - 1 ? row + 1 : row;
    let nextCol = col === size - 1 ? 0 : col + 1;

    let nums = [0, 1];
    shuffleArray(nums);
    for (let num of nums) {
      b[row][col] = num;
      if (isValidPartial(row, col)) {
        if (backtrack(nextRow, nextCol)) return true;
      }
    }

    b[row][col] = "";
    return false;
  }

  function isValidPartial(r, c) {
    let rowArr = b[r];
    let colArr = b.map(row => row[c]);

    // No más de dos iguales seguidos
    for (let i = 0; i < size - 2; i++) {
      if (rowArr[i] !== "" && rowArr[i] === rowArr[i + 1] && rowArr[i] === rowArr[i + 2]) return false;
      if (colArr[i] !== "" && colArr[i] === colArr[i + 1] && colArr[i] === colArr[i + 2]) return false;
    }

    // Equilibrio parcial
    if (rowArr.filter(x => x === 0).length > size / 2) return false;
    if (rowArr.filter(x => x === 1).length > size / 2) return false;
    if (colArr.filter(x => x === 0).length > size / 2) return false;
    if (colArr.filter(x => x === 1).length > size / 2) return false;

    // Filas/columnas duplicadas
    for (let i = 0; i < r; i++) {
      if (!rowArr.includes("") && arraysEqual(b[i], rowArr)) return false;
    }
    for (let j = 0; j < c; j++) {
      let colJ = b.map(row => row[j]);
      if (!colArr.includes("") && arraysEqual(colJ, colArr)) return false;
    }

    return true;
  }

  backtrack(0, 0);
  return b;
}

function generateConstraints() {
  constraints = Array.from({ length: size }, () => Array(size).fill(null));

  // Añadimos restricciones aleatorias
  let numConstraints = Math.floor(size * size * 0.15); // 15% de casillas
  for (let i = 0; i < numConstraints; i++) {
    let r1 = Math.floor(Math.random() * size);
    let c1 = Math.floor(Math.random() * size);
    let r2 = Math.floor(Math.random() * size);
    let c2 = Math.floor(Math.random() * size);
    if (r1 === r2 && c1 === c2) continue;
    constraints[r1][c1] = { type: Math.random() < 0.5 ? "=" : "x", target: [r2, c2] };
  }
}

function maskBoard(board) {
  let masked = board.map(r => r.slice());
  let cellsToHide = Math.floor(size * size * 0.6);
  while (cellsToHide > 0) {
    let r = Math.floor(Math.random() * size);
    let c = Math.floor(Math.random() * size);
    if (masked[r][c] !== "") {
      masked[r][c] = "";
      cellsToHide--;
    }
  }
  return masked;
}

function newGame() {
  fullBoard = generateValidBoard();
  generateConstraints();
  board = maskBoard(fullBoard);
  initialBoard = board.map(r => r.slice());
  drawBoard();
}

// =========================
// Dibujo del tablero
// =========================

function drawBoard() {
  const boardDiv = document.getElementById('board');
  boardDiv.innerHTML = "";
  boardDiv.style.display = "grid";
  boardDiv.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  boardDiv.style.gridTemplateRows = `repeat(${size}, 1fr)`;

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = i;
      cell.dataset.col = j;

      const val = board[i][j];
      cell.textContent = val === "" ? "" : val;

      if (constraints[i][j]) {
        cell.textContent = constraints[i][j].type;
        cell.classList.add('constraint');
      } else if (initialBoard[i][j] !== "") {
        cell.classList.add('fixed');
      } else {
        cell.addEventListener('click', () => {
          const current = board[i][j];
          let next;
          if (current === "" || current === null) {
            next = 0;
          } else if (current === 0 || current === "0") {
            next = 1;
          } else {
            next = "";
          }
          board[i][j] = next;
          drawBoard();
        });
      }

      boardDiv.appendChild(cell);
    }
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
// Pistas y comprobación
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
  let errors = [];

  // Comprobación valores
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (parseInt(board[i][j]) !== fullBoard[i][j]) {
        errors.push([i, j]);
      }
    }
  }

  // Comprobación restricciones
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (constraints[i][j]) {
        let [tr, tc] = constraints[i][j].target;
        if (constraints[i][j].type === "=" && board[i][j] !== board[tr][tc]) {
          errors.push([i, j], [tr, tc]);
        }
        if (constraints[i][j].type === "x" && board[i][j] === board[tr][tc]) {
          errors.push([i, j], [tr, tc]);
        }
      }
    }
  }

  // Marcar errores
  document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('error'));
  errors.forEach(([r, c]) => {
    const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    if (cell) cell.classList.add('error');
  });

  if (errors.length === 0) {
    document.getElementById('game').style.display = 'none';
    document.getElementById('menu-finish').style.display = 'block';
    if (timerInterval) clearInterval(timerInterval);
  } else {
    alert("❌ Hay errores en el tablero.");
  }
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
