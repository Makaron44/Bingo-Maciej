import React, { useState, useEffect, useCallback } from 'react';

// Funkcja pomocnicza do generowania liczb dla danej kolumny
const generateColumn = (min, max, count) => {
  const nums = new Set();
  while (nums.size < count) {
    nums.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return Array.from(nums);
};

// Generowanie nowej planszy Bingo
const generateBoard = () => {
  const b = generateColumn(1, 15, 5);
  const i = generateColumn(16, 30, 5);
  const n = generateColumn(31, 45, 4); // Środek jest darmowy
  const g = generateColumn(46, 60, 5);
  const o = generateColumn(61, 75, 5);

  n.splice(2, 0, 'FREE'); // Wstawiamy darmowe pole na środku

  const board = [];
  for (let row = 0; row < 5; row++) {
    board.push([b[row], i[row], n[row], g[row], o[row]]);
  }
  return board;
};

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

// Komponent wyświetlający konfetti
const Confetti = ({ colors }) => {
  const pieces = Array.from({ length: 75 }).map((_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 2;
    const duration = Math.random() * 2 + 2;
    const palette = colors && colors.length > 0 ? colors : ['#ef4444', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
    const color = palette[Math.floor(Math.random() * palette.length)];
    
    return (
      <div
        key={i}
        className="absolute top-[-20px] w-2 h-5 opacity-90 rounded-sm z-50"
        style={{
          left: `${left}%`,
          backgroundColor: color,
          animation: `fall ${duration}s linear ${delay}s infinite`,
        }}
      />
    );
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces}
    </div>
  );
};

const App = () => {
  const [board, setBoard] = useState([]);
  const [drawnBalls, setDrawnBalls] = useState([]);
  const [markedCells, setMarkedCells] = useState(
    Array(5).fill().map(() => Array(5).fill(false))
  );
  const [hasBingo, setHasBingo] = useState(false);
  const [bingoColors, setBingoColors] = useState([]);
  const [showRules, setShowRules] = useState(false);

  // Inicjalizacja gry
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    setBoard(generateBoard());
    setDrawnBalls([]);
    
    // Inicjalizacja pustej planszy zaznaczeń, ze środkiem oznaczonym jako true
    const initialMarked = Array(5).fill().map(() => Array(5).fill(false));
    initialMarked[2][2] = true; 
    setMarkedCells(initialMarked);
    setHasBingo(false);
    setBingoColors([]);
  };

  const drawBall = useCallback(() => {
    if (drawnBalls.length >= 75 || hasBingo) return;

    let newBall;
    do {
      newBall = Math.floor(Math.random() * 75) + 1;
    } while (drawnBalls.some(b => b.num === newBall));

    let letter = '';
    if (newBall <= 15) letter = 'B';
    else if (newBall <= 30) letter = 'I';
    else if (newBall <= 45) letter = 'N';
    else if (newBall <= 60) letter = 'G';
    else letter = 'O';

    setDrawnBalls(prev => [{ letter, num: newBall }, ...prev]);
  }, [drawnBalls, hasBingo]);

  const toggleCell = (row, col) => {
    if (hasBingo) return;

    const cellValue = board[row][col];
    
    // Nie można odznaczyć darmowego pola
    if (row === 2 && col === 2) return;

    // Sprawdzamy czy na planszy jest zaznaczone
    const isCurrentlyMarked = markedCells[row][col];

    // ZMIANA: Można zaznaczyć TYLKO jeśli kliknięta liczba to ostatnio wylosowana kula
    const lastDrawnBall = drawnBalls[0];
    const isLastDrawn = lastDrawnBall && lastDrawnBall.num === cellValue;
    
    // Jeśli nie jest zaznaczone, pozwalamy na to tylko dla ostatniej kuli
    if (!isCurrentlyMarked && !isLastDrawn) {
      return;
    }

    // Pozwalamy odznaczyć błędnie zaznaczone pole (jeśli ktoś np. kliknął przed chwilą przez pomyłkę)
    // Ale w tej wersji mechaniki "missed" (przegapionych) często nie pozwala się już odznaczać prawidłowych.
    // Zostawmy możliwość cofnięcia tylko jeśli to ostatnia kula
    if (isCurrentlyMarked && !isLastDrawn) {
         return; // Zablokowanie odznaczania starych pól
    }

    const newMarked = markedCells.map(r => [...r]);
    newMarked[row][col] = !newMarked[row][col];
    setMarkedCells(newMarked);
    checkForBingo(newMarked);
  };

  const checkForBingo = (marks) => {
    let isBingo = false;
    let winColors = [];
    const colColors = ['#ef4444', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];

    for (let i = 0; i < 5; i++) {
      if (marks.every(row => row[i])) {
        isBingo = true;
        winColors.push(colColors[i]);
      }
    }

    for (let i = 0; i < 5; i++) {
      if (marks[i].every(Boolean)) {
        isBingo = true;
        winColors = [...winColors, ...colColors];
      }
    }

    if (marks[0][0] && marks[1][1] && marks[2][2] && marks[3][3] && marks[4][4]) {
      isBingo = true;
      winColors = [...winColors, ...colColors];
    }
    if (marks[0][4] && marks[1][3] && marks[2][2] && marks[3][1] && marks[4][0]) {
      isBingo = true;
      winColors = [...winColors, ...colColors];
    }

    if (isBingo) {
      setBingoColors([...new Set(winColors)]);
    }
    setHasBingo(isBingo);
  };

  const getBallColor = (letter) => {
    switch (letter) {
      case 'B': return 'bg-red-500';
      case 'I': return 'bg-yellow-500';
      case 'N': return 'bg-green-500';
      case 'G': return 'bg-blue-500';
      case 'O': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getTextColor = (letter) => {
    switch (letter) {
      case 'B': return 'text-red-500';
      case 'I': return 'text-yellow-500';
      case 'N': return 'text-green-500';
      case 'G': return 'text-blue-500';
      case 'O': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  if (board.length === 0) return null;

  return (
    <div className="flex flex-col h-screen bg-[#1c1917] text-white font-sans max-w-md mx-auto relative shadow-2xl overflow-hidden">
      
      {hasBingo && <Confetti colors={bingoColors} />}

      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #000 20px), repeating-linear-gradient(90deg, transparent, transparent 39px, #000 40px)', backgroundSize: '40px 20px' }}>
      </div>

      <div className="bg-[#292524] p-4 shadow-md z-20 border-b-4 border-black flex flex-col items-center justify-center relative">
        <button 
          onClick={() => setShowRules(true)}
          className="absolute top-4 right-4 bg-stone-700 hover:bg-stone-600 text-white rounded-full w-8 h-8 font-bold shadow flex items-center justify-center transition-colors text-sm"
        >
          ?
        </button>
        <h1 className="text-2xl font-black mb-3 text-yellow-400 tracking-widest drop-shadow-md">BINGO MACIEJ</h1>
        
        <div className="flex space-x-2 h-16 w-full items-center justify-center overflow-hidden">
          {drawnBalls.length === 0 ? (
            <p className="text-stone-400 text-sm font-semibold">Naciśnij "Losuj Kule", aby rozpocząć!</p>
          ) : (
            drawnBalls.slice(0, 5).map((ball, idx) => (
              <div 
                key={idx} 
                className={`${getBallColor(ball.letter)} rounded-full w-14 h-14 flex flex-col items-center justify-center shadow-[inset_0_-3px_6px_rgba(0,0,0,0.4)] border-2 border-white/20 transform ${idx === 0 ? 'scale-110 shadow-lg z-10 ring-4 ring-white/50' : 'opacity-80 scale-90'}`}
              >
                <span className="text-xs font-bold -mb-1">{ball.letter}</span>
                <span className="text-xl font-black">{ball.num}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-2 z-10">
        <div className="grid grid-cols-5 gap-2 w-full max-w-[360px] mb-2 px-1">
          {BINGO_LETTERS.map((letter, i) => (
            <div key={i} className={`text-center font-black text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${getTextColor(letter)}`}>
              {letter}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2 w-full max-w-[360px] bg-[#292524] p-3 rounded-lg border-4 border-black shadow-inner relative">
          {board.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              const isMarked = markedCells[rowIndex][colIndex];
              const isFree = cell === 'FREE';
              
              // Podświetlamy komórkę, jeśli to jest ten numer (dla ułatwienia, opcjonalne)
               const lastDrawnBall = drawnBalls[0];
               const isLastDrawn = lastDrawnBall && lastDrawnBall.num === cell;

              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => toggleCell(rowIndex, colIndex)}
                  className={`
                    relative aspect-[4/5] rounded shadow-sm overflow-hidden flex flex-col items-center justify-center font-black text-2xl transition-all duration-200
                    ${isMarked ? 'bg-[#fef3c7] text-stone-800 border-b-4 border-[#fcd34d]' : 'bg-[#fffbeb] text-stone-900 border-b-4 border-[#fde68a] hover:bg-white active:bg-[#fde68a]'}
                    ${isLastDrawn && !isMarked ? 'ring-2 ring-red-500 animate-pulse' : ''} 
                  `}
                >
                  {isMarked ? (
                    <div className="flex flex-col items-center justify-center animate-bounce-short">
                      <span className="text-4xl drop-shadow-md">👴</span>
                    </div>
                  ) : (
                    <span className={`${isFree ? 'text-sm text-red-600' : ''} z-10`}>
                      {cell}
                    </span>
                  )}
                </button>
              );
            })
          ))}
        </div>
      </div>

      <div className="bg-[#292524] p-4 border-t-4 border-black z-10 flex flex-col gap-3">
        {hasBingo ? (
          <button 
            onClick={startNewGame}
            className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-black py-4 rounded-xl shadow-[0_4px_0_#14532d] active:shadow-[0_0px_0_#14532d] active:translate-y-1 transition-all text-xl flex justify-center items-center gap-2"
          >
            🎉 BINGO! WYGRANA! 🎉
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={drawBall}
              className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-stone-900 font-black py-4 rounded-xl shadow-[0_4px_0_#b45309] active:shadow-[0_0px_0_#b45309] active:translate-y-1 transition-all text-lg"
            >
              LOSUJ KULĘ
            </button>
            <button 
              onClick={startNewGame}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-[0_4px_0_#1e3a8a] active:shadow-[0_0px_0_#1e3a8a] active:translate-y-1 transition-all text-lg"
            >
              NOWA GRA
            </button>
          </div>
        )}
      </div>

      {/* Modal z zasadami gry */}
      {showRules && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#292524] border-4 border-black rounded-xl p-6 w-full max-w-[320px] text-center shadow-2xl transform transition-all">
            <h2 className="text-3xl font-black text-yellow-400 mb-4 tracking-wider drop-shadow-md">ZASADY GRY</h2>
            <ul className="text-left space-y-3 mb-6 text-sm text-stone-200 font-semibold bg-[#1c1917] p-4 rounded-lg border-2 border-stone-800 shadow-inner">
              <li>🎱 Naciskaj <span className="text-yellow-400">"LOSUJ KULĘ"</span>, aby odkrywać nowe liczby.</li>
              <li>🔍 Szukaj wylosowanego numeru w odpowiedniej kolumnie (B, I, N, G, O).</li>
              <li>⏳ <strong className="text-red-400">Uwaga! Możesz zaznaczyć pole tylko dla OSTATNIO wylosowanej kuli.</strong></li>
              <li>⭐ Środkowe pole jest darmowe i od razu zaliczone.</li>
              <li>🏆 Zaznacz 5 pól w pionie, poziomie lub na skos, aby wygrać!</li>
            </ul>
            <button
              onClick={() => setShowRules(false)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-8 rounded-xl shadow-[0_4px_0_#1e3a8a] active:shadow-[0_0px_0_#1e3a8a] active:translate-y-1 transition-all text-lg"
            >
              ZROZUMIANO!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
