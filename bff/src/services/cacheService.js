/**
 * Servicio de caché para optimizar el rendimiento del BFF
 * Utiliza Redis para almacenar resultados de consultas frecuentes
 */

// const { redisClient: getRedisClient } = require('../config/database');
const NodeCache = require('node-cache');

// Caché en memoria como fallback si Redis no está disponible
const memoryCache = new NodeCache({ 
  stdTTL: 300, // 5 minutos por defecto
  checkperiod: 60 // Revisar cada minuto
});

/**
 * Obtiene un valor del caché (Redis o memoria)
 * @param {string} key - Clave del caché
 * @returns {Promise<any>} - Valor almacenado o null si no existe
 */
const getFromCache = async (key) => {
  // Usar solo caché en memoria
  return memoryCache.get(key);
};

/**
 * Almacena un valor en el caché (Redis y memoria)
 * @param {string} key - Clave del caché
 * @param {any} value - Valor a almacenar
 * @param {number} ttl - Tiempo de vida en segundos (opcional)
 */
const setCache = async (key, value, ttl = 300) => {
  // Usar solo caché en memoria
  memoryCache.set(key, value, ttl);
};

/**
 * Elimina un valor del caché
 * @param {string} key - Clave del caché
 */
const deleteFromCache = async (key) => {
  memoryCache.del(key);
};

/**
 * Elimina múltiples claves del caché basado en un patrón
 * @param {string} pattern - Patrón para buscar claves (ej: "properties:*")
 */
const deletePattern = async (pattern) => {
  // Para caché en memoria, eliminamos todas las claves que coincidan
  const keys = memoryCache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern.replace('*', '')));
  matchingKeys.forEach(key => memoryCache.del(key));
};

/**
 * Limpia todo el caché
 */
const clearAllCache = async () => {
  memoryCache.flushAll();
};

/**
 * Genera una clave de caché basada en parámetros
 * @param {string} prefix - Prefijo de la clave
 * @param {object} params - Parámetros para generar la clave
 * @returns {string} - Clave generada
 */
const generateCacheKey = (prefix, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return sortedParams ? `${prefix}:${sortedParams}` : prefix;
};

/**
 * Middleware para caché automático de respuestas
 * @param {string} prefix - Prefijo para las claves de caché
 * @param {number} ttl - Tiempo de vida en segundos
 * @returns {Function} - Middleware de Express
 */
const cacheMiddleware = (prefix, ttl = 300) => {
  return async (req, res, next) => {
    // Solo cachear peticiones GET
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = generateCacheKey(prefix, {
      ...req.query,
      ...req.params
    });

    try {
      const cachedData = await getFromCache(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
    } catch (error) {
      console.warn('Error en caché middleware:', error.message);
    }

    // Interceptar la respuesta para cachearla
    const originalSend = res.json;
    res.json = function(data) {
      setCache(cacheKey, data, ttl).catch(err => {
        console.warn('Error cacheando respuesta:', err.message);
      });
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Función para invalidar caché cuando los datos cambian
 * @param {string} pattern - Patrón de claves a invalidar
 */
const invalidateCache = async (pattern) => {
  await deletePattern(pattern);
};

module.exports = {
  getFromCache,
  setCache,
  deleteFromCache,
  deletePattern,
  clearAllCache,
  generateCacheKey,
  cacheMiddleware,
  invalidateCache
}; 