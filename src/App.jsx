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

const THEMES = {
  stone: {
    name: 'Stone',
    bg: 'bg-[#1c1917]',
    header: 'bg-[#292524]',
    board: 'bg-[#292524]',
    cell: 'bg-[#fffbeb]',
    cellText: 'text-stone-900',
    cellBorder: 'border-[#fde68a]',
    marked: 'bg-[#fef3c7]',
    markedBorder: 'border-[#fcd34d]',
    accent: 'text-yellow-400',
    button: 'bg-yellow-500 hover:bg-yellow-400 text-stone-900',
    buttonShadow: 'shadow-[0_4px_0_#b45309]',
    cardBorder: 'border-black'
  },
  neon: {
    name: 'Neon',
    bg: 'bg-[#0f172a]',
    header: 'bg-[#1e293b]',
    board: 'bg-[#1e293b]',
    cell: 'bg-[#334155]',
    cellText: 'text-sky-100',
    cellBorder: 'border-sky-500/30',
    marked: 'bg-fuchsia-600/20',
    markedBorder: 'border-fuchsia-400',
    accent: 'text-fuchsia-400',
    button: 'bg-sky-500 hover:bg-sky-400 text-white',
    buttonShadow: 'shadow-[0_4px_0_#0369a1]',
    cardBorder: 'border-sky-900'
  },
  golden: {
    name: 'Golden',
    bg: 'bg-[#000000]',
    header: 'bg-[#1a1a1a]',
    board: 'bg-[#1a1a1a]',
    cell: 'bg-[#262626]',
    cellText: 'text-amber-100',
    cellBorder: 'border-amber-900',
    marked: 'bg-amber-500/10',
    markedBorder: 'border-amber-500',
    accent: 'text-amber-500',
    button: 'bg-amber-600 hover:bg-amber-500 text-black',
    buttonShadow: 'shadow-[0_4px_0_#92400e]',
    cardBorder: 'border-amber-900'
  }
};

const STAMPS = ['👴', '⭐', '❤️', '❌', '✅', '🔥', '🏆'];

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
  const [showSettings, setShowSettings] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // User Preferences
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('bingo-theme') || 'stone');
  const [stamp, setStamp] = useState(() => localStorage.getItem('bingo-stamp') || '👴');

  const theme = THEMES[themeKey] || THEMES.stone;

  // Persistence
  useEffect(() => {
    localStorage.setItem('bingo-theme', themeKey);
  }, [themeKey]);

  useEffect(() => {
    localStorage.setItem('bingo-stamp', stamp);
  }, [stamp]);

  // Inicjalizacja gry
  useEffect(() => {
    startNewGame();
  }, []);

  // Timer logic
  useEffect(() => {
    if (timeLeft > 0 && !hasBingo) {
      const timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 0.1));
      }, 100);
      return () => clearInterval(timer);
    }
  }, [timeLeft, hasBingo]);

  const startNewGame = () => {
    setBoard(generateBoard());
    setDrawnBalls([]);
    
    const initialMarked = Array(5).fill().map(() => Array(5).fill(false));
    initialMarked[2][2] = true; 
    setMarkedCells(initialMarked);
    setHasBingo(false);
    setBingoColors([]);
    setTimeLeft(0);
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
    setTimeLeft(5); 
  }, [drawnBalls, hasBingo]);

  const toggleCell = (row, col) => {
    if (hasBingo) return;

    const cellValue = board[row][col];
    
    if (row === 2 && col === 2) return;

    const isCurrentlyMarked = markedCells[row][col];
    const lastDrawnBall = drawnBalls[0];
    const isLastDrawn = lastDrawnBall && lastDrawnBall.num === cellValue;
    
    if (!isCurrentlyMarked) {
      if (!isLastDrawn || timeLeft <= 0) {
        return;
      }
    } else {
      if (!isLastDrawn || timeLeft <= 0) {
        return;
      }
    }

    const newMarked = markedCells.map(r => [...r]);
    newMarked[row][col] = !newMarked[row][col];
    setMarkedCells(newMarked);
    if (newMarked[row][col]) {
      setTimeLeft(0);
    }
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
      setTimeLeft(0);
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
    <div className={`flex flex-col h-screen ${theme.bg} text-white font-sans max-w-md mx-auto relative shadow-2xl overflow-hidden transition-colors duration-500`}>
      
      {hasBingo && <Confetti colors={bingoColors} />}

      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #000 20px), repeating-linear-gradient(90deg, transparent, transparent 39px, #000 40px)', backgroundSize: '40px 20px' }}>
      </div>

      <div className={`${theme.header} p-4 shadow-md z-20 border-b-4 ${theme.cardBorder} flex flex-col items-center justify-center relative transition-colors duration-500`}>
        <div className="absolute top-4 right-4 flex gap-2">
            <button 
                onClick={() => setShowSettings(true)}
                className="bg-stone-700 hover:bg-stone-600 text-white rounded-full w-8 h-8 font-bold shadow flex items-center justify-center transition-colors text-sm"
            >
                🎨
            </button>
            <button 
                onClick={() => setShowRules(true)}
                className="bg-stone-700 hover:bg-stone-600 text-white rounded-full w-8 h-8 font-bold shadow flex items-center justify-center transition-colors text-sm"
            >
                ?
            </button>
        </div>
        
        <h1 className={`text-2xl font-black mb-3 ${theme.accent} tracking-widest drop-shadow-md`}>BINGO MACIEJ</h1>
        
        <div className="flex space-x-2 h-16 w-full items-center justify-center overflow-hidden">
          {drawnBalls.length === 0 ? (
            <p className="text-stone-400 text-sm font-semibold">Naciśnij "Losuj Kule", aby rozpocząć!</p>
          ) : (
            drawnBalls.slice(0, 5).map((ball, idx) => (
              <div 
                key={idx} 
                className={`${getBallColor(ball.letter)} rounded-full w-14 h-14 flex flex-col items-center justify-center shadow-[inset_0_-3px_6px_rgba(0,0,0,0.4)] border-2 border-white/20 transform ${idx === 0 ? 'scale-110 shadow-lg z-10 ring-4 ring-white/50' : 'opacity-80 scale-90'}`}
              >
                <span className="text-xs font-bold -mb-1 text-white">{ball.letter}</span>
                <span className="text-xl font-black text-white">{ball.num}</span>
              </div>
            ))
          )}
        </div>

        {timeLeft > 0 && (
          <div className="w-full h-2 bg-stone-800 rounded-full mt-3 overflow-hidden border border-black/40">
            <div 
              className={`h-full transition-all duration-100 ease-linear ${timeLeft < 1.5 ? 'bg-red-500 animate-pulse' : timeLeft < 3 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${(timeLeft / 5) * 100}%` }}
            ></div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-2 z-10">
        <div className="grid grid-cols-5 gap-2 w-full max-w-[360px] mb-2 px-1">
          {BINGO_LETTERS.map((letter, i) => (
            <div key={i} className={`text-center font-black text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${getTextColor(letter)}`}>
              {letter}
            </div>
          ))}
        </div>

        <div className={`grid grid-cols-5 gap-2 w-full max-w-[360px] ${theme.board} p-3 rounded-lg border-4 ${theme.cardBorder} shadow-inner relative transition-colors duration-500`}>
          {board.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              const isMarked = markedCells[rowIndex][colIndex];
              const isFree = cell === 'FREE';

              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => toggleCell(rowIndex, colIndex)}
                  className={`
                    relative aspect-[4/5] rounded shadow-sm overflow-hidden flex flex-col items-center justify-center font-black text-2xl transition-all duration-200
                    ${isMarked ? `${theme.marked} ${theme.accent} border-b-4 ${theme.markedBorder}` : `${theme.cell} ${theme.cellText} border-b-4 ${theme.cellBorder} hover:brightness-110 active:scale-95`}
                  `}
                >
                  {isMarked ? (
                    <div className="flex flex-col items-center justify-center animate-bounce-short">
                      <span className="text-4xl drop-shadow-md">{stamp}</span>
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

      <div className={`${theme.header} p-4 border-t-4 ${theme.cardBorder} z-10 flex flex-col gap-3 transition-colors duration-500`}>
        {hasBingo ? (
          <button 
            onClick={startNewGame}
            className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-black py-4 rounded-xl shadow-[0_4px_0_#14532d] active:shadow-[0_0px_0_#14532d] active:translate-y-1 transition-all text-xl flex justify-center items-center gap-2"
          >
            🎉 BINGO! 🎉
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={drawBall}
              className={`flex-1 ${theme.button} font-black py-4 rounded-xl ${theme.buttonShadow} active:shadow-none active:translate-y-1 transition-all text-lg`}
            >
              LOSUJ KULĘ
            </button>
            <button 
              onClick={startNewGame}
              className="flex-1 bg-neutral-600 hover:bg-neutral-500 text-white font-black py-4 rounded-xl shadow-[0_4px_0_#404040] active:shadow-none active:translate-y-1 transition-all text-lg"
            >
              NOWA GRA
            </button>
          </div>
        )}
      </div>

      {/* Modal z zasadami gry */}
      {showRules && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className={`${theme.header} border-4 ${theme.cardBorder} rounded-xl p-6 w-full max-w-[320px] text-center shadow-2xl`}>
            <h2 className={`text-3xl font-black ${theme.accent} mb-4 tracking-wider drop-shadow-md`}>ZASADY GRY</h2>
            <ul className="text-left space-y-3 mb-6 text-sm text-stone-200 font-semibold bg-black/40 p-4 rounded-lg border-2 border-white/5">
              <li>🎱 Naciskaj <span className="text-yellow-400">"LOSUJ KULĘ"</span>, aby odkrywać liczby.</li>
              <li>🔍 Szukaj wylosowanego numeru w odpowiedniej kolumnie.</li>
              <li>⏳ <strong className="text-red-400">Masz 5 SEKUND na zaznaczenie numeru!</strong></li>
              <li>🏆 Zaznacz 5 pól w linii, aby wygrać!</li>
            </ul>
            <button
              onClick={() => setShowRules(false)}
              className="w-full bg-blue-600 text-white font-black py-3 rounded-xl shadow-[0_4px_0_#1e3a8a] active:translate-y-1"
            >
              ZROZUMIANO!
            </button>
          </div>
        </div>
      )}

      {/* Modal Ustawień (Personalizacja) */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className={`${theme.header} border-4 ${theme.cardBorder} rounded-xl p-6 w-full max-w-[340px] shadow-2xl`}>
            <h2 className={`text-2xl font-black ${theme.accent} mb-6 text-center tracking-wider`}>PERSONALIZACJA</h2>
            
            <div className="mb-6">
                <p className="text-xs uppercase font-black text-stone-400 mb-3 ml-1 tracking-widest">Wybierz Motyw</p>
                <div className="grid grid-cols-3 gap-2">
                    {Object.keys(THEMES).map(k => (
                        <button 
                            key={k}
                            onClick={() => setThemeKey(k)}
                            className={`p-2 rounded-lg border-2 transition-all ${themeKey === k ? 'border-yellow-400 scale-105 shadow-lg' : 'border-white/10 hover:border-white/30'} ${THEMES[k].bg}`}
                        >
                            <span className={`text-[10px] font-black ${THEMES[k].accent}`}>{THEMES[k].name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-8">
                <p className="text-xs uppercase font-black text-stone-400 mb-3 ml-1 tracking-widest">Wybierz Stempel</p>
                <div className="flex flex-wrap justify-center gap-2">
                    {STAMPS.map(s => (
                        <button 
                            key={s}
                            onClick={() => setStamp(s)}
                            className={`w-10 h-10 text-xl flex items-center justify-center rounded-full border-2 transition-all ${stamp === s ? 'border-yellow-400 scale-125 bg-white/10' : 'border-white/5 hover:border-white/20 bg-black/20'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl shadow-[0_4px_0_#14532d] active:shadow-none active:translate-y-1 transition-all"
            >
              GOTOWE!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
