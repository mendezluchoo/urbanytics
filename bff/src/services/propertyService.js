/**
 * Servicio de propiedades optimizado para el BFF
 * Maneja todas las operaciones relacionadas con propiedades inmobiliarias
 */

const { postgresPool } = require('../config/database');
const { setCache, getFromCache, generateCacheKey, invalidateCache } = require('./cacheService');
const backendService = require('./backendService');

/**
 * Obtiene propiedades con filtros avanzados y paginación optimizada
 * @param {object} filters - Filtros de búsqueda
 * @param {object} pagination - Configuración de paginación
 * @param {object} sorting - Configuración de ordenamiento
 * @returns {Promise<object>} - Propiedades y metadatos de paginación
 */
const getProperties = async (filters = {}, pagination = {}, sorting = {}) => {
  try {
    const params = {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      sort_by: sorting.sortBy || 'serial_number',
      sort_order: sorting.sortOrder || 'asc',
      ...filters
    };
    
    const response = await backendService.getProperties(params);
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene una propiedad específica por ID
 * @param {number} id - ID de la propiedad
 * @returns {Promise<object>} - Propiedad encontrada
 */
const getPropertyById = async (id) => {
  const cacheKey = generateCacheKey('property', { id });

  // Intentar obtener del caché
  const cachedProperty = await getFromCache(cacheKey);
  if (cachedProperty) {
    return cachedProperty;
  }

  const query = `
    SELECT 
      serial_number,
      list_year,
      date_recorded,
      town,
      address,
      assessed_value,
      sale_amount,
      sales_ratio,
      property_type,
      residential_type,
      years_until_sold
    FROM properties 
    WHERE serial_number = $1
  `;

  const result = await postgresPool.query(query, [id]);

  if (result.rows.length === 0) {
    throw new Error('Property not found');
  }

  const property = result.rows[0];

  // Cachear por 10 minutos
  await setCache(cacheKey, property, 600);

  return property;
};

/**
 * Obtiene ciudades únicas para filtros
 * @returns {Promise<Array>} - Lista de ciudades
 */
const getCities = async () => {
  const cacheKey = 'cities';

  // Intentar obtener del caché
  const cachedCities = await getFromCache(cacheKey);
  if (cachedCities) {
    return cachedCities;
  }

  const query = `
    SELECT DISTINCT town 
    FROM properties 
    WHERE town IS NOT NULL 
    ORDER BY town
  `;

  const result = await postgresPool.query(query);
  const cities = result.rows.map(row => row.town);

  // Cachear por 1 hora (datos estáticos)
  await setCache(cacheKey, cities, 3600);

  return cities;
};

/**
 * Obtiene tipos de propiedad únicos
 * @returns {Promise<Array>} - Lista de tipos de propiedad
 */
const getPropertyTypes = async () => {
  const cacheKey = 'property_types';

  // Intentar obtener del caché
  const cachedTypes = await getFromCache(cacheKey);
  if (cachedTypes) {
    return cachedTypes;
  }

  const query = `
    SELECT DISTINCT property_type 
    FROM properties 
    WHERE property_type IS NOT NULL 
    ORDER BY property_type
  `;

  const result = await postgresPool.query(query);
  const types = result.rows.map(row => row.property_type);

  // Cachear por 1 hora (datos estáticos)
  await setCache(cacheKey, types, 3600);

  return types;
};

/**
 * Obtiene tipos residenciales únicos
 * @returns {Promise<Array>} - Lista de tipos residenciales
 */
const getResidentialTypes = async () => {
  const cacheKey = 'residential_types';

  // Intentar obtener del caché
  const cachedTypes = await getFromCache(cacheKey);
  if (cachedTypes) {
    return cachedTypes;
  }

  const query = `
    SELECT DISTINCT residential_type 
    FROM properties 
    WHERE residential_type IS NOT NULL 
    AND residential_type != 'Nan' 
    ORDER BY residential_type
  `;

  const result = await postgresPool.query(query);
  const types = result.rows.map(row => row.residential_type);

  // Cachear por 1 hora (datos estáticos)
  await setCache(cacheKey, types, 3600);

  return types;
};

/**
 * Obtiene años únicos para filtros
 * @returns {Promise<Array>} - Lista de años
 */
const getListYears = async () => {
  const cacheKey = 'list_years';

  // Intentar obtener del caché
  const cachedYears = await getFromCache(cacheKey);
  if (cachedYears) {
    return cachedYears;
  }

  const query = `
    SELECT DISTINCT list_year 
    FROM properties 
    WHERE list_year IS NOT NULL 
    ORDER BY list_year
  `;

  const result = await postgresPool.query(query);
  const years = result.rows.map(row => row.list_year);

  // Cachear por 1 hora (datos estáticos)
  await setCache(cacheKey, years, 3600);

  return years;
};

/**
 * Invalida el caché relacionado con propiedades
 * Se llama cuando los datos cambian
 */
const invalidatePropertyCache = async () => {
  await invalidateCache('properties:*');
  await invalidateCache('property:*');
};

module.exports = {
  getProperties,
  getPropertyById,
  getCities,
  getPropertyTypes,
  getResidentialTypes,
  getListYears,
  invalidatePropertyCache
}; 