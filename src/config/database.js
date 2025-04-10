const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

class DatabaseConnection {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      if (!uri) {
        throw new Error("MONGODB_URI no está definido en el archivo .env");
      }

      // Crear nuevo cliente de MongoDB
      this.client = new MongoClient(uri);

      // Conectar al servidor
      await this.client.connect();

      // Seleccionar la base de datos
      this.db = this.client.db(dbName);

      console.log(`Conectado a MongoDB: ${dbName}`);

      return this.db;
    } catch (error) {
      console.error("Error al conectar a la base de datos:", error);
      process.exit(1);
    }
  }

  getCollection(collectionName) {
    if (!this.db) {
      throw new Error(
        "Primero debes conectarte a la base de datos usando connect()"
      );
    }
    return this.db.collection(collectionName);
  }

  async close() {
    if (this.client) {
      await this.client.close();
      console.log("Conexión a MongoDB cerrada");
    }
  }
}

module.exports = new DatabaseConnection();
