/**
 * Configuración de base de datos para el BFF
 * Maneja la conexión con PostgreSQL y Redis para caché
 */

const { Pool } = require('pg');
const Redis = require('redis');

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

// Configuración de Redis para caché
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      // End server sent fail after 5 retries
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      // End retry after a specific timeout
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      // End reconnecting with built in error
      return undefined;
    }
    // Reconnect after
    return Math.min(options.attempt * 100, 3000);
  }
};

// Crear pool de conexiones PostgreSQL
const postgresPool = new Pool(postgresConfig);

// Crear cliente Redis
const redisClient = Redis.createClient(redisConfig);

// Manejar eventos de Redis
redisClient.on('error', (err) => {
  console.warn('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis conectado exitosamente');
});

redisClient.on('ready', () => {
  console.log('✅ Redis listo para recibir comandos');
});

// Función para conectar Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.warn('⚠️ No se pudo conectar a Redis, continuando sin caché:', error.message);
  }
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
    await redisClient.quit();
    console.log('✅ Conexiones cerradas exitosamente');
  } catch (error) {
    console.error('❌ Error cerrando conexiones:', error.message);
  }
};

module.exports = {
  postgresPool,
  redisClient,
  connectRedis,
  testPostgresConnection,
  closeConnections
}; 