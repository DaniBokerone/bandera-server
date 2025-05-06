// app.js
'use strict';

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');                 

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
  console.log(`HTTP en http://localhost:${port}`);
});


const wss = new WebSocket.Server({ server: httpServer });

const socketsClients = new Map();   

wss.broadcast = function broadcast(data) {
  const msg = typeof data === 'string' ? data : JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
};

game.conn = wss;

wss.on('connection', (socket, req) => {
  const params = new URL(req.url, `http://${req.headers.host}`).searchParams;
  const role   = params.get('role') || 'spectator';
  const id     = 'C' + uuidv4().substring(0, 5).toUpperCase();

  socketsClients.set(socket, { id, role });
  if (debug) console.log('➕ Conectado', id, '| role:', role);

  socket.send(JSON.stringify({
    type:    'welcome',
    id:      id,
    message: 'Welcome to the server'
  }));

  wss.broadcast({ type: 'newClient', id });

  if (role === 'player') {
    game.addClient(id);
    broadcastPlayerCount();
  }

  socket.on('message', (raw) => {
    const str = raw.toString();
    if (debug) console.log(`← [${id}] ${str.slice(0, 40)}...`);
    game.handleMessage(id, str);
  });

  socket.on('close', () => {
    if (debug) console.log('➖ Desconectado', id);
    socketsClients.delete(socket);

    if (role === 'player') {
      game.removeClient(id);
      broadcastPlayerCount();
    }

    wss.broadcast({ type: 'disconnected', id });
  });
});

function broadcastPlayerCount() {
  wss.broadcast({
    type:  'playerCount',
    count: game.players.size
  });
}


gameLoop.run = (fps) => {
  game.updateGame(fps);
  wss.broadcast({ type: 'update', gameState: game.getGameState() });
};
(async () => {
  await game.loadGameData();
  gameLoop.start();                     
})();

process.on('SIGTERM', shutDown);
process.on('SIGINT',  shutDown);

function shutDown() {
  console.log('⏹️  Cerrando servidor…');
  gameLoop.stop();
  wss.close();
  httpServer.close(() => process.exit(0));
}
