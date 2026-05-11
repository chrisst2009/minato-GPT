const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

const STATS_FILE = path.join(__dirname, 'tictactoe_stats.json');
const ASSETS_DIR = path.join(__dirname, 'tictactoe_assets');
const VIDEO_DIR = path.join(__dirname, 'tictactoe_videos');

const BOT_UID = global.botID;
const BOT_NAME = "MINATO NAMIKAZE";

let games = {};
let tournaments = {};
let playerStats = loadStats();
const playerCache = new Map();
const imageModeByThread = {};

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

function loadStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8') || '{}');
    }
  } catch (e) {
    return {};
  }
  return {};
}

function saveStats() {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(playerStats, null, 2));
  } catch (e) {}
}

function ensurePlayerStats(id) {
  if (!playerStats[id]) playerStats[id] = { wins: 0, losses: 0, draws: 0, played: 0 };
}

function checkWinner(board) {
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of winPatterns) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function isBoardFull(board) {
  return board.every(cell => cell !== null);
}

function displayBoard(board) {
  const symbols = { '❌': '❌', '⭕': '⭕', null: '⬜' };
  let display = '';
  for (let i = 0; i < 9; i++) {
    display += symbols[board[i]] || '⬜';
    display += (i + 1) % 3 === 0 ? '\n' : ' ';
  }
  return display;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function getPlayerInfo(uid, usersData) {
  if (uid === 'AI') {
    try {
      const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
      const avatarUrl = `https://graph.facebook.com/${BOT_UID}/picture?width=512&height=512&access_token=${token}`;
      const avatar = await loadImage(avatarUrl);
      return { avatar, name: BOT_NAME, uid: 'AI' };
    } catch {
      return { avatar: null, name: BOT_NAME, uid: 'AI' };
    }
  }

  const numericUid = Number(uid);
  if (isNaN(numericUid)) {
    return { avatar: null, name: `Joueur ${uid}`, uid };
  }

  if (playerCache.has(numericUid)) return playerCache.get(numericUid);

  try {
    const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
    const avatarUrl = `https://graph.facebook.com/${numericUid}/picture?width=512&height=512&access_token=${token}`;
    const avatar = await loadImage(avatarUrl);
    const name = await usersData.getName(numericUid) || `Joueur ${numericUid}`;

    const info = { avatar, name, uid: numericUid };
    playerCache.set(numericUid, info);
    setTimeout(() => playerCache.delete(numericUid), 300000);

    return info;
  } catch (error) {
    const info = { avatar: null, name: `Joueur ${numericUid}`, uid: numericUid };
    playerCache.set(numericUid, info);
    return info;
  }
}

function resetGame(gameID, player1, player2, opts = {}) {
  const imageMode = opts.imageMode !== undefined ? opts.imageMode : imageModeByThread[opts.threadID] || false;

  games[gameID] = {
    board: Array(9).fill(null),
    players: [
      { id: player1.id, name: player1.name || `Joueur ${player1.id}`, symbol: "❌" },
      { id: player2.id, name: player2.name || `Joueur ${player2.id}`, symbol: "⭕" }
    ],
    currentPlayerIndex: 0,
    inProgress: true,
    isMathChallenge: false,
    threadID: opts.threadID || player1.threadID || null,
    isTournamentGame: !!opts.isTournamentGame,
    tournamentID: opts.tournamentID || null,
    matchIndex: opts.matchIndex != null ? opts.matchIndex : null,
    isAI: !!opts.isAI,
    aiDifficulty: opts.aiDifficulty || 'normal',
    imageMode: imageMode,
    moves: []
  };
}

async function generateBoardImage(board, currentPlayer, players, usersData, gameType = "normal") {
  try {
    const canvasWidth = 1400;
    const canvasHeight = 1000;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(0.3, '#1a1a2e');
    gradient.addColorStop(0.7, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (gameType === "tournament") {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
      for(let i=0; i<canvasWidth; i+=30) {
        for(let j=0; j<canvasHeight; j+=30) {
          if((i+j)%60===0) ctx.fillRect(i, j, 15, 15);
        }
      }
      
      ctx.font = 'bold 48px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20;
      ctx.fillText('✦ TOURNOI ÉLITE ✦', canvasWidth/2, 90);
      ctx.shadowBlur = 0;
      
      ctx.beginPath();
      ctx.moveTo(canvasWidth/2 - 200, 110);
      ctx.lineTo(canvasWidth/2 - 50, 110);
      ctx.moveTo(canvasWidth/2 + 50, 110);
      ctx.lineTo(canvasWidth/2 + 200, 110);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    const playerInfos = await Promise.all(players.map(p => getPlayerInfo(p.id, usersData)));

    const boardSize = 580;
    const boardX = canvasWidth/2 - boardSize/2;
    const boardY = 230;

    ctx.shadowColor = 'rgba(76, 201, 240, 0.5)';
    ctx.shadowBlur = 25;
    ctx.fillStyle = 'rgba(20, 20, 40, 0.7)';
    ctx.beginPath();
      ctx.roundRect(boardX - 20, boardY - 20, boardSize + 40, boardSize + 40, 25);
      ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#4cc9f0';
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let i = 1; i <= 2; i++) {
      ctx.moveTo(boardX + (boardSize/3)*i, boardY);
      ctx.lineTo(boardX + (boardSize/3)*i, boardY + boardSize);
      ctx.moveTo(boardX, boardY + (boardSize/3)*i);
      ctx.lineTo(boardX + boardSize, boardY + (boardSize/3)*i);
    }
    ctx.stroke();

    ctx.font = 'bold 120px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = boardX + (col * (boardSize/3)) + (boardSize/6);
      const y = boardY + (row * (boardSize/3)) + (boardSize/6);

      if (board[i] === '❌') {
        ctx.shadowColor = '#ff6b6b';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('❌', x, y);
        ctx.shadowBlur = 0;
      } else if (board[i] === '⭕') {
        ctx.shadowColor = '#4ecdc4';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#4ecdc4';
        ctx.fillText('⭕', x, y);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = 'bold 32px "Segoe UI"';
        ctx.fillText((i + 1).toString(), x, y);
        ctx.font = 'bold 120px "Segoe UI"';
      }
    }

    const avatarSize = 140;
    const infoWidth = 380;

    for (let i = 0; i < 2; i++) {
      const player = playerInfos[i];
      const playerData = players[i];
      const isCurrent = currentPlayer && currentPlayer.id === playerData.id;
      
      const panelX = i === 0 ? 80 : canvasWidth - infoWidth - 80;
      const panelY = 200;
      const panelHeight = 500;
      
      ctx.shadowColor = isCurrent ? 'rgba(76, 201, 240, 0.3)' : 'rgba(255, 255, 255, 0.1)';
      ctx.shadowBlur = 20;
      ctx.fillStyle = isCurrent ? 'rgba(76, 201, 240, 0.2)' : 'rgba(30, 30, 60, 0.4)';
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, infoWidth, panelHeight, 30);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.strokeStyle = isCurrent ? '#4cc9f0' : 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, infoWidth, panelHeight, 30);
      ctx.stroke();
      
      if (player.avatar) {
        ctx.save();
        ctx.shadowColor = playerData.symbol === '❌' ? '#ff6b6b' : '#4ecdc4';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(panelX + infoWidth/2, panelY + 110, avatarSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(player.avatar, panelX + infoWidth/2 - avatarSize/2, panelY + 110 - avatarSize/2, avatarSize, avatarSize);
        ctx.restore();
        
        ctx.strokeStyle = playerData.symbol === '❌' ? '#ff6b6b' : '#4ecdc4';
        ctx.lineWidth = 6;
        ctx.stroke();
      }
      
      ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = isCurrent ? '#FFFFFF' : '#CCCCCC';
      ctx.textAlign = 'center';
      ctx.fillText(player.name.substring(0, 20), panelX + infoWidth/2, panelY + 270);
      
      ctx.font = 'bold 65px "Segoe UI", Arial, sans-serif';
      ctx.shadowColor = playerData.symbol === '❌' ? '#ff6b6b' : '#4ecdc4';
      ctx.shadowBlur = 20;
      ctx.fillStyle = playerData.symbol === '❌' ? '#ff6b6b' : '#4ecdc4';
      ctx.fillText(playerData.symbol, panelX + infoWidth/2, panelY + 350);
      ctx.shadowBlur = 0;
      
      if (isCurrent) {
        ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#4cc9f0';
        ctx.fillText('⮞ À SON TOUR', panelX + infoWidth/2, panelY + 420);
      }
    }

    if (currentPlayer) {
      ctx.font = 'bold 50px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = currentPlayer.symbol === '❌' ? '#ff6b6b' : '#4ecdc4';
      ctx.textAlign = 'center';
      ctx.shadowColor = currentPlayer.symbol === '❌' ? '#ff6b6b' : '#4ecdc4';
      ctx.shadowBlur = 20;
      ctx.fillText('⤓', canvasWidth/2, boardY + boardSize + 80);
      ctx.shadowBlur = 0;
      
      ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`Tour de : ${currentPlayer.name}`, canvasWidth/2, boardY + boardSize + 150);
    }

    const availableMoves = board.map((cell, idx) => cell === null ? idx + 1 : null).filter(x => x !== null);
    ctx.font = '28px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText(`Cases disponibles: ${availableMoves.join(', ')}`, canvasWidth/2, boardY + boardSize + 210);

    return canvas.toBuffer();
  } catch (error) {
    console.error('Erreur génération image plateau:', error);
    return null;
  }
}

async function generateEndGameImage(board, winner, players, usersData, isDraw = false) {
  try {
    const canvasWidth = 1400;
    const canvasHeight = 1000;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(0.4, '#1a1a2e');
    gradient.addColorStop(0.6, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    for(let i=0; i<50; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvasWidth, Math.random() * canvasHeight, Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const playerInfos = await Promise.all(players.map(p => getPlayerInfo(p.id, usersData)));

    const boardSize = 500;
    const boardX = canvasWidth/2 - boardSize/2;
    const boardY = 150;

    ctx.shadowColor = isDraw ? '#4cc9f0' : '#FFD700';
    ctx.shadowBlur = 30;
    ctx.fillStyle = 'rgba(20, 20, 40, 0.8)';
    ctx.beginPath();
      ctx.roundRect(boardX - 20, boardY - 20, boardSize + 40, boardSize + 40, 20);
      ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = isDraw ? '#4cc9f0' : '#FFD700';
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let i = 1; i <= 2; i++) {
      ctx.moveTo(boardX + (boardSize/3)*i, boardY);
      ctx.lineTo(boardX + (boardSize/3)*i, boardY + boardSize);
      ctx.moveTo(boardX, boardY + (boardSize/3)*i);
      ctx.lineTo(boardX + boardSize, boardY + (boardSize/3)*i);
    }
    ctx.stroke();

    ctx.font = 'bold 90px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = boardX + (col * (boardSize/3)) + (boardSize/6);
      const y = boardY + (row * (boardSize/3)) + (boardSize/6);

      if (board[i] === '❌') {
        ctx.shadowColor = '#ff6b6b';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('❌', x, y);
        ctx.shadowBlur = 0;
      } else if (board[i] === '⭕') {
        ctx.shadowColor = '#4ecdc4';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#4ecdc4';
        ctx.fillText('⭕', x, y);
        ctx.shadowBlur = 0;
      }
    }

    const avatarSize = 120;
    const infoWidth = 320;

    for (let i = 0; i < 2; i++) {
      const player = playerInfos[i];
      const playerData = players[i];
      const isWinner = winner && winner.id === playerData.id;
      
      const panelX = i === 0 ? 100 : canvasWidth - infoWidth - 100;
      const panelY = 700;
      const panelHeight = 200;
      
      ctx.shadowColor = isWinner ? '#FFD700' : 'rgba(255, 255, 255, 0.1)';
      ctx.shadowBlur = 15;
      ctx.fillStyle = isWinner ? 'rgba(255, 215, 0, 0.25)' : 'rgba(30, 30, 60, 0.4)';
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, infoWidth, panelHeight, 20);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.strokeStyle = isWinner ? '#FFD700' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      if (player.avatar) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(panelX + infoWidth/2, panelY + 50, avatarSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(player.avatar, panelX + infoWidth/2 - avatarSize/2, panelY + 50 - avatarSize/2, avatarSize, avatarSize);
        ctx.restore();
        
        ctx.strokeStyle = playerData.symbol === '❌' ? '#ff6b6b' : '#4ecdc4';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      
      ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = isWinner ? '#FFD700' : '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(player.name.substring(0, 18), panelX + infoWidth/2, panelY + 150);
      
      ctx.font = 'bold 45px "Segoe UI", Arial, sans-serif';
      ctx.shadowColor = playerData.symbol === '❌' ? '#ff6b6b' : '#4ecdc4';
      ctx.shadowBlur = 15;
      ctx.fillStyle = playerData.symbol === '❌' ? '#ff6b6b' : '#4ecdc4';
      ctx.fillText(playerData.symbol, panelX + infoWidth/2, panelY + 190);
      ctx.shadowBlur = 0;
      
      if (isWinner) {
        ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
        ctx.fillText('🏆 GAGNANT', panelX + infoWidth/2, panelY + 230);
        ctx.shadowBlur = 0;
      }
    }

    ctx.font = 'bold 70px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = isDraw ? '#4cc9f0' : '#FFD700';
    ctx.textAlign = 'center';
    ctx.shadowColor = isDraw ? '#4cc9f0' : '#FFD700';
    ctx.shadowBlur = 25;

    if (isDraw) {
      ctx.fillText('═══ ✦ MATCH NUL ✦ ═══', canvasWidth/2, 650);
    } else if (winner) {
      ctx.fillText('═══ ✦ VICTOIRE ✦ ═══', canvasWidth/2, 650);
      ctx.font = 'bold 55px "Segoe UI", Arial, sans-serif';
      ctx.fillText(`${winner.name}`, canvasWidth/2, 720);
    }
    ctx.shadowBlur = 0;

    ctx.font = 'italic 30px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText('☞【𝐻𝑒𝑑𝑔𝑒ℎ𝑜𝑔𝄞𝙂𝙋𝙏】 • Système TicTacToe Ultimate', canvasWidth/2, 950);

    return canvas.toBuffer();
  } catch (error) {
    console.error('Erreur génération image fin:', error);
    return null;
  }
}

async function generateTournamentBracketImage(tournament, usersData) {
  try {
    const playerCount = tournament.players.length;
    const width = 2000;
    const height = 1600;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(0.5, '#1a1a2e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for(let i=0; i<100; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = 'bold 70px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#4cc9f0';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#4cc9f0';
    ctx.shadowBlur = 30;
    ctx.fillText('🏆 TOURNOI ÉLITE - BRACKET 🏆', width/2, 100);
    ctx.shadowBlur = 0;

    ctx.font = 'bold 35px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Statut: ${getTournamentStatus(tournament)}`, width/2, 170);

    if (tournament.status === 'registration') {
      ctx.font = 'bold 60px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`EN ATTENTE DE JOUEURS`, width/2, height/2 - 120);
      
      const needed = tournament.requiredPlayers - playerCount;
      ctx.font = 'bold 45px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#888888';
      ctx.fillText(`Inscrits: ${playerCount} / ${tournament.requiredPlayers}`, width/2, height/2);
      ctx.fillText(`(Manque ${needed})`, width/2, height/2 + 70);

      let yList = height/2 + 180;
      ctx.font = '32px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      tournament.players.forEach((p, i) => {
        ctx.fillText(`${i+1}. ${p.name}`, width/2, yList + (i * 45));
      });
      return canvas.toBuffer();
    }

    const roundCount = tournament.rounds.length;
    const columnWidth = (width - 200) / roundCount;
    const startX = 100;

    const positions = {};

    for (let r = 0; r < roundCount; r++) {
      const round = tournament.rounds[r];
      const matchCount = round.matches.length;
      const x = startX + (r * columnWidth);
      
      ctx.font = 'bold 38px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = r === tournament.currentRoundIndex ? '#FFD700' : '#4cc9f0';
      ctx.textAlign = 'center';
      ctx.fillText(round.name.toUpperCase(), x + 150, 250);

      positions[r] = [];

      for (let m = 0; m < matchCount; m++) {
        const match = round.matches[m];
        let y;

        if (r === 0) {
          const totalHeight = height - 350;
          const spacing = totalHeight / matchCount;
          y = 350 + (m * spacing) + (spacing/2) - 60;
        } else {
          const parent1 = positions[r-1][m*2];
          const parent2 = positions[r-1][m*2+1];
          if (parent1 && parent2) {
            y = (parent1.y + parent2.y) / 2;
          } else {
            y = 350 + (m * 200);
          }
        }
        
        positions[r].push({x, y});

        const p1 = tournament.players.find(p => p.id === match.player1);
        const p2 = tournament.players.find(p => p.id === match.player2);
        
        const p1Name = p1 ? p1.name.substring(0, 15) : '???';
        const p2Name = p2 ? p2.name.substring(0, 15) : '???';

        const boxWidth = 300;
        const boxHeight = 110;

        if (r > 0) {
          const parent1 = positions[r-1][m*2];
          const parent2 = positions[r-1][m*2+1];
          ctx.strokeStyle = '#4cc9f0';
          ctx.lineWidth = 3;
          ctx.beginPath();
          
