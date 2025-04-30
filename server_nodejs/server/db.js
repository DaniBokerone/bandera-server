const { MongoClient } = require('mongodb');

// URI de conexión a MongoDB
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function connectDB() {
    try {
        await client.connect();
        const db = client.db('bandera');
        const gamesCollection = db.collection('games');
        const playersCollection = db.collection('players');

        return { gamesCollection, playersCollection };
    } catch (err) {
        console.error("Error de conexión a MongoDB:", err);
        throw err;
    }
}

module.exports = connectDB;