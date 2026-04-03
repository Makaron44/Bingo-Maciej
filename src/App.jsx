import React, { useState, useEffect, useCallback, useRef } from 'react';

// Help functions for board generation
const generateColumn = (min, max, count) => {
  const nums = new Set();
  while (nums.size < count) {
    nums.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return Array.from(nums);
};

const generateBoard = () => {
  const b = generateColumn(1, 15, 5);
  const i = generateColumn(16, 30, 5);
  const n = generateColumn(31, 45, 4); // Middle is FREE
  const g = generateColumn(46, 60, 5);
  const o = generateColumn(61, 75, 5);
  n.splice(2, 0, 'FREE');
  const board = [];
  for (let r = 0; r < 5; r++) {
    board.push([b[r], i[r], n[r], g[r], o[r]]);
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

const SFX = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  stamp: 'https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3',
  win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'
};

const Confetti = ({ colors }) => {
  const pieces = Array.from({ length: 75 }).map((_, idx) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 2;
    const duration = Math.random() * 2 + 2;
    const palette = colors?.length ? colors : ['#ef4444', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
    const color = palette[Math.floor(Math.random() * palette.length)];
    return (
      <div key={idx} className="absolute top-[-20px] w-2 h-5 opacity-90 rounded-sm z-50"
        style={{ left: `${left}%`, backgroundColor: color, animation: `fall ${duration}s linear ${delay}s infinite` }} />
    );
  });
  return <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">{pieces}</div>;
};

const App = () => {
  const [board, setBoard] = useState([]);
  const [drawnBalls, setDrawnBalls] = useState([]);
  const [markedCells, setMarkedCells] = useState(Array(5).fill().map(() => Array(5).fill(false)));
  const [hasBingo, setHasBingo] = useState(false);
  const [bingoColors, setBingoColors] = useState([]);
  const [winningCells, setWinningCells] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('bingo-high-score')) || 0);
  const [muted, setMuted] = useState(() => localStorage.getItem('bingo-muted') === 'true');
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('bingo-theme') || 'stone');
  const [stamp, setStamp] = useState(() => localStorage.getItem('bingo-stamp') || '👴');

  const theme = THEMES[themeKey] || THEMES.stone;
  const sfxRefs = useRef({});

  useEffect(() => {
    localStorage.setItem('bingo-theme', themeKey);
    localStorage.setItem('bingo-stamp', stamp);
    localStorage.setItem('bingo-muted', muted);
    localStorage.setItem('bingo-high-score', highScore);
  }, [themeKey, stamp, muted, highScore]);

  useEffect(() => {
    setBoard(generateBoard());
    const initial = Array(5).fill().map(() => Array(5).fill(false));
    initial[2][2] = true;
    setMarkedCells(initial);
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !hasBingo) {
      const timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 0.1)), 100);
      return () => clearInterval(timer);
    }
  }, [timeLeft, hasBingo]);

  const playSfx = (type) => {
    if (muted) return;
    if (!sfxRefs.current[type]) sfxRefs.current[type] = new Audio(SFX[type]);
    const audio = sfxRefs.current[type];
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };

  const startNewGame = () => {
    setBoard(generateBoard());
    setDrawnBalls([]);
    const initial = Array(5).fill().map(() => Array(5).fill(false));
    initial[2][2] = true;
    setMarkedCells(initial);
    setHasBingo(false);
    setWinningCells([]);
    setScore(0);
    setTimeLeft(0);
  };

  const drawBall = useCallback(() => {
    if (drawnBalls.length >= 75 || hasBingo) return;
    let newBall;
    do { newBall = Math.floor(Math.random() * 75) + 1; } while (drawnBalls.some(b => b.num === newBall));
    let letter = newBall <= 15 ? 'B' : newBall <= 30 ? 'I' : newBall <= 45 ? 'N' : newBall <= 60 ? 'G' : 'O';
    setDrawnBalls(prev => [{ letter, num: newBall }, ...prev]);
    setTimeLeft(5);
    playSfx('click');
  }, [drawnBalls, hasBingo, muted]);

  const toggleCell = (row, col) => {
    if (hasBingo) return;
    const val = board[row][col];
    if (val === 'FREE' || markedCells[row][col]) return;
    const last = drawnBalls[0];
    if (last?.num !== val || timeLeft <= 0) return;

    const newMarked = markedCells.map(r => [...r]);
    newMarked[row][col] = true;
    const points = Math.floor(100 + timeLeft * 20);
    setScore(prev => prev + points);
    setMarkedCells(newMarked);
    setTimeLeft(0);
    playSfx('stamp');
    checkForBingo(newMarked);
  };

  const checkForBingo = (marks) => {
    const winColors = [];
    const winIndices = new Set();
    const colColors = ['#ef4444', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
    
    // Check Columns
    for (let c = 0; c < 5; c++) {
      if (marks.every(r => r[c])) {
        winColors.push(colColors[c]);
        for (let r = 0; r < 5; r++) winIndices.add(`${r},${c}`);
      }
    }
    // Check Rows
    for (let r = 0; r < 5; r++) {
      if (marks[r].every(Boolean)) {
        winColors.push(...colColors);
        for (let c = 0; c < 5; c++) winIndices.add(`${r},${c}`);
      }
    }
    // Check Diagonals
    if ([0,1,2,3,4].every(i => marks[i][i])) {
      winColors.push(...colColors);
      for (let i = 0; i < 5; i++) winIndices.add(`${i},${i}`);
    }
    if ([0,1,2,3,4].every(i => marks[i][4-i])) {
      winColors.push(...colColors);
      for (let i = 0; i < 5; i++) winIndices.add(`${i},${4-i}`);
    }

    if (winColors.length) {
      const finalScore = score + 1000;
      setScore(finalScore);
      if (finalScore > highScore) setHighScore(finalScore);
      setBingoColors([...new Set(winColors)]);
      setWinningCells(Array.from(winIndices));
      setHasBingo(true);
      playSfx('win');
    }
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

  return (
    <div className={`flex flex-col h-screen ${theme.bg} text-white font-sans max-w-md mx-auto relative shadow-2xl overflow-hidden`}>
      {hasBingo && <Confetti colors={bingoColors} />}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #000 20px), repeating-linear-gradient(90deg, transparent, transparent 39px, #000 40px)', backgroundSize: '40px 20px' }}></div>

      <div className={`${theme.header} p-4 shadow-md z-20 border-b-4 ${theme.cardBorder} flex flex-col items-center relative`}>
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => setShowSettings(true)} className="bg-stone-700/50 hover:bg-stone-600 p-1.5 rounded-full">🎨</button>
          <button onClick={() => setShowRules(true)} className="bg-stone-700/50 hover:bg-stone-600 p-1.5 rounded-full">?</button>
        </div>
        <h1 className={`text-2xl font-black mb-1 ${theme.accent} tracking-widest`}>BINGO MACIEJ</h1>
        <div className="flex gap-4 text-[10px] font-black uppercase text-stone-400 mb-2">
          <span>Score: <span className={theme.accent}>{score}</span></span>
          <span>Best: <span className={theme.accent}>{highScore}</span></span>
          <span>Balls: <span className={theme.accent}>{drawnBalls.length}</span></span>
        </div>
        <div className="flex space-x-2 h-14 w-full items-center justify-center">
          {drawnBalls.length === 0 ? <p className="text-stone-400 text-xs">Gotowy?</p> :
            drawnBalls.slice(0, 5).map((b, i) => (
              <div key={i} className={`${getBallColor(b.letter)} rounded-full w-12 h-12 flex flex-col items-center justify-center border-2 border-white/20 transform ${i === 0 ? 'scale-110 shadow-lg ring-4 ring-white/30' : 'opacity-70 scale-90'}`}>
                <span className="text-[10px] font-bold -mb-1">{b.letter}</span>
                <span className="text-lg font-black">{b.num}</span>
              </div>
            ))
          }
        </div>
        {timeLeft > 0 && (
          <div className="w-full h-1.5 bg-stone-800 rounded-full mt-3 overflow-hidden border border-black/20">
            <div className={`h-full transition-all duration-100 ease-linear ${timeLeft < 1.5 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} style={{ width: `${(timeLeft / 5) * 100}%` }}></div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-2 z-10">
        <div className="grid grid-cols-5 gap-2 w-full max-w-[360px] mb-2 px-1">
          {BINGO_LETTERS.map((l, i) => <div key={i} className={`text-center font-black text-2xl drop-shadow-md ${getTextColor(l)}`}>{l}</div>)}
        </div>
        <div className={`grid grid-cols-5 gap-2 w-full max-w-[360px] ${theme.board} p-3 rounded-lg border-4 ${theme.cardBorder} shadow-inner`}>
          {board?.map((r, ri) => r.map((c, ci) => {
            const m = markedCells[ri][ci], f = c === 'FREE', win = winningCells.includes(`${ri},${ci}`);
            return <button key={`${ri}-${ci}`} onClick={() => toggleCell(ri, ci)} className={`relative aspect-[4/5] rounded shadow-sm flex flex-col items-center justify-center font-black text-2xl transition-all ${win ? 'animate-win-blink' : ''} ${m ? `${theme.marked} ${theme.accent} border-b-4 ${theme.markedBorder}` : `${theme.cell} ${theme.cellText} border-b-4 ${theme.cellBorder} hover:brightness-110`}`}>
              {m ? <span className="text-4xl animate-bounce-short">{stamp}</span> : <span className={`${f?'text-sm text-red-600':''} z-10`}>{c}</span>}
            </button>
          }))}
        </div>
      </div>

      <div className={`${theme.header} p-4 border-t-4 ${theme.cardBorder} z-10 flex flex-col gap-3`}>
        <button onClick={hasBingo ? startNewGame : drawBall} className={`w-full ${hasBingo ? 'bg-green-600' : theme.button} font-black py-4 rounded-xl ${hasBingo ? 'shadow-[0_4px_0_#14532d]' : theme.buttonShadow} active:translate-y-1 transition-all text-xl`}>
          {hasBingo ? 'NOWA GRA' : 'LOSUJ KULĘ'}
        </button>
      </div>

      {showRules && <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><div className={`${theme.header} p-6 rounded-xl border-4 ${theme.cardBorder} text-center max-w-xs`}><h2 className={`text-2xl font-black ${theme.accent} mb-4`}>ZASADY</h2><ul className="text-left text-xs mb-6 space-y-2 opacity-90"><li>🎱 Losuj liczby i szukaj ich na planszy.</li><li>⏳ Masz 5 SEKUND na zaznaczenie ostatniej kuli!</li><li>🏆 Zaznacz 5 pól w linii by wygrać BINGO!</li></ul><button onClick={()=>setShowRules(false)} className="w-full bg-blue-600 py-3 rounded-xl font-black shadow-[0_4px_0_#1e3a8a]">START!</button></div></div>}
      
      {showSettings && <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><div className={`${theme.header} p-6 rounded-xl border-4 ${theme.cardBorder} w-full max-w-sm`}><h2 className={`text-xl font-black ${theme.accent} mb-6 text-center`}>PERSONALIZACJA</h2><div className="mb-6"><p className="text-[10px] uppercase font-black opacity-50 mb-3 ml-1 tracking-widest">Wybierz Motyw</p><div className="grid grid-cols-3 gap-2">{Object.keys(THEMES).map(k=><button key={k} onClick={()=>setThemeKey(k)} className={`p-2 rounded border-2 transition-all ${themeKey===k?'border-white opacity-100 scale-105':'border-transparent opacity-60'} ${THEMES[k].bg} text-[8px] font-black`}>{THEMES[k].name}</button>)}</div></div><div className="mb-6"><p className="text-[10px] uppercase font-black opacity-50 mb-3 ml-1 tracking-widest">Wybierz Stempel</p><div className="flex flex-wrap gap-2">{STAMPS.map(s=><button key={s} onClick={()=>setStamp(s)} className={`w-9 h-9 border-2 rounded-full flex items-center justify-center transition-all ${stamp===s?'border-white bg-white/20 scale-110':'border-transparent bg-black/20 opacity-60'}`}>{s}</button>)}</div></div><div className="mb-8 flex items-center justify-between px-2"><span className="text-xs font-black uppercase opacity-70">Dźwięk</span><button onClick={()=>setMuted(!muted)} className="text-2xl transition-transform active:scale-75">{muted?'🔇':'🔊'}</button></div><button onClick={()=>setShowSettings(false)} className="w-full bg-green-600 py-4 rounded-xl font-black shadow-[0_4px_0_#14532d]">ZAPISZ</button></div></div>}
    </div>
  );
};

export default App;
