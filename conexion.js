const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017";

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });

    console.log("MongoDB local conectado correctamente");

  } finally {
    await client.close();
  }
}

run().catch(console.error);

module.exports = conectarDB;