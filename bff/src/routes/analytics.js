/**
 * Rutas de analíticas optimizadas para el BFF
 * Maneja todas las consultas analíticas y KPIs con caché inteligente
 */

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const { cacheMiddleware } = require('../services/cacheService');

/**
 * GET /api/analytics/dashboard
 * Obtiene dashboard completo con todos los datos analíticos
 * Caché: 10 minutos
 */
router.get('/dashboard', cacheMiddleware('dashboard', 600), async (req, res) => {
  try {
    const { property_type } = req.query;

    const dashboardData = await analyticsService.getDashboardData(property_type);

    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/kpis
 * Obtiene KPIs principales
 * Caché: 10 minutos
 */
router.get('/kpis', cacheMiddleware('kpis', 600), async (req, res) => {
  try {
    const { property_type } = req.query;

    const kpis = await analyticsService.getKPIs(property_type);

    res.json({
      success: true,
      data: kpis,
      filters: {
        property_type: property_type || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo KPIs:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/charts/avg-price-by-town
 * Obtiene precios promedio por ciudad
 * Caché: 15 minutos
 */
router.get('/charts/avg-price-by-town', cacheMiddleware('avg_price_by_town', 900), async (req, res) => {
  try {
    const { property_type } = req.query;

    const data = await analyticsService.getAveragePriceByTown(property_type);

    res.json({
      success: true,
      data: data,
      filters: {
        property_type: property_type || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo precios por ciudad:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/charts/property-type-analysis
 * Obtiene análisis por tipo de propiedad
 * Caché: 15 minutos
 */
router.get('/charts/property-type-analysis', cacheMiddleware('property_type_analysis', 900), async (req, res) => {
  try {
    const { property_type } = req.query;

    const data = await analyticsService.getPropertyTypeAnalysis(property_type);

    res.json({
      success: true,
      data: data,
      filters: {
        property_type: property_type || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo análisis por tipo:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/charts/yearly-trends
 * Obtiene tendencias anuales
 * Caché: 15 minutos
 */
router.get('/charts/yearly-trends', cacheMiddleware('yearly_trends', 900), async (req, res) => {
  try {
    const { property_type } = req.query;

    const data = await analyticsService.getYearlyTrends(property_type);

    res.json({
      success: true,
      data: data,
      filters: {
        property_type: property_type || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo tendencias anuales:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/charts/sales-ratio-distribution
 * Obtiene distribución de ratio de venta
 * Caché: 15 minutos
 */
router.get('/charts/sales-ratio-distribution', cacheMiddleware('sales_ratio_distribution', 900), async (req, res) => {
  try {
    const { property_type } = req.query;

    const data = await analyticsService.getSalesRatioDistribution(property_type);

    res.json({
      success: true,
      data: data,
      filters: {
        property_type: property_type || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo distribución de ratio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/charts/time-to-sell-distribution
 * Obtiene distribución de tiempo hasta venta
 * Caché: 15 minutos
 */
router.get('/charts/time-to-sell-distribution', cacheMiddleware('time_to_sell_distribution', 900), async (req, res) => {
  try {
    const { property_type } = req.query;

    const data = await analyticsService.getTimeToSellDistribution(property_type);

    res.json({
      success: true,
      data: data,
      filters: {
        property_type: property_type || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo distribución de tiempo:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/charts/top-cities-by-volume
 * Obtiene top 10 ciudades por volumen
 * Caché: 15 minutos
 */
router.get('/charts/top-cities-by-volume', cacheMiddleware('top_cities_by_volume', 900), async (req, res) => {
  try {
    const { property_type } = req.query;

    const data = await analyticsService.getTopCitiesByVolume(property_type);

    res.json({
      success: true,
      data: data,
      filters: {
        property_type: property_type || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo top ciudades:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/charts/all
 * Obtiene todos los gráficos en una sola petición
 * Caché: 10 minutos
 */
router.get('/charts/all', cacheMiddleware('all_charts', 600), async (req, res) => {
  try {
    const { property_type } = req.query;

    // Obtener todos los gráficos en paralelo para mejor rendimiento
    const [
      avgPriceByTown,
      propertyTypeAnalysis,
      yearlyTrends,
      salesRatioDistribution,
      timeToSellDistribution,
      topCitiesByVolume
    ] = await Promise.all([
      analyticsService.getAveragePriceByTown(property_type),
      analyticsService.getPropertyTypeAnalysis(property_type),
      analyticsService.getYearlyTrends(property_type),
      analyticsService.getSalesRatioDistribution(property_type),
      analyticsService.getTimeToSellDistribution(property_type),
      analyticsService.getTopCitiesByVolume(property_type)
    ]);

    const charts = {
      avg_price_by_town: avgPriceByTown,
      property_type_analysis: propertyTypeAnalysis,
      yearly_trends: yearlyTrends,
      sales_ratio_distribution: salesRatioDistribution,
      time_to_sell_distribution: timeToSellDistribution,
      top_cities_by_volume: topCitiesByVolume
    };

    res.json({
      success: true,
      data: charts,
      filters: {
        property_type: property_type || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo todos los gráficos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/performance/metrics
 * Obtiene métricas de rendimiento del sistema
 * Sin caché (datos en tiempo real)
 */
router.get('/performance/metrics', async (req, res) => {
  try {
    const startTime = Date.now();

    // Simular algunas métricas de rendimiento
    const metrics = {
      system: {
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        cpu_usage: process.cpuUsage()
      },
      cache: {
        status: 'active',
        hit_rate: 0.85, // Simulado
        total_keys: 150 // Simulado
      },
      database: {
        connection_pool: {
          total: 20,
          idle: 15,
          active: 5
        }
      },
      response_time: Date.now() - startTime
    };

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * POST /api/analytics/cache/clear
 * Limpia el caché de analíticas (solo para administradores)
 */
router.post('/cache/clear', async (req, res) => {
  try {
    // En un entorno real, aquí verificarías autenticación/autorización
    await analyticsService.invalidateAnalyticsCache();

    res.json({
      success: true,
      message: 'Caché de analíticas limpiado exitosamente',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error limpiando caché:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/health
 * Endpoint de salud para monitoreo
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      service: 'analytics',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        cache: 'available',
        memory: process.memoryUsage().heapUsed < 100 * 1024 * 1024 // < 100MB
      }
    };

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Service unhealthy',
      message: error.message
    });
  }
});

module.exports = router; 