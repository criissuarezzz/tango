let size = 6;
let fullBoard = [];
let board = [];
let clues = [];

function startGame(s) {
  size = s;
  document.getElementById('menu').style.display = 'none';
  document.getElementById('game').style.display = 'block';
  newGame();
}

function backToMenu() {
  document.getElementById('menu').style.display = 'block';
  document.getElementById('game').style.display = 'none';
}

function newGame() {
  fullBoard = generateFullBoard(size);
  clues = generateTangoClues(fullBoard, Math.floor(size*1.5));
  board = maskBoard(fullBoard, Math.floor(size*size*0.4));
  drawBoard();
  updateCounters();
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


function maskBoard(full, cluesCount) {
  let masked = full.map(row=>[...row]);
  let pos = [];
  for (let r=0;r<size;r++) for(let c=0;c<size;c++) pos.push([r,c]);
  pos.sort(()=>Math.random()-0.5);
  let toRemove = size*size - cluesCount;
  for(let i=0;i<toRemove;i++) masked[pos[i][0]][pos[i][1]]=null;
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

function cycleValue(r, c) {
  // No editar celdas fijas
  if (fullBoard[r][c] !== null && board[r][c] === fullBoard[r][c]) return;

  let cur = board[r][c];
  let nv;

  if (cur === null || cur === undefined) {
    nv = 0;
  } else if (cur === 0) {
    nv = 1;
  } else {
    nv = null;
  }

  board[r][c] = nv;
  drawBoard(); // Redibuja para actualizar visual y contadores
}



function drawBoard() {
  const boardDiv = document.getElementById('board');
  boardDiv.innerHTML = '';
  boardDiv.style.gridTemplateColumns = `repeat(${size + 1}, 40px)`;

  // Esquina vacía arriba a la izquierda
  let emptyCell = document.createElement('div');
  emptyCell.className = 'counter';
  boardDiv.appendChild(emptyCell);

  // Recuento de columnas arriba
  for (let c = 0; c < size; c++) {
    let col = board.map(r => r[c]);
    let zeros = col.filter(v => v === 0).length;
    let ones = col.filter(v => v === 1).length;
    let counter = document.createElement('div');
    counter.className = 'counter';
    counter.textContent = `0:${zeros} 1:${ones}`;
    boardDiv.appendChild(counter);
  }

  // Filas con recuento al inicio
  for (let r = 0; r < size; r++) {
    // Recuento fila a la izquierda
    let row = board[r];
    let zeros = row.filter(v => v === 0).length;
    let ones = row.filter(v => v === 1).length;
    let counter = document.createElement('div');
    counter.className = 'counter';
    counter.textContent = `0:${zeros} 1:${ones}`;
    boardDiv.appendChild(counter);

    // Celdas
    for (let c = 0; c < size; c++) {
      let cell = document.createElement('div');
      cell.className = 'cell';

      // Si es celda fija (original del puzzle)
      if (fullBoard[r][c] !== null && board[r][c] === fullBoard[r][c]) {
        cell.textContent = board[r][c];
        cell.classList.add('fixed'); // gris oscuro en CSS
      } else {
        cell.textContent = board[r][c] === null ? '' : board[r][c];
        cell.classList.remove('fixed'); // gris claro en CSS
        cell.onclick = () => cycleValue(r, c);
      }

      // Añadir data atributos para selección futura
      cell.setAttribute('data-r', r);
      cell.setAttribute('data-c', c);

      // Añadir pistas (clues) si las hay en esa celda
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


function cycleValue(r, c) {
  // Solo permitir cambio si no es fijo (no gris oscuro)
  if (board[r][c] === fullBoard[r][c] && fullBoard[r][c] !== null) return;

  if (board[r][c] === null) {
    board[r][c] = 0;
  } else if (board[r][c] === 0) {
    board[r][c] = 1;
  } else if (board[r][c] === 1) {
    board[r][c] = null;
  }

  drawBoard(); // Redibuja para reflejar el cambio
}


function checkSolution() {
  let ok = true;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);

      if (board[r][c] === null) {
        cell.classList.remove('error');
        cell.classList.remove('fixed');
        ok = false; // Aún no está completado
        continue;
      }

      if (board[r][c] === fullBoard[r][c]) {
        cell.classList.remove('error');
        cell.classList.add('fixed'); // Bloquea la celda
      } else {
        cell.classList.add('error'); // Marca error
        ok = false;
      }
    }
  }

  if (ok) {
    alert('🎉 ¡Correcto! Has resuelto el tablero.');
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


document.getElementById('btn-easy').onclick = () => startGame(6);
document.getElementById('btn-medium').onclick = () => startGame(8);
document.getElementById('btn-hard').onclick = () => startGame(10);
