/**
 * Rutas de propiedades optimizadas para el BFF
 * Maneja todas las operaciones relacionadas con propiedades inmobiliarias
 */

const express = require('express');
const router = express.Router();
const propertyService = require('../services/propertyService');
const { cacheMiddleware } = require('../services/cacheService');
const backendService = require('../services/backendService');
const axios = require('axios');

/**
 * GET /api/properties
 * Obtiene propiedades con filtros avanzados y paginación
 * Caché: 5 minutos
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      town: req.query.town,
      minPrice: req.query.min_price,
      maxPrice: req.query.max_price,
      propertyType: req.query.property_type,
      residentialType: req.query.residential_type,
      listYear: req.query.list_year,
      status: req.query.status,
      minSalesRatio: req.query.min_sales_ratio,
      maxSalesRatio: req.query.max_sales_ratio,
      minYearsUntilSold: req.query.min_years_until_sold,
      maxYearsUntilSold: req.query.max_years_until_sold
    };

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    const sorting = {
      sortBy: req.query.sort_by || 'serial_number',
      sortOrder: req.query.sort_order || 'asc'
    };

    // Mapeo explícito de nombres de parámetros para el backend Go
    const backendParams = {
      town: filters.town,
      min_price: filters.minPrice,
      max_price: filters.maxPrice,
      property_type: filters.propertyType,
      residential_type: filters.residentialType,
      list_year: filters.listYear,
      status: filters.status,
      min_sales_ratio: filters.minSalesRatio,
      max_sales_ratio: filters.maxSalesRatio,
      min_years_until_sold: filters.minYearsUntilSold,
      max_years_until_sold: filters.maxYearsUntilSold,
      page: pagination.page,
      limit: pagination.limit,
      sort_by: sorting.sortBy,
      sort_order: sorting.sortOrder
    };
    // Elimina los undefined
    Object.keys(backendParams).forEach(
      (key) => backendParams[key] === undefined && delete backendParams[key]
    );

    const queryString = new URLSearchParams(backendParams).toString();
    const backendUrl = `http://urbanytics_backend:8080/api/v1/properties?${queryString}`;
    
    const backendResponse = await axios.get(backendUrl);
    const result = backendResponse.data;

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      filters: filters,
      sorting: sorting,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/properties/:id
 * Obtiene una propiedad específica por ID
 * Caché: 10 minutos
 */
router.get('/:id', cacheMiddleware('property', 600), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de propiedad inválido'
      });
    }

    const property = await propertyService.getPropertyById(id);

    res.json({
      success: true,
      data: property,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error.message === 'Property not found') {
      return res.status(404).json({
        success: false,
        error: 'Propiedad no encontrada'
      });
    }

    console.error('Error obteniendo propiedad:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/properties/filters/cities
 * Obtiene lista de ciudades para filtros
 * Caché: 1 hora (datos estáticos)
 */
router.get('/filters/cities', cacheMiddleware('cities', 3600), async (req, res) => {
  try {
    const cities = await propertyService.getCities();

    res.json({
      success: true,
      data: cities,
      count: cities.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo ciudades:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/properties/filters/property-types
 * Obtiene lista de tipos de propiedad para filtros
 * Caché: 1 hora (datos estáticos)
 */
router.get('/filters/property-types', cacheMiddleware('property_types', 3600), async (req, res) => {
  try {
    const propertyTypes = await propertyService.getPropertyTypes();

    res.json({
      success: true,
      data: propertyTypes,
      count: propertyTypes.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo tipos de propiedad:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/properties/filters/residential-types
 * Obtiene lista de tipos residenciales para filtros
 * Caché: 1 hora (datos estáticos)
 */
router.get('/filters/residential-types', cacheMiddleware('residential_types', 3600), async (req, res) => {
  try {
    const residentialTypes = await propertyService.getResidentialTypes();

    res.json({
      success: true,
      data: residentialTypes,
      count: residentialTypes.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo tipos residenciales:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/properties/filters/list-years
 * Obtiene lista de años para filtros
 * Caché: 1 hora (datos estáticos)
 */
router.get('/filters/list-years', cacheMiddleware('list_years', 3600), async (req, res) => {
  try {
    const years = await propertyService.getListYears();

    res.json({
      success: true,
      data: years,
      count: years.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo años:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/properties/filters/all
 * Obtiene todos los filtros disponibles en una sola petición
 * Caché: 1 hora (datos estáticos)
 */
router.get('/filters/all', cacheMiddleware('all_filters', 3600), async (req, res) => {
  try {
    // Obtener todos los filtros en paralelo para mejor rendimiento
    const [cities, propertyTypes, residentialTypes, years] = await Promise.all([
      propertyService.getCities(),
      propertyService.getPropertyTypes(),
      propertyService.getResidentialTypes(),
      propertyService.getListYears()
    ]);

    res.json({
      success: true,
      data: {
        cities,
        property_types: propertyTypes,
        residential_types: residentialTypes,
        list_years: years
      },
      counts: {
        cities: cities.length,
        property_types: propertyTypes.length,
        residential_types: residentialTypes.length,
        list_years: years.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo filtros:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * POST /api/properties/search
 * Búsqueda avanzada de propiedades con múltiples criterios
 * Caché: 5 minutos
 */
router.post('/search', cacheMiddleware('property_search', 300), async (req, res) => {
  try {
    const {
      filters = {},
      pagination = {},
      sorting = {}
    } = req.body;

    // Validar parámetros
    if (pagination.limit && (pagination.limit < 1 || pagination.limit > 100)) {
      return res.status(400).json({
        success: false,
        error: 'El límite debe estar entre 1 y 100'
      });
    }

    if (pagination.page && pagination.page < 1) {
      return res.status(400).json({
        success: false,
        error: 'La página debe ser mayor a 0'
      });
    }

    const result = await propertyService.getProperties(filters, pagination, sorting);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      filters: result.filters,
      sorting: result.sorting,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en búsqueda de propiedades:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});



/**
 * GET /api/properties/stats/summary
 * Obtiene estadísticas resumidas de propiedades
 * Caché: 10 minutos
 */
router.get('/stats/summary', cacheMiddleware('property_stats', 600), async (req, res) => {
  try {
    const { propertyType } = req.query;

    // Obtener estadísticas básicas
    const [cities, propertyTypes, totalProperties] = await Promise.all([
      propertyService.getCities(),
      propertyService.getPropertyTypes(),
      propertyService.getProperties({ propertyType }, { page: 1, limit: 1 })
    ]);

    const stats = {
      total_cities: cities.length,
      total_property_types: propertyTypes.length,
      total_properties: totalProperties.pagination.total_count,
      filters_applied: propertyType ? { property_type: propertyType } : null
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

module.exports = router; 