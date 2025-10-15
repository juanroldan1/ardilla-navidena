import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const App = () => {
  const canvasRef = useRef(null);
  const imagesRef = useRef({
    player: null,
    gift: null,
    background: null,
    platform: null,
    spike: null,
    fire: null,
    ice: null,
    loaded: false
  });

  const gameRef = useRef({
    player: { x: 50, y: 400, w: 40, h: 40, vx: 0, vy: 0, speed: 5, jumpPower: 13, grounded: false, frame: 0 },
    gifts: [],
    obstacles: [],
    platforms: [],
    keys: {},
    gravity: 0.6,
    collected: 0,
    totalGifts: 0,
    gameStarted: false,
    gameEnded: false,
    animationId: null,
    timeRemaining: 45,
    lastTime: Date.now(),
    timeBonus: 5,
    gameOverReason: '',
    lastObstacleSpawn: 0,
    obstacleSpawnInterval: 3000
  });

  

  const [collected, setCollected] = useState(0);
  const [totalGifts, setTotalGifts] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canSubmit, setCanSubmit] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [gameOverReason, setGameOverReason] = useState('');

  const SHEET_URL = 'TU_URL_DEL_SCRIPT_WEB_AQUI';

  // ========================================
  // 🖼️ CARGA DE IMÁGENES - REEMPLAZA AQUÍ
  // ========================================
  const loadImages = () => {
    const images = imagesRef.current;
    
    // PLAYER/ARDILLA - Reemplaza con tu sprite de ardilla
    // images.player = new Image();
    // images.player.src = '/assets/squirrel.png';
    
    // REGALO - Reemplaza con tu sprite de regalo
    // images.gift = new Image();
    // images.gift.src = '/assets/gift.png';
    
    // FONDO - Reemplaza con tu imagen de fondo navideño
    // images.background = new Image();
    // images.background.src = '/assets/background.png';
    
    // PLATAFORMA - Reemplaza con tu sprite de plataforma
    // images.platform = new Image();
    // images.platform.src = '/assets/platform.png';
    
    // OBSTÁCULO PÚAS - Reemplaza con tu sprite de púas
    // images.spike = new Image();
    // images.spike.src = '/assets/spike.png';
    
    // OBSTÁCULO FUEGO - Reemplaza con tu sprite de fuego (puede ser animado)
    // images.fire = new Image();
    // images.fire.src = '/assets/fire.png';
    
    // OBSTÁCULO HIELO - Reemplaza con tu sprite de hielo
    // images.ice = new Image();
    // images.ice.src = '/assets/ice.png';
    
    // Marca como cargado cuando todas las imágenes estén listas
    // Promise.all([
    //   new Promise(resolve => images.player.onload = resolve),
    //   new Promise(resolve => images.gift.onload = resolve),
    //   new Promise(resolve => images.background.onload = resolve),
    //   new Promise(resolve => images.platform.onload = resolve),
    //   new Promise(resolve => images.spike.onload = resolve),
    //   new Promise(resolve => images.fire.onload = resolve),
    //   new Promise(resolve => images.ice.onload = resolve),
    // ]).then(() => {
    //   images.loaded = true;
    // });
  };

  const createLevel = () => {
    const game = gameRef.current;
    
    // Generar plataformas aleatorias con movimiento
    game.platforms = [];
    
    // Suelo fijo
    game.platforms.push({
      x: 0, y: 570, w: 800, h: 30,
      moving: false, speed: 0, direction: 1, minX: 0, maxX: 0
    });
    
    // Generar 10-15 plataformas aleatorias
    const numPlatforms = 10 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < numPlatforms; i++) {
      const platformWidth = 80 + Math.random() * 100;
      const platformHeight = 15 + Math.random() * 10;
      const platformY = 150 + Math.random() * 350;
      const platformX = Math.random() * (800 - platformWidth);
      
      // 40% de probabilidad de ser móvil
      const isMoving = Math.random() < 0.4;
      
      let platform = {
        x: platformX,
        y: platformY,
        w: platformWidth,
        h: platformHeight,
        moving: isMoving,
        speed: 0,
        direction: 1,
        minX: 0,
        maxX: 0
      };
      
      if (isMoving) {
        platform.speed = 1 + Math.random() * 2;
        platform.direction = Math.random() < 0.5 ? 1 : -1;
        platform.minX = Math.max(0, platformX - 150);
        platform.maxX = Math.min(800 - platformWidth, platformX + 150);
      }
      
      // Verificar que no se superponga con otras
      let overlaps = false;
      for (let p of game.platforms) {
        if (Math.abs(p.y - platformY) < 40 && 
            Math.abs(p.x - platformX) < platformWidth + 50) {
          overlaps = true;
          break;
        }
      }
      
      if (!overlaps) {
        game.platforms.push(platform);
      }
    }
    
    // Asegurar que hay al menos una plataforma cerca del inicio
    game.platforms.push({
      x: 100, y: 480, w: 120, h: 20,
      moving: false, speed: 0, direction: 1, minX: 0, maxX: 0
    });

    // Generar regalos aleatorios en las plataformas
    game.gifts = [];
    const numGifts = 8 + Math.floor(Math.random() * 7);
    
    for (let i = 0; i < numGifts; i++) {
      const platform = game.platforms[Math.floor(Math.random() * game.platforms.length)];
      const giftX = platform.x + Math.random() * (platform.w - 20);
      const giftY = platform.y - 30;
      
      let tooClose = false;
      for (let gift of game.gifts) {
        const dist = Math.sqrt(Math.pow(gift.x - giftX, 2) + Math.pow(gift.y - giftY, 2));
        if (dist < 80) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) {
        game.gifts.push({ x: giftX, y: giftY, collected: false });
      }
    }

    game.obstacles = [];
    game.totalGifts = game.gifts.length;
    game.collected = 0;
    game.player.x = 50;
    game.player.y = 400;
    game.player.vx = 0;
    game.player.vy = 0;
    game.player.frame = 0;
    game.timeRemaining = 45;
    game.lastTime = Date.now();
    game.lastObstacleSpawn = Date.now();
    game.gameOverReason = '';
    
    setTotalGifts(game.totalGifts);
    setCollected(0);
    setPercentage(0);
    setTimeRemaining(45);
    setGameOverReason('');
  };

  const spawnObstacle = () => {
    const game = gameRef.current;
    const platforms = game.platforms;
    
    const validPlatforms = platforms.filter(p => p.y < 570 && p.y > 150);
    if (validPlatforms.length === 0) return;
    
    const platform = validPlatforms[Math.floor(Math.random() * validPlatforms.length)];
    
    const obstacleTypes = [
      { type: 'spike', w: 30, h: 30, color: '#ff0000' },
      { type: 'fire', w: 35, h: 35, color: '#ff6b00' },
      { type: 'ice', w: 30, h: 30, color: '#00bfff' }
    ];
    
    const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    
    const obstacle = {
      x: platform.x + Math.random() * (platform.w - obstacleType.w),
      y: platform.y - obstacleType.h,
      w: obstacleType.w,
      h: obstacleType.h,
      type: obstacleType.type,
      color: obstacleType.color,
      animation: 0,
      platformIndex: game.platforms.indexOf(platform)
    };
    
    let tooCloseToPlayer = false;
    const p = game.player;
    const dist = Math.sqrt(Math.pow(obstacle.x - p.x, 2) + Math.pow(obstacle.y - p.y, 2));
    if (dist < 200) {
      tooCloseToPlayer = true;
    }
    
    if (!tooCloseToPlayer && game.obstacles.length < 15) {
      game.obstacles.push(obstacle);
    }
  };

  const addNewGift = () => {
    const game = gameRef.current;
    const platforms = game.platforms;
    
    let attempts = 0;
    let newGift = null;
    
    while (attempts < 50) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const x = platform.x + Math.random() * (platform.w - 20);
      const y = platform.y - 30;
      
      let tooClose = false;
      for (let gift of game.gifts) {
        if (!gift.collected) {
          const dist = Math.sqrt(Math.pow(gift.x - x, 2) + Math.pow(gift.y - y, 2));
          if (dist < 100) {
            tooClose = true;
            break;
          }
        }
      }
      
      for (let obstacle of game.obstacles) {
        const dist = Math.sqrt(Math.pow(obstacle.x - x, 2) + Math.pow(obstacle.y - y, 2));
        if (dist < 80) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) {
        newGift = { x, y, collected: false };
        break;
      }
      attempts++;
    }
    
    if (newGift) {
      game.gifts.push(newGift);
      game.totalGifts++;
      setTotalGifts(game.totalGifts);
    }
  };

  // ========================================
  // 🎨 DIBUJO DEL JUGADOR - REEMPLAZA CON TU IMAGEN
  // ========================================
  const drawPlayer = (ctx) => {
    const p = gameRef.current.player;
    const images = imagesRef.current;
    
    // Si tienes imagen cargada, úsala
    if (images.loaded && images.player) {
      // ctx.drawImage(images.player, p.x, p.y, p.w, p.h);
      // Si tienes spritesheet con animación:
      // const frameWidth = 64; // ancho de cada frame
      // const frameHeight = 64; // alto de cada frame
      // ctx.drawImage(
      //   images.player,
      //   p.frame * frameWidth, 0, frameWidth, frameHeight,
      //   p.x, p.y, p.w, p.h
      // );
    } else {
      // Sprite temporal (boceto)
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      
      ctx.beginPath();
      ctx.arc(p.x - 8, p.y + 20, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#A0522D';
      ctx.fill();
      
      ctx.fillStyle = '#000';
      ctx.fillRect(p.x + 10, p.y + 12, 5, 5);
      ctx.fillRect(p.x + 25, p.y + 12, 5, 5);
      
      ctx.fillStyle = '#FFA500';
      ctx.beginPath();
      ctx.moveTo(p.x + 15, p.y + 25);
      ctx.lineTo(p.x + 20, p.y + 30);
      ctx.lineTo(p.x + 25, p.y + 25);
      ctx.fill();
    }
  };

  // ========================================
  // 🎁 DIBUJO DE REGALOS - REEMPLAZA CON TU IMAGEN
  // ========================================
  const drawGifts = (ctx) => {
    const images = imagesRef.current;
    
    gameRef.current.gifts.forEach(gift => {
      if (!gift.collected) {
        // Si tienes imagen cargada, úsala
        if (images.loaded && images.gift) {
          // ctx.drawImage(images.gift, gift.x, gift.y, 20, 20);
        } else {
          // Sprite temporal (boceto)
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(gift.x, gift.y, 20, 20);
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(gift.x + 8, gift.y, 4, 20);
          ctx.fillRect(gift.x, gift.y + 8, 20, 4);
          
          ctx.beginPath();
          ctx.arc(gift.x + 10, gift.y - 5, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffd700';
          ctx.fill();
        }
      }
    });
  };

  // ========================================
  // ⚠️ DIBUJO DE OBSTÁCULOS - REEMPLAZA CON TUS IMÁGENES
  // ========================================
  const drawObstacles = (ctx) => {
    const game = gameRef.current;
    const images = imagesRef.current;
    
    game.obstacles.forEach(obstacle => {
      obstacle.animation += 0.1;
      
      // Mover obstáculos con plataformas móviles
      if (obstacle.platformIndex !== undefined) {
        const platform = game.platforms[obstacle.platformIndex];
        if (platform && platform.moving) {
          obstacle.x += platform.speed * platform.direction;
        }
      }
      
      // Si tienes imágenes cargadas, úsalas
      if (images.loaded) {
        if (obstacle.type === 'spike' && images.spike) {
          // ctx.drawImage(images.spike, obstacle.x, obstacle.y, obstacle.w, obstacle.h);
        } else if (obstacle.type === 'fire' && images.fire) {
          // ctx.drawImage(images.fire, obstacle.x, obstacle.y, obstacle.w, obstacle.h);
        } else if (obstacle.type === 'ice' && images.ice) {
          // ctx.drawImage(images.ice, obstacle.x, obstacle.y, obstacle.w, obstacle.h);
        }
      } else {
        // Sprites temporales (bocetos)
        if (obstacle.type === 'spike') {
          ctx.fillStyle = obstacle.color;
          ctx.beginPath();
          ctx.moveTo(obstacle.x + obstacle.w / 2, obstacle.y);
          ctx.lineTo(obstacle.x + obstacle.w, obstacle.y + obstacle.h);
          ctx.lineTo(obstacle.x, obstacle.y + obstacle.h);
          ctx.closePath();
          ctx.fill();
          
          ctx.strokeStyle = '#800000';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (obstacle.type === 'fire') {
          const flameHeight = Math.sin(obstacle.animation) * 5;
          
          ctx.fillStyle = '#ff6b00';
          ctx.beginPath();
          ctx.ellipse(obstacle.x + obstacle.w / 2, obstacle.y + obstacle.h - 10, 
                     obstacle.w / 2, obstacle.h / 2 + flameHeight, 0, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.ellipse(obstacle.x + obstacle.w / 2, obstacle.y + obstacle.h - 15, 
                     obstacle.w / 3, obstacle.h / 3 + flameHeight, 0, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#ffff00';
          ctx.beginPath();
          ctx.ellipse(obstacle.x + obstacle.w / 2, obstacle.y + obstacle.h - 20, 
                     obstacle.w / 4, obstacle.h / 4 + flameHeight, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (obstacle.type === 'ice') {
          const pulse = Math.sin(obstacle.animation) * 3;
          
          ctx.fillStyle = obstacle.color;
          ctx.fillRect(obstacle.x - pulse / 2, obstacle.y - pulse / 2, 
                      obstacle.w + pulse, obstacle.h + pulse);
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(obstacle.x - pulse / 2, obstacle.y - pulse / 2, 
                        obstacle.w + pulse, obstacle.h + pulse);
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.w / 3, obstacle.h / 3);
        }
      }
    });
  };

  // ========================================
  // 🏗️ DIBUJO DE PLATAFORMAS - REEMPLAZA CON TU IMAGEN
  // ========================================
  const drawPlatforms = (ctx) => {
    const images = imagesRef.current;
    
    gameRef.current.platforms.forEach(plat => {
      // Si tienes imagen cargada, úsala
      if (images.loaded && images.platform) {
        // ctx.drawImage(images.platform, plat.x, plat.y, plat.w, plat.h);
      } else {
        // Sprite temporal (boceto)
        ctx.fillStyle = plat.moving ? '#8B4513' : '#654321';
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.strokeStyle = plat.moving ? '#FF6914' : '#8B6914';
        ctx.lineWidth = 2;
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
        
        // Indicador de plataforma móvil
        if (plat.moving) {
          ctx.fillStyle = '#FFA500';
          ctx.fillRect(plat.x + plat.w / 2 - 5, plat.y + 5, 10, 5);
        }
      }
    });
  };

  const updatePlatforms = () => {
    const game = gameRef.current;
    
    game.platforms.forEach(platform => {
      if (platform.moving) {
        platform.x += platform.speed * platform.direction;
        
        if (platform.x <= platform.minX || platform.x >= platform.maxX) {
          platform.direction *= -1;
        }
      }
    });
  };

  const update = () => {
    const game = gameRef.current;
    if (!game.gameStarted || game.gameEnded) return;

    const now = Date.now();
    const deltaTime = (now - game.lastTime) / 1000;
    game.lastTime = now;

    game.timeRemaining -= deltaTime;
    setTimeRemaining(Math.max(0, game.timeRemaining));

    if (game.timeRemaining <= 0) {
      game.gameOverReason = '¡Se acabó el tiempo!';
      setGameOverReason('¡Se acabó el tiempo!');
      endGame();
      return;
    }

    if (now - game.lastObstacleSpawn > game.obstacleSpawnInterval) {
      spawnObstacle();
      game.lastObstacleSpawn = now;
      
      if (game.obstacleSpawnInterval > 1200) {
        game.obstacleSpawnInterval -= 80;
      }
    }

    updatePlatforms();

    const p = game.player;
    
    if (game.keys['ArrowLeft']) {
      p.vx = -p.speed;
      p.frame = 1;
    } else if (game.keys['ArrowRight']) {
      p.vx = p.speed;
      p.frame = 2;
    } else {
      p.vx = 0;
      p.frame = 0;
    }

    if (game.keys[' '] && p.grounded) {
      p.vy = -p.jumpPower;
      p.grounded = false;
    }

    p.vy += game.gravity;
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0) p.x = 0;
    if (p.x + p.w > 800) p.x = 800 - p.w;

    p.grounded = false;
    let onMovingPlatform = null;
    
    game.platforms.forEach(plat => {
      if (p.x + p.w > plat.x && p.x < plat.x + plat.w &&
          p.y + p.h > plat.y && p.y + p.h < plat.y + plat.h + 10 && p.vy > 0) {
        p.y = plat.y - p.h;
        p.vy = 0;
        p.grounded = true;
        
        if (plat.moving) {
          onMovingPlatform = plat;
        }
      }
    });

    if (onMovingPlatform) {
      p.x += onMovingPlatform.speed * onMovingPlatform.direction;
    }

    game.obstacles.forEach(obstacle => {
      if (p.x < obstacle.x + obstacle.w && p.x + p.w > obstacle.x &&
          p.y < obstacle.y + obstacle.h && p.y + p.h > obstacle.y) {
        
        let deathMessage = '¡Moriste!';
        if (obstacle.type === 'spike') deathMessage = '¡Te pinchaste con las púas! 🔺';
        else if (obstacle.type === 'fire') deathMessage = '¡Te quemaste con el fuego! 🔥';
        else if (obstacle.type === 'ice') deathMessage = '¡Te congelaste con el hielo! ❄️';
        
        game.gameOverReason = deathMessage;
        setGameOverReason(deathMessage);
        endGame();
      }
    });

    game.gifts.forEach(gift => {
      if (!gift.collected && 
          p.x < gift.x + 20 && p.x + p.w > gift.x &&
          p.y < gift.y + 20 && p.y + p.h > gift.y) {
        gift.collected = true;
        game.collected++;
        
        game.timeRemaining += game.timeBonus;
        setTimeRemaining(game.timeRemaining);
        
        addNewGift();
        
        const newCollected = game.collected;
        const newPercentage = Math.round((newCollected / game.totalGifts) * 100);
        
        setCollected(newCollected);
        setPercentage(newPercentage);
      }
    });

    if (p.y > 650) {
      game.gameOverReason = '¡Caíste al vacío! ⬇️';
      setGameOverReason('¡Caíste al vacío! ⬇️');
      endGame();
    }
  };

  // ========================================
  // 🖼️ DIBUJO DEL FONDO - REEMPLAZA CON TU IMAGEN
  // ========================================
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const images = imagesRef.current;
    
    ctx.clearRect(0, 0, 800, 600);
    
    // Si tienes imagen de fondo, úsala
    if (images.loaded && images.background) {
      // ctx.drawImage(images.background, 0, 0, 800, 600);
    } else {
      // Fondo temporal (boceto)
      const gradient = ctx.createLinearGradient(0, 0, 0, 600);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#E0F6FF');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 600);
    }
    
    drawPlatforms(ctx);
    drawObstacles(ctx);
    drawGifts(ctx);
    drawPlayer(ctx);
  };

  const gameLoop = () => {
    update();
    draw();
    gameRef.current.animationId = requestAnimationFrame(gameLoop);
  };

  const endGame = () => {
    const game = gameRef.current;
    game.gameEnded = true;
    setCanSubmit(true);
    setShowModal(true);
    if (game.animationId) {
      cancelAnimationFrame(game.animationId);
    }
  };

  const startGame = () => {
    const game = gameRef.current;
    createLevel();
    game.gameStarted = true;
    game.gameEnded = false;
    game.lastTime = Date.now();
    game.obstacleSpawnInterval = 3000;
    setGameStarted(true);
    setCanSubmit(false);
    setShowModal(false);
    if (game.animationId) {
      cancelAnimationFrame(game.animationId);
    }
    gameLoop();
  };

  const submitScore = async () => {
    if (!playerName.trim()) {
      
      return;
    }

    const scoreData = {
      name: playerName.trim(),
      percentage: percentage,
      gifts: collected,
      total: totalGifts,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData)
      });
      
    
      setShowModal(false);
      loadLeaderboard();
    } catch (error) {
      console.error('Error al guardar puntuación:', error);
      
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await fetch(SHEET_URL);
      const data = await response.json();
      setLeaderboard(data.scores || []);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar clasificación:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
    loadLeaderboard();
    createLevel();
    draw();

    const handleKeyDown = (e) => {
      if (e.key === ' ') e.preventDefault();
      gameRef.current.keys[e.key] = true;
    };

    const handleKeyUp = (e) => {
      gameRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameRef.current.animationId) {
        cancelAnimationFrame(gameRef.current.animationId);
      }
    };
  }, []);

  const handleTouchStart = (direction) => {
    gameRef.current.keys[direction] = true;
  };

  const handleTouchEnd = (direction) => {
    gameRef.current.keys[direction] = false;
  };

  const getTimeColor = () => {
    if (timeRemaining > 20) return '#4CAF50';
    if (timeRemaining > 8) return '#FFA500';
    return '#ff4757';
  };

  return (
    <div className="app-container">
      <style>{`@import url('./App.css');`}</style>
      
      <h1 className="title">🎄 Ardilla Navideña 🎁</h1>
      
      <div className="instructions">
        <strong>Controles PC:</strong> ← → Mover | Espacio Saltar<br/>
        <strong>Móvil:</strong> Usa los botones en pantalla<br/>
        <strong>Objetivo:</strong> Recoge regalos y evita obstáculos. ¡Cada regalo suma +5 segundos!<br/>
        <strong>¡Buena suerte!</strong>
      </div>

      <div className="game-container">
        <canvas 
          ref={canvasRef} 
          className="game-canvas" 
          width="800" 
          height="600"
        />
        <div className="game-ui">
          <div>Regalos: {collected} / {totalGifts}</div>
          <div>Porcentaje: {percentage}%</div>
          <div style={{ color: getTimeColor(), fontSize: '20px', fontWeight: 'bold' }}>
            ⏱️ Tiempo: {timeRemaining.toFixed(1)}s
          </div>
        </div>
      </div>

      <div className="controls">
        <button className="btn" onClick={startGame}>
          {gameStarted} Iniciar 
        </button>
      </div>

      <div className="mobile-controls">
        <button 
          className="control-btn left"
          onTouchStart={() => handleTouchStart('ArrowLeft')}
          onTouchEnd={() => handleTouchEnd('ArrowLeft')}
          onMouseDown={() => handleTouchStart('ArrowLeft')}
          onMouseUp={() => handleTouchEnd('ArrowLeft')}
        >
          ←
        </button>
        <button 
          className="control-btn jump"
          onTouchStart={() => handleTouchStart(' ')}
          onTouchEnd={() => handleTouchEnd(' ')}
          onMouseDown={() => handleTouchStart(' ')}
          onMouseUp={() => handleTouchEnd(' ')}
        >
          SALTAR
        </button>
        <button 
          className="control-btn right"
          onTouchStart={() => handleTouchStart('ArrowRight')}
          onTouchEnd={() => handleTouchEnd('ArrowRight')}
          onMouseDown={() => handleTouchStart('ArrowRight')}
          onMouseUp={() => handleTouchEnd('ArrowRight')}
        >
          →
        </button>
      </div>

      <div className="leaderboard">
        <h2>🏆 Tabla de Clasificación</h2>
        {loading ? (
          <div className="loading-msg">Cargando clasificación...</div>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Jugador</th>
                <th>Porcentaje</th>
                <th>Regalos</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((score, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{score.name}</td>
                  <td>{score.percentage}%</td>
                  <td>{score.gifts}/{score.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{gameOverReason || '¡Juego Terminado!'}</h2>
            <p>Puntuación: <strong>{percentage}%</strong></p>
            <p>Regalos recogidos: {collected}/{totalGifts}</p>
            <input 
              type="text" 
              className="input"
              placeholder="Tu nombre" 
              maxLength="20"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <br/><br/>
            <button className="btn" onClick={submitScore}>Guardar Puntuación</button>
            <button className='btn' onClick={startGame}>Reiniciar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;