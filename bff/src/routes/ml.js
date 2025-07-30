/**
 * Rutas de Machine Learning para el BFF
 * Proporciona endpoints para predicciones y gestión del modelo
 */

const express = require('express');
const router = express.Router();

// Importar servicios
const mlService = require('../services/mlService');
const cacheService = require('../services/cacheService');

/**
 * GET /api/ml/health
 * Health check del servicio ML
 */
router.get('/health', async (req, res) => {
    try {
        const result = await mlService.healthCheck();
        
        if (!result.success) {
            return res.status(result.status).json({
                success: false,
                error: result.error,
                service: 'ml-service'
            });
        }

        res.json({
            success: true,
            data: result.data,
            service: 'ml-service'
        });

    } catch (error) {
        console.error('Error en health check ML:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            service: 'ml-service'
        });
    }
});

/**
 * POST /api/ml/train
 * Entrenar modelo de ML
 */
router.post('/train', async (req, res) => {
    try {
        const result = await mlService.trainModel();
        
        if (!result.success) {
            return res.status(result.status).json({
                success: false,
                error: result.error
            });
        }

        // Invalidar caché relacionada con ML
        await cacheService.deletePattern('ml:*');

        res.json({
            success: true,
            data: result.data,
            message: 'Modelo entrenado exitosamente'
        });

    } catch (error) {
        console.error('Error entrenando modelo:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/ml/predict
 * Realizar predicción de valor de propiedad
 */
router.post('/predict', async (req, res) => {
    try {
        const propertyData = req.body;

        // Validar datos de entrada
        const validation = mlService.validatePredictionInput(propertyData);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Datos de entrada inválidos',
                details: validation.errors
            });
        }

        // Formatear datos de entrada
        const formattedData = mlService.formatInputData(propertyData);

        // Generar clave de caché
        const cacheKey = `ml:prediction:${JSON.stringify(formattedData)}`;
        
        // Intentar obtener de caché
        const cachedResult = await cacheService.getFromCache(cacheKey);
        if (cachedResult) {
            return res.json({
                success: true,
                data: cachedResult,
                message: 'Predicción obtenida de caché',
                cached: true
            });
        }

        // Realizar predicción
        const result = await mlService.predictPropertyValue(formattedData);
        
        if (!result.success) {
            return res.status(result.status).json({
                success: false,
                error: result.error
            });
        }

        // Formatear respuesta
        const formattedResponse = mlService.formatPredictionResponse(result);

        // Cachear resultado (5 minutos)
        await cacheService.setCache(cacheKey, formattedResponse.data, 300);

        res.json({
            success: true,
            data: formattedResponse.data,
            message: 'Predicción realizada exitosamente',
            cached: false
        });

    } catch (error) {
        console.error('Error en predicción:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/ml/model/info
 * Obtener información del modelo
 */
router.get('/model/info', async (req, res) => {
    try {
        // Intentar obtener de caché
        const cacheKey = 'ml:model:info';
        const cachedResult = await cacheService.getFromCache(cacheKey);
        
        if (cachedResult) {
            return res.json({
                success: true,
                data: cachedResult,
                message: 'Información del modelo obtenida de caché',
                cached: true
            });
        }

        const result = await mlService.getModelInfo();
        
        if (!result.success) {
            return res.status(result.status).json({
                success: false,
                error: result.error
            });
        }

        // Cachear resultado (1 hora)
        await cacheService.setCache(cacheKey, result.data, 3600);

        res.json({
            success: true,
            data: result.data,
            message: 'Información del modelo obtenida exitosamente',
            cached: false
        });

    } catch (error) {
        console.error('Error obteniendo información del modelo:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/ml/data/stats
 * Obtener estadísticas de datos de entrenamiento
 */
router.get('/data/stats', async (req, res) => {
    try {
        // Intentar obtener de caché
        const cacheKey = 'ml:data:stats';
        const cachedResult = await cacheService.getFromCache(cacheKey);
        
        if (cachedResult) {
            return res.json({
                success: true,
                data: cachedResult,
                message: 'Estadísticas obtenidas de caché',
                cached: true
            });
        }

        const result = await mlService.getDataStats();
        
        if (!result.success) {
            return res.status(result.status).json({
                success: false,
                error: result.error
            });
        }

        // Cachear resultado (30 minutos)
        await cacheService.setCache(cacheKey, result.data, 1800);

        res.json({
            success: true,
            data: result.data,
            message: 'Estadísticas obtenidas exitosamente',
            cached: false
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/ml/features
 * Obtener características disponibles para predicción
 */
router.get('/features', async (req, res) => {
    try {
        // Intentar obtener de caché
        const cacheKey = 'ml:features';
        const cachedResult = await cacheService.getFromCache(cacheKey);
        
        if (cachedResult) {
            return res.json({
                success: true,
                data: cachedResult,
                message: 'Características obtenidas de caché',
                cached: true
            });
        }

        // Obtener información del modelo para extraer características
        const modelInfo = await mlService.getModelInfo();
        
        if (!modelInfo.success) {
            return res.status(modelInfo.status).json({
                success: false,
                error: modelInfo.error
            });
        }

        const features = {
            required: [
                {
                    name: 'assessed_value',
                    type: 'number',
                    description: 'Valor tasado de la propiedad',
                    min: 0
                },
                {
                    name: 'property_type',
                    type: 'string',
                    description: 'Tipo de propiedad',
                    options: modelInfo.data.model_info?.available_categories?.property_types || []
                },
                {
                    name: 'town',
                    type: 'string',
                    description: 'Ciudad de la propiedad',
                    options: modelInfo.data.model_info?.available_categories?.towns || []
                }
            ],
            optional: [
                {
                    name: 'list_year',
                    type: 'number',
                    description: 'Año de listado',
                    min: 1900,
                    max: 2030,
                    default: 2020
                },
                {
                    name: 'residential_type',
                    type: 'string',
                    description: 'Tipo residencial',
                    options: modelInfo.data.model_info?.available_categories?.residential_types || []
                },
                {
                    name: 'years_until_sold',
                    type: 'number',
                    description: 'Años hasta la venta',
                    min: 0,
                    default: 0
                }
            ],
            model_info: {
                type: modelInfo.data.model_info?.type,
                feature_importance: modelInfo.data.model_info?.feature_importance,
                version: '1.0.0'
            }
        };

        // Cachear resultado (1 hora)
        await cacheService.setCache(cacheKey, features, 3600);

        res.json({
            success: true,
            data: features,
            message: 'Características obtenidas exitosamente',
            cached: false
        });

    } catch (error) {
        console.error('Error obteniendo características:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/ml/batch-predict
 * Realizar múltiples predicciones en lote
 */
router.post('/batch-predict', async (req, res) => {
    try {
        const { properties } = req.body;

        if (!properties || !Array.isArray(properties) || properties.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere un array de propiedades'
            });
        }

        if (properties.length > 10) {
            return res.status(400).json({
                success: false,
                error: 'Máximo 10 propiedades por lote'
            });
        }

        const results = [];
        const errors = [];

        // Procesar cada propiedad
        for (let i = 0; i < properties.length; i++) {
            const property = properties[i];
            
            try {
                // Validar datos de entrada
                const validation = mlService.validatePredictionInput(property);
                if (!validation.isValid) {
                    errors.push({
                        index: i,
                        error: 'Datos inválidos',
                        details: validation.errors
                    });
                    continue;
                }

                // Formatear datos
                const formattedData = mlService.formatInputData(property);

                // Realizar predicción
                const result = await mlService.predictPropertyValue(formattedData);
                
                if (result.success) {
                    const formattedResponse = mlService.formatPredictionResponse(result);
                    results.push({
                        index: i,
                        input: property,
                        prediction: formattedResponse.data
                    });
                } else {
                    errors.push({
                        index: i,
                        error: result.error
                    });
                }

            } catch (error) {
                errors.push({
                    index: i,
                    error: 'Error procesando propiedad'
                });
            }
        }

        res.json({
            success: true,
            data: {
                total: properties.length,
                successful: results.length,
                failed: errors.length,
                results,
                errors
            },
            message: `Procesadas ${properties.length} propiedades: ${results.length} exitosas, ${errors.length} fallidas`
        });

    } catch (error) {
        console.error('Error en predicción por lote:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

module.exports = router; 