let size = 6;
let fullBoard = [];
let board = [];
let initialBoard = [];
let constraintsHorizontal = [];
let constraintsVertical = [];

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
    if (timerInterval) clearInterval(timerInterval);
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

    // No más de dos iguales seguidos en fila
    for (let i = 0; i < size - 2; i++) {
      if (
        rowArr[i] !== "" &&
        rowArr[i] === rowArr[i + 1] &&
        rowArr[i] === rowArr[i + 2]
      )
        return false;
    }
    // No más de dos iguales seguidos en columna
    for (let i = 0; i < size - 2; i++) {
      if (
        colArr[i] !== "" &&
        colArr[i] === colArr[i + 1] &&
        colArr[i] === colArr[i + 2]
      )
        return false;
    }

    // No más de la mitad iguales por fila o columna
    if (rowArr.filter(x => x === 0).length > size / 2) return false;
    if (rowArr.filter(x => x === 1).length > size / 2) return false;
    if (colArr.filter(x => x === 0).length > size / 2) return false;
    if (colArr.filter(x => x === 1).length > size / 2) return false;

    // Revisar duplicados completos
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
  constraintsHorizontal = Array.from({ length: size }, () => Array(size - 1).fill(null));
  constraintsVertical = Array.from({ length: size - 1 }, () => Array(size).fill(null));

  let attempts = 0;
  let maxAttempts = size * size * 20;
  let numConstraints = Math.floor(size * size * 0.15);
  let added = 0;

  while (added < numConstraints && attempts < maxAttempts) {
    attempts++;
    const horizontal = Math.random() < 0.5;

    if (horizontal) {
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * (size - 1));
      if (constraintsHorizontal[r][c] !== null) continue;

      constraintsHorizontal[r][c] = (fullBoard[r][c] === fullBoard[r][c + 1]) ? "=" : "x";
      added++;
    } else {
      const r = Math.floor(Math.random() * (size - 1));
      const c = Math.floor(Math.random() * size);
      if (constraintsVertical[r][c] !== null) continue;

      constraintsVertical[r][c] = (fullBoard[r][c] === fullBoard[r + 1][c]) ? "=" : "x";
      added++;
    }
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
  const gridSize = 2 * size - 1;

  // Ajustar el tamaño del tablero según la pantalla y número total de celdas en grid (incluyendo restricciones)
  // Ocupa el 90% del ancho del viewport dividido entre el total de columnas (gridSize)
  const cellSizeVmin = 90 / gridSize; // toma 90% del side corto (vmin) en lugar de vw
  boardDiv.style.width = `${cellSizeVmin * gridSize}vmin`;
  boardDiv.style.height = boardDiv.style.width;


  boardDiv.style.display = "grid";
  boardDiv.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  boardDiv.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');

      if (r % 2 === 0 && c % 2 === 0) {
        const i = r / 2;
        const j = c / 2;
        cell.dataset.row = i;
        cell.dataset.col = j;

        const val = board[i][j];
        cell.textContent = val === "" ? "" : val;

        if (initialBoard[i][j] !== "") {
          cell.classList.add('fixed');
          cell.style.cursor = 'default';
        } else {
          cell.style.cursor = 'pointer';
          cell.addEventListener('click', () => {
            const current = board[i][j];
            let next;
            if (current === "" || current === null) next = 0;
            else if (current == 0) next = 1;
            else next = "";
            board[i][j] = next;
            drawBoard();
          });
        }
      } else if (r % 2 === 0 && c % 2 === 1) {
        const i = r / 2;
        const j = (c - 1) / 2;
        const cons = constraintsHorizontal?.[i]?.[j] || null;
        cell.classList.add('constraint');
        cell.textContent = cons || "";
        if (cons === "=") cell.style.color = "green";
        else if (cons === "x") cell.style.color = "red";
        else cell.style.color = "transparent";
      } else if (r % 2 === 1 && c % 2 === 0) {
        const i = (r - 1) / 2;
        const j = c / 2;
        const cons = constraintsVertical?.[i]?.[j] || null;
        cell.classList.add('constraint');
        cell.textContent = cons || "";
        if (cons === "=") cell.style.color = "green";
        else if (cons === "x") cell.style.color = "red";
        else cell.style.color = "transparent";
      } else {
        cell.textContent = "";
        cell.style.backgroundColor = "#f0f0f0";
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
  console.log("Botón comprobar clicado");
  const errorSet = new Set();
  let allFilled = true;

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const val = Number(board[i][j]);
      if (isNaN(val)) {
        allFilled = false;
      }
      if (!isNaN(val) && val !== fullBoard[i][j]) {
        errorSet.add(`${i},${j}`);
      }
    }
  }

  // restricciones horizontales
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size - 1; j++) {
      const cons = constraintsHorizontal?.[i]?.[j];
      if (!cons) continue;
      const a = Number(board[i][j]);
      const b = Number(board[i][j + 1]);
      if (isNaN(a) || isNaN(b)) continue;
      if (cons === "=" && a !== b) {
        errorSet.add(`${i},${j}`); errorSet.add(`${i},${j+1}`);
      } else if (cons === "x" && a === b) {
        errorSet.add(`${i},${j}`); errorSet.add(`${i},${j+1}`);
      }
    }
  }

  // restricciones verticales
  for (let i = 0; i < size - 1; i++) {
    for (let j = 0; j < size; j++) {
      const cons = constraintsVertical?.[i]?.[j];
      if (!cons) continue;
      const a = Number(board[i][j]);
      const b = Number(board[i + 1][j]);
      if (isNaN(a) || isNaN(b)) continue;
      if (cons === "=" && a !== b) {
        errorSet.add(`${i},${j}`); errorSet.add(`${i+1},${j}`);
      } else if (cons === "x" && a === b) {
        errorSet.add(`${i},${j}`); errorSet.add(`${i+1},${j}`);
      }
    }
  }

  document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('error'));
  errorSet.forEach(key => {
    const [r, c] = key.split(',').map(Number);
    const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    if (cell) cell.classList.add('error');
  });

  if (errorSet.size === 0 && allFilled) {
    document.getElementById('game').style.display = 'none';
    document.getElementById('menu-finish').style.display = 'block';
    if (timerInterval) clearInterval(timerInterval);
  } else if (!allFilled) {
    alert("⚠️ El tablero no está completo.");
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
  document.getElementById('btn-check').addEventListener('click', checkSolution);
  document.getElementById('btn-replay-no').onclick = backToMenu;
});


