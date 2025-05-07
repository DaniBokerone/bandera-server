// sqlConnect.js
const sql = require('mssql');
const connectDB = require('./db');
require('dotenv').config();

const sqlConfig = {
    server: 'DESKTOP-JPOIO3P',
    database: 'Demo Database NAV 2016 (AMS2-24)',
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
    authentication: {
        type: 'default',
        options: {
            userName: process.env.SQL_USER,
            password: process.env.SQL_PASSWORD
        }
    }
};

async function connectSQL() {
    try {
        const pool = await sql.connect(sqlConfig);
        console.log("Conectado a SQL Server");
        return pool;
    } catch (err) {
        console.error("Error conectando a SQL Server:", err);
        throw err;
    }
}

async function syncWithMongoAndSQL() {
    try {
        const { gamesCollection,playersCollection } = await connectDB();
        const games = await gamesCollection.find().toArray();
        const players = await playersCollection.find().toArray();

        const pool = await connectSQL();

        let insertados = 0;

        for (const player of players) {
            const id = player.id?.toString();
            if (!id) continue;

            const existe = await pool.request()
                .input('id', sql.NVarChar, id)
                .query(`SELECT 1 FROM [dbo].[CRONUS España S_A_$bandera_players] WHERE [id] = @id`);

            if (existe.recordset.length === 0) {
                await pool.request()
                    .input('id', sql.NVarChar, id)
                    .input('nickname', sql.NVarChar, player.nickname || '')
                    .input('name', sql.NVarChar, player.name || '')
                    .input('email', sql.NVarChar, player.email || '')
                    .input('phone', sql.NVarChar, player.phone || '')
                    .input('city', sql.NVarChar, player.ubication.city || '')
                    .input('country', sql.NVarChar, player.ubication.country || '')
                    .input('continent', sql.NVarChar, player.ubication.continent || '')
                    .input('account_status', sql.NVarChar, player.account_status || 'activo')
                    .input('last_login', sql.DateTime, player.last_login ? new Date(player.last_login) : null)
                    .input('registred_at', sql.DateTime, player.registred_at ? new Date(player.registred_at) : new Date())
                    .input('player_rank', sql.NVarChar, player.player_rank || 'Iron')
                    .input('highest_score', sql.Int, player.highest_score || 0)
                    .query(`
                        INSERT INTO [dbo].[CRONUS España S_A_$bandera_players]
                        (id, nickname, name, email, phone, city, country, continent, account_status, last_login, registred_at, player_rank, highest_score)
                        VALUES (@id, @nickname, @name, @email, @phone, @city, @country, @continent, @account_status, @last_login, @registred_at, @player_rank, @highest_score)
                    `);

                insertados++;
            }

            for (const game of games) {
                const gameId = game.id?.toString();
                if (!gameId) continue;
            
                const existeGame = await pool.request()
                    .input('id', sql.NVarChar, gameId)
                    .query(`SELECT 1 FROM [dbo].[CRONUS España S_A_$bandera_game] WHERE [id] = @id`);
            
                if (existeGame.recordset.length === 0) {
                    await pool.request()
                        .input('id', sql.NVarChar, gameId)
                        .input('game_date', sql.DateTime, game.game_date ? new Date(game.game_date) : null)
                        .input('player_size', sql.Int, game.player_size || 0)
                        .input('game_views', sql.Int, game.game_views || 0)
                        .input('match_type', sql.NVarChar, game.match_type || '')
                        .input('player_winner_id', sql.Int, parseInt(game.player_winner_id) || 1)
                        .input('duration_minutes', sql.Int, game.duration_minutes || 0)
                        .input('region', sql.NVarChar, game.region || '')
                        .query(`
                            INSERT INTO [dbo].[CRONUS España S_A_$bandera_game]
                            (id, game_date, player_size, game_views, match_type, player_winner_id, duration_minutes, region)
                            VALUES (@id, @game_date, @player_size, @game_views, @match_type, @player_winner_id, @duration_minutes, @region)
                        `);
            
                    insertados++;
                }
            
                const existePlayerStats = await pool.request()
                    .input('game_id', sql.NVarChar, gameId)
                    .query(`SELECT 1 FROM [dbo].[CRONUS España S_A_$bandera_game_playerStats] WHERE [game_id] = @game_id`);

                const nuevoId = await generarNuevoId(pool, 'CRONUS España S_A_$bandera_game_playerStats');
            
                if (existePlayerStats.recordset.length === 0) {
                    await pool.request()
                        .input('id', sql.Int, nuevoId)
                        .input('game_id', sql.NVarChar, gameId)
                        .input('player_id', sql.NVarChar, game.player_id || '')
                        .input('attacks_made', sql.Int, game.attacks_made || 0)
                        .input('attacks_received', sql.Int, game.attacks_received || 0)
                        .input('score', sql.Int, game.score || 0)
                        .input('is_new_high_score', sql.Bit, game.is_new_high_score ? 1 : 0)
                        .input('player_rank', sql.NVarChar, game.player_rank || '')
                        .query(`
                            INSERT INTO [dbo].[CRONUS España S_A_$bandera_game_playerStats]
                            (id, game_id, player_id, attacks_made, attacks_received, score, is_new_high_score, player_rank)
                            VALUES (@id, @game_id, @player_id, @attacks_made, @attacks_received, @score, @is_new_high_score, @player_rank)
                        `);
            
                    insertados++;
                }
            }            
        }

        console.log(`Sincronización completada. Jugadores/Partidas insertadas insertados: ${insertados}`);
        return insertados;
    } catch (error) {
        console.error("Error en sincronización Mongo -> SQL:", error.message);
        throw error;
    }
}

async function generarNuevoId(pool, tableName) {
    const result = await pool.request()
        .query(`SELECT ISNULL(MAX(id), 0) + 1 AS nextId FROM [dbo].[${tableName}]`);

    return result.recordset[0].nextId;
}



module.exports = connectSQL;
module.exports.syncWithMongoAndSQL = syncWithMongoAndSQL;
