/**
 * Servicio de analíticas optimizado para el BFF
 * Maneja todas las consultas analíticas y KPIs con caché inteligente
 */

const { postgresPool } = require('../config/database');
const { setCache, getFromCache, generateCacheKey, invalidateCache } = require('./cacheService');

/**
 * Obtiene KPIs principales con caché optimizado
 * @param {string} propertyType - Filtro opcional por tipo de propiedad
 * @returns {Promise<object>} - KPIs principales
 */
const getKPIs = async (propertyType = null) => {
  const cacheKey = generateCacheKey('kpis', { propertyType });

  // Intentar obtener del caché
  const cachedKPIs = await getFromCache(cacheKey);
  if (cachedKPIs) {
    return cachedKPIs;
  }

  // Construir filtro WHERE
  const whereClause = propertyType ? 'WHERE property_type = $1' : '';
  const args = propertyType ? [propertyType] : [];

  // Consulta optimizada para obtener todos los KPIs en una sola consulta
  const query = `
    WITH kpi_data AS (
      SELECT 
        COUNT(*) as total_properties,
        AVG(CASE WHEN sale_amount > 0 THEN sale_amount END) as avg_price,
        AVG(CASE WHEN sales_ratio > 0 THEN sales_ratio END) as avg_sales_ratio,
        AVG(CASE WHEN years_until_sold >= 0 THEN years_until_sold END) as avg_years_until_sold,
        town,
        property_type
      FROM properties
      ${whereClause}
      GROUP BY town, property_type
    ),
    top_city AS (
      SELECT town, total_properties
      FROM kpi_data
      ORDER BY total_properties DESC
      LIMIT 1
    ),
    top_property_type AS (
      SELECT property_type, total_properties
      FROM kpi_data
      ORDER BY total_properties DESC
      LIMIT 1
    )
    SELECT 
      (SELECT SUM(total_properties) FROM kpi_data) as total_properties,
      (SELECT AVG(avg_price) FROM kpi_data WHERE avg_price IS NOT NULL) as average_price,
      (SELECT AVG(avg_sales_ratio) FROM kpi_data WHERE avg_sales_ratio IS NOT NULL) as average_sales_ratio,
      (SELECT AVG(avg_years_until_sold) FROM kpi_data WHERE avg_years_until_sold IS NOT NULL) as average_years_until_sold,
      (SELECT town FROM top_city) as top_city_name,
      (SELECT total_properties FROM top_city) as top_city_count,
      (SELECT property_type FROM top_property_type) as top_property_type_name,
      (SELECT total_properties FROM top_property_type) as top_property_type_count
  `;

  const result = await postgresPool.query(query, args);
  const row = result.rows[0];

  const kpis = {
    total_properties: parseInt(row.total_properties) || 0,
    average_price: parseFloat(row.average_price) || 0,
    average_sales_ratio: parseFloat(row.average_sales_ratio) || 0,
    average_years_until_sold: parseFloat(row.average_years_until_sold) || 0,
    top_city: {
      name: row.top_city_name || 'N/A',
      count: parseInt(row.top_city_count) || 0
    },
    top_property_type: {
      name: row.top_property_type_name || 'N/A',
      count: parseInt(row.top_property_type_count) || 0
    }
  };

  // Cachear por 10 minutos
  await setCache(cacheKey, kpis, 600);

  return kpis;
};

/**
 * Obtiene precios promedio por ciudad
 * @param {string} propertyType - Filtro opcional por tipo de propiedad
 * @returns {Promise<Array>} - Datos de precios por ciudad
 */
const getAveragePriceByTown = async (propertyType = null) => {
  const cacheKey = generateCacheKey('avg_price_by_town', { propertyType });

  // Intentar obtener del caché
  const cachedData = await getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const whereClause = propertyType ? 'WHERE property_type = $1' : '';
  const args = propertyType ? [propertyType] : [];

  const query = `
    SELECT 
      town,
      AVG(sale_amount) as average_price,
      COUNT(*) as count
    FROM properties
    ${whereClause}
    GROUP BY town
    ORDER BY town
  `;

  const result = await postgresPool.query(query, args);
  const data = result.rows.map(row => ({
    town: row.town,
    average_price: parseFloat(row.average_price) || 0,
    count: parseInt(row.count) || 0
  }));

  // Cachear por 15 minutos
  await setCache(cacheKey, data, 900);

  return data;
};

/**
 * Obtiene análisis por tipo de propiedad
 * @param {string} propertyType - Filtro opcional por tipo de propiedad
 * @returns {Promise<Array>} - Datos de análisis por tipo
 */
const getPropertyTypeAnalysis = async (propertyType = null) => {
  const cacheKey = generateCacheKey('property_type_analysis', { propertyType });

  // Intentar obtener del caché
  const cachedData = await getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  let query, args;

  if (propertyType) {
    query = `
      SELECT 
        property_type,
        COUNT(*) as count,
        AVG(sale_amount) as average_price,
        AVG(sales_ratio) as avg_sales_ratio
      FROM properties 
      WHERE property_type = $1
      GROUP BY property_type
    `;
    args = [propertyType];
  } else {
    query = `
      SELECT 
        property_type,
        COUNT(*) as count,
        AVG(sale_amount) as average_price,
        AVG(sales_ratio) as avg_sales_ratio
      FROM properties 
      WHERE property_type IS NOT NULL
      GROUP BY property_type 
      ORDER BY count DESC
    `;
    args = [];
  }

  const result = await postgresPool.query(query, args);
  const data = result.rows.map(row => ({
    property_type: row.property_type,
    count: parseInt(row.count) || 0,
    average_price: parseFloat(row.average_price) || 0,
    avg_sales_ratio: parseFloat(row.avg_sales_ratio) || 0
  }));

  // Cachear por 15 minutos
  await setCache(cacheKey, data, 900);

  return data;
};

/**
 * Obtiene tendencias anuales
 * @param {string} propertyType - Filtro opcional por tipo de propiedad
 * @returns {Promise<Array>} - Datos de tendencias anuales
 */
const getYearlyTrends = async (propertyType = null) => {
  const cacheKey = generateCacheKey('yearly_trends', { propertyType });

  // Intentar obtener del caché
  const cachedData = await getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const whereClause = propertyType ? 'AND property_type = $1' : '';
  const args = propertyType ? [propertyType] : [];

  const query = `
    SELECT 
      list_year,
      COUNT(*) as total_sales,
      AVG(sale_amount) as average_price,
      AVG(sales_ratio) as avg_sales_ratio
    FROM properties 
    WHERE list_year IS NOT NULL ${whereClause}
    GROUP BY list_year 
    ORDER BY list_year
  `;

  const result = await postgresPool.query(query, args);
  const data = result.rows.map(row => ({
    year: parseInt(row.list_year) || 0,
    total_sales: parseInt(row.total_sales) || 0,
    average_price: parseFloat(row.average_price) || 0,
    avg_sales_ratio: parseFloat(row.avg_sales_ratio) || 0
  }));

  // Cachear por 15 minutos
  await setCache(cacheKey, data, 900);

  return data;
};

/**
 * Obtiene distribución de ratio de venta
 * @param {string} propertyType - Filtro opcional por tipo de propiedad
 * @returns {Promise<Array>} - Datos de distribución de ratio
 */
const getSalesRatioDistribution = async (propertyType = null) => {
  const cacheKey = generateCacheKey('sales_ratio_distribution', { propertyType });

  // Intentar obtener del caché
  const cachedData = await getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const whereClause = propertyType ? 'AND property_type = $1' : '';
  const args = propertyType ? [propertyType] : [];

  const query = `
    WITH ratio_ranges AS (
      SELECT 
        CASE 
          WHEN sales_ratio < 0.5 THEN '< 50%'
          WHEN sales_ratio < 0.7 THEN '50-70%'
          WHEN sales_ratio < 0.9 THEN '70-90%'
          WHEN sales_ratio < 1.1 THEN '90-110%'
          WHEN sales_ratio < 1.3 THEN '110-130%'
          ELSE '> 130%'
        END as range_category,
        COUNT(*) as count
      FROM properties 
      WHERE sales_ratio > 0 ${whereClause}
      GROUP BY range_category
    )
    SELECT 
      range_category,
      count,
      ROUND((count * 100.0 / SUM(count) OVER ()), 2) as percentage
    FROM ratio_ranges
    ORDER BY 
      CASE range_category
        WHEN '< 50%' THEN 1
        WHEN '50-70%' THEN 2
        WHEN '70-90%' THEN 3
        WHEN '90-110%' THEN 4
        WHEN '110-130%' THEN 5
        ELSE 6
      END
  `;

  const result = await postgresPool.query(query, args);
  const data = result.rows.map(row => ({
    range: row.range_category,
    count: parseInt(row.count) || 0,
    percentage: parseFloat(row.percentage) || 0
  }));

  // Cachear por 15 minutos
  await setCache(cacheKey, data, 900);

  return data;
};

/**
 * Obtiene distribución de tiempo hasta venta
 * @param {string} propertyType - Filtro opcional por tipo de propiedad
 * @returns {Promise<Array>} - Datos de distribución de tiempo
 */
const getTimeToSellDistribution = async (propertyType = null) => {
  const cacheKey = generateCacheKey('time_to_sell_distribution', { propertyType });

  // Intentar obtener del caché
  const cachedData = await getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const whereClause = propertyType ? 'AND property_type = $1' : '';
  const args = propertyType ? [propertyType] : [];

  const query = `
    WITH time_ranges AS (
      SELECT 
        CASE 
          WHEN years_until_sold = 0 THEN 'Venta inmediata'
          WHEN years_until_sold <= 1 THEN '1 año o menos'
          WHEN years_until_sold <= 3 THEN '1-3 años'
          WHEN years_until_sold <= 5 THEN '3-5 años'
          WHEN years_until_sold <= 10 THEN '5-10 años'
          ELSE 'Más de 10 años'
        END as time_range,
        COUNT(*) as count
      FROM properties 
      WHERE years_until_sold >= 0 ${whereClause}
      GROUP BY time_range
    )
    SELECT 
      time_range,
      count,
      ROUND((count * 100.0 / SUM(count) OVER ()), 2) as percentage
    FROM time_ranges
    ORDER BY 
      CASE time_range
        WHEN 'Venta inmediata' THEN 1
        WHEN '1 año o menos' THEN 2
        WHEN '1-3 años' THEN 3
        WHEN '3-5 años' THEN 4
        WHEN '5-10 años' THEN 5
        ELSE 6
      END
  `;

  const result = await postgresPool.query(query, args);
  const data = result.rows.map(row => ({
    range: row.time_range,
    count: parseInt(row.count) || 0,
    percentage: parseFloat(row.percentage) || 0
  }));

  // Cachear por 15 minutos
  await setCache(cacheKey, data, 900);

  return data;
};

/**
 * Obtiene top 10 ciudades por volumen
 * @param {string} propertyType - Filtro opcional por tipo de propiedad
 * @returns {Promise<Array>} - Datos de top ciudades
 */
const getTopCitiesByVolume = async (propertyType = null) => {
  const cacheKey = generateCacheKey('top_cities_by_volume', { propertyType });

  // Intentar obtener del caché
  const cachedData = await getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const whereClause = propertyType ? 'WHERE property_type = $1' : '';
  const args = propertyType ? [propertyType] : [];

  const query = `
    SELECT 
      town,
      COUNT(*) as total_sales,
      AVG(sale_amount) as average_price,
      SUM(sale_amount) as total_volume
    FROM properties 
    ${whereClause}
    GROUP BY town 
    ORDER BY total_sales DESC 
    LIMIT 10
  `;

  const result = await postgresPool.query(query, args);
  const data = result.rows.map(row => ({
    town: row.town,
    total_sales: parseInt(row.total_sales) || 0,
    average_price: parseFloat(row.average_price) || 0,
    total_volume: parseFloat(row.total_volume) || 0
  }));

  // Cachear por 15 minutos
  await setCache(cacheKey, data, 900);

  return data;
};

/**
 * Obtiene dashboard completo con todos los datos
 * @param {string} propertyType - Filtro opcional por tipo de propiedad
 * @returns {Promise<object>} - Dashboard completo
 */
const getDashboardData = async (propertyType = null) => {
  const cacheKey = generateCacheKey('dashboard', { propertyType });

  // Intentar obtener del caché
  const cachedData = await getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // Ejecutar todas las consultas en paralelo para mejor rendimiento
  const [
    kpis,
    avgPriceByTown,
    propertyTypeAnalysis,
    yearlyTrends,
    salesRatioDistribution,
    timeToSellDistribution,
    topCitiesByVolume
  ] = await Promise.all([
    getKPIs(propertyType),
    getAveragePriceByTown(propertyType),
    getPropertyTypeAnalysis(propertyType),
    getYearlyTrends(propertyType),
    getSalesRatioDistribution(propertyType),
    getTimeToSellDistribution(propertyType),
    getTopCitiesByVolume(propertyType)
  ]);

  const dashboardData = {
    kpis,
    charts: {
      avg_price_by_town: avgPriceByTown,
      property_type_analysis: propertyTypeAnalysis,
      yearly_trends: yearlyTrends,
      sales_ratio_distribution: salesRatioDistribution,
      time_to_sell_distribution: timeToSellDistribution,
      top_cities_by_volume: topCitiesByVolume
    },
    filters: {
      property_type: propertyType
    },
    timestamp: new Date().toISOString()
  };

  // Cachear por 10 minutos
  await setCache(cacheKey, dashboardData, 600);

  return dashboardData;
};

/**
 * Invalida el caché relacionado con analíticas
 */
const invalidateAnalyticsCache = async () => {
  await invalidateCache('kpis:*');
  await invalidateCache('avg_price_by_town:*');
  await invalidateCache('property_type_analysis:*');
  await invalidateCache('yearly_trends:*');
  await invalidateCache('sales_ratio_distribution:*');
  await invalidateCache('time_to_sell_distribution:*');
  await invalidateCache('top_cities_by_volume:*');
  await invalidateCache('dashboard:*');
};

module.exports = {
  getKPIs,
  getAveragePriceByTown,
  getPropertyTypeAnalysis,
  getYearlyTrends,
  getSalesRatioDistribution,
  getTimeToSellDistribution,
  getTopCitiesByVolume,
  getDashboardData,
  invalidateAnalyticsCache
}; 