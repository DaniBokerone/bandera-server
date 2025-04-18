
const express = require('express');
const GameLogic = require('./gameLogic.js');
const webSockets = require('./utilsWebSockets.js');
const GameLoop = require('./utilsGameLoop.js');

const debug = true;
const port = process.env.PORT || 3000;

// Inicialitzar WebSockets i la lògica del joc
const ws = new webSockets();
const game = new GameLogic();
let gameLoop = new GameLoop();

// //GESTION LLAVE 
// let itemPosition = null;

// function generateRandomItemPosition() {
//   const x = Math.floor(Math.random() * 800);
//   const y = Math.floor(Math.random() * 600);
//   return { x, y };
// }

// Inicialitzar servidor Express
const app = express();
app.use(express.static('public'));
app.use(express.json());

(async () => {
    await game.loadGameData(); 
    gameLoop.start();
})();

// Ruta GET para testear la conexión desde un dispositivo externo
app.get('/test', (req, res) => {
  res.send('Servidor funcionando correctamente!');
});

// app.get('/item-position', (req, res) => {
//   if (itemPosition) {
//     res.json({ x: itemPosition.x, y: itemPosition.y });
//   } else {
//     res.status(404).json({ error: "La llave no está disponible." });
//   }
// });

// Inicialitzar servidor HTTP
const httpServer = app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor HTTP escoltant a: http://localhost:${port}`);
});

// Gestionar WebSockets
ws.init(httpServer, port);

// Què fa el servidor quan un client es connecta
ws.onConnection = (socket, id) => {
  if (debug) console.log("WebSocket client connected: " + id);
  game.addClient(id);

  // if (game.players.size === 1 && itemPosition === null) {
  //   itemPosition = generateRandomItemPosition();
  //   console.log("Llave generada en:", itemPosition);
  // }

  // // Cuando entra jugador - Enviar posicion llave 
  // if (itemPosition) {
  //     socket.send(JSON.stringify({
  //         type: "item",
  //         x: itemPosition.x,
  //         y: itemPosition.y
  //     }));
  // }
  
    //Cuando entra jugador - Numero de players conectados
    socket.send(JSON.stringify({ type: "playerCount", count: game.players.size }));

    //Cuando entra jugador - Actualiza total de players conectados
    ws.broadcast(JSON.stringify({ type: "playerCount", count: game.players.size }));
};

// Gestionar missatges rebuts dels clients
ws.onMessage = (socket, id, msg) => {
    // if (debug) console.log(`New message from ${id}: ${msg.substring(0, 32)}...`);
    game.handleMessage(id, msg);
};

// Què fa el servidor quan un client es desconnecta
ws.onClose = (socket, id) => {
    if (debug) console.log("WebSocket client disconnected: " + id);
    game.removeClient(id);
    ws.broadcast(JSON.stringify({ type: "disconnected", from: "server" }));
};

// **Game Loop**
gameLoop.run = (fps) => {
    game.updateGame(fps);
    ws.broadcast(JSON.stringify({ type: "update", gameState: game.getGameState() }));
};


// Gestionar el tancament del servidor
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

function shutDown() {
    console.log('Rebuda senyal de tancament, aturant el servidor...');
    httpServer.close();
    ws.end();
    gameLoop.stop();
    process.exit(0);
}