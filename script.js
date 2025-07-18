let size = 6;
let fullBoard = [];
let board = [];
let clues = [];
let initialBoard = [];
let timerInterval = null;
let timerSeconds = 0;
let useTimer = false;
let zoomLevel = 1;

function zoomIn() {
  zoomLevel += 0.1;
  document.getElementById('board').style.transform = `scale(${zoomLevel})`;
  document.getElementById('board').style.transformOrigin = 'top left';
}

function zoomOut() {
  zoomLevel = Math.max(0.5, zoomLevel - 0.1);
  document.getElementById('board').style.transform = `scale(${zoomLevel})`;
  document.getElementById('board').style.transformOrigin = 'top left';
}


// Inicia el juego cuando el usuario confirma nivel y opción de cronómetro
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
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
}

function updateTimerText() {
  let min = Math.floor(timerSeconds / 60);
  let sec = timerSeconds % 60;
  document.getElementById('timer').textContent = `Tiempo: ${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

// Volver al menú de selección de nivel
function backToLevelMenu() {
  document.getElementById('game').style.display = 'none';
  document.getElementById('menu-timer').style.display = 'none';
  document.getElementById('menu-level').style.display = 'block';

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  document.getElementById('timer').style.display = 'none';
}


function selectLevel(s) {
  size = s;
  document.getElementById('menu-level').style.display = 'none';
  document.getElementById('menu-timer').style.display = 'block';
}

function countSolutions(board) {
  let count = 0;

  function backtrack(r, c) {
    if (r === size) {
      if (isBoardValid(board)) count++;
      return;
    }

    let nr = c === size - 1 ? r + 1 : r;
    let nc = c === size - 1 ? 0 : c + 1;

    if (initialBoard[r][c] !== null) {
      backtrack(nr, nc);
    } else {
      for (let val of [0, 1]) {
        board[r][c] = val;
        if (isBoardValid(board)) backtrack(nr, nc);
        if (count > 1) return; // optimización: más de una solución, no seguir
      }
      board[r][c] = null;
    }
  }

  backtrack(0, 0);
  return count;
}

function newGame() {
  do {
    fullBoard = generateFullBoard(size);
    board = maskBoard(fullBoard); // ya no pasas una cantidad fija
    initialBoard = board.map(row => [...row]);

  } while (countSolutions(board.map(row => row.slice())) !== 1);

  clues = generateTangoClues(fullBoard, Math.floor(size * 1.5));
  drawBoard();
}
function generateFullBoard(size) {
  let maxTries = 500; // para evitar bucles infinitos
  let board = Array.from({length: size}, () => Array(size).fill(null));
  let half = size / 2;

  for (let row = 0; row < size; row++) {
    let tries = 0;
    let success = false;
    while (tries++ < maxTries) {
      let candidate = generateValidLine(size, half);
      board[row] = candidate;

      // comprobar que no rompe restricciones:
      if (!hasTriple(candidate) && 
          checkColumnsSoFar(board, row, half) &&
          uniqueSoFar(board, row)) {
        success = true;
        break;
      }
    }
    if (!success) {
      // si no se consigue, volver a empezar todo
      return generateFullBoard(size);
    }
  }
  return board;
}

function generateValidLine(size, half) {
  let line = [];
  let zeros = 0, ones = 0;

  for (let i = 0; i < size; i++) {
    let candidates = [];

    if (zeros < half) candidates.push(0);
    if (ones < half) candidates.push(1);

    // evitar tres iguales seguidos
    if (i >= 2 && line[i-1] === line[i-2]) {
      candidates = candidates.filter(v => v !== line[i-1]);
    }

    // elegir aleatorio
    let val = candidates[Math.floor(Math.random() * candidates.length)];
    line.push(val);
    if (val === 0) zeros++; else ones++;
  }

  return line;
}

function checkColumnsSoFar(board, uptoRow, half) {
  for (let col = 0; col < board[0].length; col++) {
    let colVals = [];
    for (let row = 0; row <= uptoRow; row++) {
      colVals.push(board[row][col]);
    }
    if (hasTriple(colVals)) return false;
    let zeros = colVals.filter(v=>v===0).length;
    let ones = colVals.filter(v=>v===1).length;
    if (zeros > half || ones > half) return false;
  }
  return true;
}

function uniqueSoFar(board, uptoRow) {
  let existing = new Set();
  for (let i=0; i<=uptoRow; i++) {
    let key = board[i].join('');
    if (existing.has(key)) return false;
    existing.add(key);
  }
  return true;
}


function maskBoard(full) {
  let masked = full.map(row => [...row]);
  let positions = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      positions.push([r, c]);
    }
  }

  positions.sort(() => Math.random() - 0.5); // mezcla aleatoria

  for (let [r, c] of positions) {
    const temp = masked[r][c];
    masked[r][c] = null;

    let testBoard = masked.map(row => [...row]);
    const solCount = countSolutions(testBoard);

    if (solCount !== 1) {
      // Si se pierden soluciones únicas, devolver el valor
      masked[r][c] = temp;
    }
  }

  return masked;
}


function generateTangoClues(b,count){
  let pos=[];
  for(let r=0;r<size;r++) for(let c=0;c<size-1;c++) pos.push([r,c,'H']);
  for(let r=0;r<size-1;r++) for(let c=0;c<size;c++) pos.push([r,c,'V']);
  pos.sort(()=>Math.random()-0.5);
  let res=[];
  while(res.length<count && pos.length){
    let [r,c,d]=pos.pop();
    let a=b[r][c],bb=d=='H'?b[r][c+1]:b[r+1][c];
    if(a!=null&&bb!=null) res.push([r,c,d,a==bb?'=':'x']);
  }
  return res;
}


function startGameConfirmed() {
  document.getElementById('menu-timer').style.display = 'none';
  document.getElementById('game').style.display = 'block';
  newGame();

  if (useTimer) {
    timerSeconds = 0;
    document.getElementById('timer').style.display = 'block';
    updateTimerText();
    timerInterval = setInterval(() => {
      timerSeconds++;
      updateTimerText();
    }, 1000);
  } else {
    document.getElementById('timer').style.display = 'none';
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
}

function updateTimerText() {
  let min = Math.floor(timerSeconds / 60);
  let sec = timerSeconds % 60;
  document.getElementById('timer').textContent = `Tiempo: ${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function backToMenu() {
  document.getElementById('game').style.display = 'none';
  document.getElementById('menu-level').style.display = 'block';
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  document.getElementById('timer').style.display = 'none';
}

function startTimer() {
  seconds = 0;
  timerActive = true;
  showTimer();
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    seconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  timerActive = false;
  clearInterval(timerInterval);
}

function showTimer() {
  const timerDiv = document.getElementById('timer');
  if (timerDiv) timerDiv.style.display = 'block';
}

function hideTimer() {
  const timerDiv = document.getElementById('timer');
  if (timerDiv) timerDiv.style.display = 'none';
}

function updateTimerDisplay() {
  const timerDiv = document.getElementById('timer');
  if (!timerDiv) return;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  timerDiv.textContent = `Tiempo: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}



// Función que detecta si una celda es fija original (pista o dado por el puzzle)
function isGivenCell(r, c) {
  return initialBoard[r][c] !== null;
}


function drawBoard() {
  const boardDiv = document.getElementById('board');
  boardDiv.innerHTML = '';
  boardDiv.style.gridTemplateColumns = `repeat(${size + 1}, 40px)`; // +1 para contador

  let half = size / 2;

  // Esquina vacía arriba a la izquierda
  let emptyCell = document.createElement('div');
  emptyCell.className = 'counter';
  boardDiv.appendChild(emptyCell);

  // Contadores columnas arriba
  for (let c = 0; c < size; c++) {
    let col = board.map(r => r[c]);
    let zeros = col.filter(v => v === 0).length;
    let ones = col.filter(v => v === 1).length;
    let counter = document.createElement('div');
    counter.className = 'counter';
    counter.textContent = `0:${zeros} 1:${ones}`;

    // Poner rojo si no cumple (más que half)
    if (zeros > half || ones > half) {
      counter.classList.add('error');
    } else {
      counter.classList.remove('error');
    }

    boardDiv.appendChild(counter);
  }

  // Filas con contadores y celdas
  for (let r = 0; r < size; r++) {
    let row = board[r];
    let zeros = row.filter(v => v === 0).length;
    let ones = row.filter(v => v === 1).length;
    let counter = document.createElement('div');
    counter.className = 'counter';
    counter.textContent = `0:${zeros} 1:${ones}`;

    if (zeros > half || ones > half) {
      counter.classList.add('error');
    } else {
      counter.classList.remove('error');
    }

    boardDiv.appendChild(counter);

    // Celdas
    for (let c = 0; c < size; c++) {
      let cell = document.createElement('div');
      cell.className = 'cell';
      cell.setAttribute('data-r', r);
      cell.setAttribute('data-c', c);

      if (initialBoard[r][c] === 0 || initialBoard[r][c] === 1) {
   cell.textContent = board[r][c];
   cell.classList.add('fixed'); // se marca como fija
   cell.onclick = null;
} else {
   cell.textContent = board[r][c] === null ? '' : board[r][c];
   cell.classList.remove('fixed');
   cell.onclick = () => cycleValue(r, c, cell); // se puede tocar
}



      clues.filter(cl => cl[0] === r && cl[1] === c).forEach(cl => {
        let hint = document.createElement('div');
        hint.className = 'hint ' + cl[2];
        hint.textContent = cl[3];
        cell.appendChild(hint);
      });

      boardDiv.appendChild(cell);
    }
  }
}


// Cambia el valor cíclicamente  null -> 0 -> 1 -> null
function cycleValue(r, c, cell) {
  if (isGivenCell(r, c)) return; // No cambia si es fija original

  let cur = board[r][c];
  let nv = cur === null ? 0 : cur === 0 ? 1 : null;
  board[r][c] = nv;
  drawBoard(); // Redibuja el tablero completo, incluyendo contadores
}



// Comprueba la solución, marca errores pero NO bloquea las celdas correctas
function checkSolution() {
  let ok = true;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);

      if (board[r][c] === null) {
        cell.classList.remove('error');
        ok = false; // tablero incompleto
        continue;
      }

      if (board[r][c] === fullBoard[r][c]) {
        cell.classList.remove('error');
      } else {
        cell.classList.add('error');
        ok = false;
      }
    }
  }

  if (ok) {
    // En vez de alert, mostrar pantalla final
    document.getElementById('game').style.display = 'none';
    document.getElementById('menu-finish').style.display = 'block';
  } else {
    alert('❌ Hay errores o celdas vacías.');
  }
}



function showHint(){
  alert('💡 Implementa aquí la lógica de pista.');
}

function isBoardValid(b){
  return checkNoThreeConsecutive(b)&&checkEqualNumbers(b)&&checkUniqueRowsCols(b);
}

function checkNoThreeConsecutive(b){
  for(let r=0;r<size;r++) if(hasTriple(b[r])) return false;
  for(let c=0;c<size;c++) if(hasTriple(b.map(r=>r[c]))) return false;
  return true;
}

function hasTriple(line){
  let cnt=1;
  for(let i=1;i<line.length;i++){
    if(line[i]!=null&&line[i]==line[i-1]){cnt++;if(cnt>2)return true;}
    else cnt=1;
  }
  return false;
}

function checkEqualNumbers(b){
  let h=size/2;
  for(let row of b){if(row.filter(v=>v==0).length>h||row.filter(v=>v==1).length>h)return false;}
  for(let c=0;c<size;c++){let col=b.map(r=>r[c]);if(col.filter(v=>v==0).length>h||col.filter(v=>v==1).length>h)return false;}
  return true;
}

function checkUniqueRowsCols(b){
  let s=new Set();
  for(let r=0;r<size;r++){let k=b[r].join('');if(!k.includes('null')){if(s.has(k))return false;s.add(k);}}
  s=new Set();
  for(let c=0;c<size;c++){let k=b.map(r=>r[c]).join('');if(!k.includes('null')){if(s.has(k))return false;s.add(k);}}
  return true;
}

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

  document.getElementById('btn-timer-back').onclick = () => backToLevelMenu();

  document.getElementById('btn-replay-yes').onclick = () => {
    document.getElementById('menu-finish').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    newGame(); // genera nuevo tablero
    if (useTimer) {
      timerSeconds = 0;
      document.getElementById('timer').style.display = 'block';
      updateTimerText();
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerText();
      }, 1000);
    } else {
      document.getElementById('timer').style.display = 'none';
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }
  };

  document.getElementById('btn-replay-no').onclick = () => {
    document.getElementById('menu-finish').style.display = 'none';
    backToLevelMenu();
  };
});
