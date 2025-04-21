'use strict';

const path = require('path');
const fs = require('fs').promises;

const COLORS = ['green', 'blue', 'darkgreen'];
const SPEED = 0.2;
const MAX_PLAYERS = 3;

const TILE_SIZE = 16; // Tamaño de cada tile en píxeles
const WIDTH_IN_TILES = 48; // Ancho del mapa en tiles
const HEIGHT_IN_TILES = 32; // Alto del mapa en tiles

const DIRECTIONS = {
    "up": { dx: 0, dy: -1 },
    "upLeft": { dx: -1, dy: -1 },
    "left": { dx: -1, dy: 0 },
    "downLeft": { dx: -1, dy: 1 },
    "down": { dx: 0, dy: 1 },
    "downRight": { dx: 1, dy: 1 },
    "right": { dx: 1, dy: 0 },
    "upRight": { dx: 1, dy: -1 },
    "none": { dx: 0, dy: 0 }
};

class GameLogic {

    constructor() {
        this.gameStarted = false;
        this.waitingToStart = false;
        this.players = new Map();
        // this.loadGameData();
        this.elapsedTime = 0;
        this.map = "Deepwater Ruins";
        this.usedColors = new Set();
    }

    async loadGameData() {
        this.gameData = await this.fetchGameData();
        for(let level of this.gameData.levels){
            // Tamaño de la pantalla
            for(let layer of level.layers) {
                this.width = layer.tileMap[0].length * layer.tilesWidth;
                this.height = layer.tileMap.length * layer.tilesHeight;
            }
        }
        if (!this.gameData) {
            console.error("Error: game_data.json no se pudo cargar.");
        }
        this.flagPos = {
            dx: Math.random(),
            dy: Math.random()
        }
    }


    async fetchGameData() {
        const filePath = path.join(__dirname, '../public', 'game_data.json'); 
        return fs.readFile(filePath, 'utf-8')
            .then(data => {
                console.log(data);
                return JSON.parse(data);
            })
            .catch(error => {
                console.error("Error cargando game_data.json:", error);
                return null;
            });
    }

    // Es connecta un client/jugador
    addClient(id) {
        if (!this.gameData || !this.gameData.levels?.[0]?.layers?.[0]) {
            console.warn(`No hay datos disponibles para el player ${id}, se ha cancelado la conexión.`);
            return null;
        }
        let level = this.gameData["levels"][0];
        let layer = level["layers"][0];
        let pos = {
            x: 88 / (layer.tilesWidth * layer["tileMap"][0].length),
            y: 160 / (layer.tilesHeight * layer["tileMap"].length)
        }
        console.log(pos);
        let color = COLORS[Math.floor(Math.random() * COLORS.length)];
         while (this.usedColors.has(color)) {
             color = COLORS[Math.floor(Math.random() * COLORS.length)];
         }
         this.usedColors.add(color);
 
         this.waitingPlayers.set(id, {
            id,
            ready: false,
            x: pos.x,
            y: pos.y,
            speed: SPEED,
            direction: "down",
            moving: false,
            map: "Main",
            zone: "", // Col·lisió amb objectes o zones
            hasFlag: false,
            color: color,
        });

        return this.waitingPlayers.get(id);
    }

    // Es desconnecta un client/jugador
    removeClient(id) {
        if (this.players.has(id)) {
            this.usedColors.delete(this.players.get(id).color);
            this.players.delete(id);
            
        }
        if (this.waitingPlayers.has(id)) {
            this.usedColors.delete(this.waitingPlayers.get(id).color);
            this.waitingPlayers.delete(id);
            
        }
    }

    // Tractar un missatge d'un client/jugador
    handleMessage(id, msg) {
        try {
            let obj = JSON.parse(msg);
            if (!obj.type) return;
            switch (obj.type) {
                case "direction":
                    if (this.players.has(id)) {
                       
                        if(obj.value != "none") {
                            this.players.get(id).direction = obj.value;
                            this.players.get(id).moving = true;
                        } else {
                            this.players.get(id).moving = false;
                        }
                    }
                    break;
                case "ready":
                     this.players.set(id, this.waitingPlayers.get(id));
                     this.waitingPlayers.delete(id);
                    break;
                default:
                    break;
            }
        } catch (error) { }
    }

    // Carregar dades estàtiques del joc
    fetchGameData() {
        const filePath = path.join(__dirname, '../public', 'game_data.json');
      
        return fs.readFile(filePath, 'utf-8')
          .then(data => JSON.parse(data))
          .catch(error => {
            console.error("Error cargando game_data.json:", error);
            return null;
          });
      }

      updateGame(fps) {
        if (!this.gameStarted) {
          if (this.players.size >= 4) {
            setTimeout(() => this.gameStarted = true, 5000);
          }
          return;
        }
        
        // radio del sprite expresado en porcentaje (una sola vez mejor en constructor)
        const RADIUS_X = 250 / 2 / 4000; // 0.03125
        const RADIUS_Y = 250 / 2 / 3000; // ~0.04167
        const deltaTime = 1 / fps;
      
        this.players.forEach(client => {
          if (!client.moving) return;
      
          // 1) Calcula desplazamiento sin redondear
          const dir = DIRECTIONS[client.direction];
          let newX = client.x + dir.dx * client.speed * deltaTime;
            let newY = client.y + dir.dy * client.speed * deltaTime;

          
          // 2) Clampea al rango [0,1] (sin redondear aún)
          newX = Math.min(Math.max(newX, RADIUS_X), 1 - RADIUS_X);
          newY = Math.min(Math.max(newY, RADIUS_Y), 1 - RADIUS_Y);
          
          console.log(`Client ${client.id} - X: ${newX}, Y: ${newY}`);

          // 3) Asigna la posición con toda la precisión
          client.x = newX;
          client.y = newY;
      
        //   // 4) Envía la posición **redondeada** sólo para el servidor o la UI
        //   const sendX = Math.round(newX * 10) / 10;
        //   const sendY = Math.round(newY * 10) / 10;
        //   if (sendX !== this.lastSentX || sendY !== this.lastSentY) {
        //     this.conn.sendData(
        //       JSON.stringify({ type: "position", x: sendX, y: sendY })
        //     );
        //     this.lastSentX = sendX;
        //     this.lastSentY = sendY;
        //   }
        });
      }
      
      
                           
  

    // checkValidPosition(x, y, client) {
    //     x =  Number(x.toFixed(1)); 
    //     y =  Number(y.toFixed(1)); 
    //     if(x>1 || y>1){
    //         console.log("Client fuera de límites - X: " + x + ", Y: " + y);
    //         return false;
    //     }
    //     return true;
    // }

    // Detectar si dos rectangles es sobreposen
    areRectColliding(x1, y1, w1, h1, x2, y2, w2, h2) {
        return !(x1 + w1 <= x2 ||  
            x2 + w2 <= x1 || 
            y1 + h1 <= y2 ||
            y2 + h2 <= y1);
    }

    // Retorna l'estat del joc (per enviar-lo als clients/jugadors)
    getGameState() {
        const gameState = {
            started: this.gameStarted,
            time: Math.trunc(this.elapsedTime),
            players: Array.from(this.players.values()),
            flagPos: this.flagPos,
        }
       // console.log(`GameState: ${JSON.stringify(gameState)}`);
        return gameState;
    }
}

module.exports = GameLogic;