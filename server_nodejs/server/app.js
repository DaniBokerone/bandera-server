// app.js
'use strict';

const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const GameLogic = require('./gameLogic.js');
const GameLoop = require('./utilsGameLoop.js');

const debug = true;
const port = process.env.PORT || 3000;


const game = new GameLogic();
const gameLoop = new GameLoop();


const app = express();
app.use(express.static('public'));
app.use(express.json());

app.get('/test', (_req, res) => {
  res.send('Servidor funcionando correctamente!');
});

const httpServer = http.createServer(app).listen(port, '0.0.0.0', () => {
  console.log(`HTTP escuchando en http://localhost:${port}`);
});


const wss = new WebSocket.Server({ server: httpServer });

wss.broadcast = function broadcast(data) {
  const msg = typeof data === 'string' ? data : JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
};


game.conn = wss;               

(async () => {
  await game.loadGameData();
  gameLoop.start();
})();


function safeJsonParse(str) {
  try {
    const obj = JSON.parse(str);
    return obj && typeof obj === 'object' ? obj : null;
  } catch (_) {
    return null;
  }
}

function broadcastPlayerCount() {
  wss.broadcast({
    type:  'playerCount',
    count: game.players.size
  });
}

wss.on('connection', (socket, req) => {
  const id = `${req.socket.remoteAddress}:${Date.now()}`;

  if (debug) console.log('WS conectado:', id);
  game.addClient(id);

  socket.send(JSON.stringify({ type: 'playerCount', count: game.players.size }));
  broadcastPlayerCount();

  socket.on('message', (raw) => {
    const str = raw.toString();
    if (debug) console.log(`← [${id}] ${str.substr(0, 40)}...`);
    game.handleMessage(id, str);
  });

  socket.on('close', () => {
    if (debug) console.log('WS desconectado:', id);
    game.removeClient(id);
    broadcastPlayerCount();
  });
});


gameLoop.run = (fps) => {
  game.updateGame(fps);
  wss.broadcast(JSON.stringify({ type: "update", gameState: game.getGameState() }));
};
gameLoop.start();


process.on('SIGTERM', shutDown);
process.on('SIGINT',  shutDown);

function shutDown() {
  console.log('Señal de apagado recibida, cerrando servidor...');
  httpServer.close();
  wss.close();
  gameLoop.stop();
  process.exit(0);
}
