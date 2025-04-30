// sqlConnect.js
const sql = require('mssql');
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
        console.log("Configuración de conexión:", process.env.SQL_USER);
        return pool;
    } catch (err) {
        console.error("Error conectando a SQL Server:", err);
        throw err;
    }
}

module.exports = connectSQL;
