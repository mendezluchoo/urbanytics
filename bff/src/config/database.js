/**
 * Configuración de base de datos para el BFF
 * Maneja conexiones con PostgreSQL y Redis
 */

const { Pool } = require('pg');
// const Redis = require('ioredis');

// Configuración de PostgreSQL
const postgresConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'db_urbanytics',
  user: process.env.POSTGRES_USER || 'user_urbanytics',
  password: process.env.POSTGRES_PASSWORD || 'password_urbanytics',
  max: 20, // Máximo número de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Configuración de Redis (temporalmente deshabilitado)
const redisConfig = {};

// Crear pool de conexiones PostgreSQL
const postgresPool = new Pool(postgresConfig);

// Cliente Redis (temporalmente deshabilitado)
const redisClient = null;

// Función para crear cliente Redis
const createRedisClient = () => {
  // Temporalmente deshabilitado
  return null;
};

// Función para conectar a Redis
const connectRedis = async () => {
  console.log('⚠️ Redis deshabilitado temporalmente');
  return null;
};

// Función para verificar la conexión a PostgreSQL
const testPostgresConnection = async () => {
  try {
    const client = await postgresPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ PostgreSQL conectado exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    return false;
  }
};

// Función para cerrar conexiones
const closeConnections = async () => {
  try {
    await postgresPool.end();
    if (redisClient) {
      await redisClient.quit();
    }
    console.log('✅ Conexiones cerradas exitosamente');
  } catch (error) {
    console.error('❌ Error cerrando conexiones:', error.message);
  }
};

module.exports = {
  postgresPool,
  redisClient: () => redisClient,
  createRedisClient,
  connectRedis,
  testPostgresConnection,
  closeConnections
}; 