/**
 * Servicio para comunicación con el servicio de Machine Learning
 * Maneja predicciones de valor de propiedades
 */

const axios = require('axios');

class MLService {
    constructor() {
        this.baseURL = process.env.ML_SERVICE_URL || 'http://localhost:5000';
        this.timeout = 15000; // 15 segundos para ML
        
        // Configurar axios
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // Interceptor para logging
        this.client.interceptors.request.use(
            (config) => {
                console.log(`🤖 [BFF] → ML Service: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('❌ [BFF] Error en request al ML service:', error.message);
                return Promise.reject(error);
            }
        );

        this.client.interceptors.response.use(
            (response) => {
                console.log(`✅ [BFF] ← ML Service: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                console.error('❌ [BFF] Error en response del ML service:', error.message);
                return Promise.reject(error);
            }
        );
    }

    /**
     * Health check del ML service
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/health');
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: error.response?.status || 500
            };
        }
    }

    /**
     * Entrenar modelo
     */
    async trainModel() {
        try {
            const response = await this.client.post('/train');
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || error.message,
                status: error.response?.status || 500
            };
        }
    }

    /**
     * Realizar predicción de valor de propiedad
     */
    async predictPropertyValue(propertyData) {
        try {
            const response = await this.client.post('/predict', propertyData);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || error.message,
                status: error.response?.status || 500
            };
        }
    }

    /**
     * Obtener información del modelo
     */
    async getModelInfo() {
        try {
            const response = await this.client.get('/model/info');
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || error.message,
                status: error.response?.status || 500
            };
        }
    }

    /**
     * Obtener estadísticas de datos
     */
    async getDataStats() {
        try {
            const response = await this.client.get('/data/stats');
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || error.message,
                status: error.response?.status || 500
            };
        }
    }

    /**
     * Validar datos de entrada para predicción
     */
    validatePredictionInput(data) {
        const errors = [];
        
        // Validar campos requeridos
        if (!data.assessed_value || data.assessed_value <= 0) {
            errors.push('assessed_value debe ser mayor a 0');
        }
        
        if (!data.property_type) {
            errors.push('property_type es requerido');
        }
        
        if (!data.town) {
            errors.push('town es requerido');
        }
        
        // Validar campos opcionales
        if (data.list_year && (data.list_year < 1900 || data.list_year > 2030)) {
            errors.push('list_year debe estar entre 1900 y 2030');
        }
        
        if (data.years_until_sold && data.years_until_sold < 0) {
            errors.push('years_until_sold no puede ser negativo');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Formatear datos de entrada para el modelo
     */
    formatInputData(data) {
        return {
            list_year: data.list_year || 2020,
            assessed_value: parseFloat(data.assessed_value),
            property_type: data.property_type,
            residential_type: data.residential_type || 'Unknown',
            town: data.town,
            years_until_sold: data.years_until_sold || 0
        };
    }

    /**
     * Formatear respuesta de predicción
     */
    formatPredictionResponse(mlResponse) {
        if (!mlResponse.success) {
            return mlResponse;
        }

        const prediction = mlResponse.data.prediction;
        const inputData = mlResponse.data.input_data;

        return {
            success: true,
            data: {
                predicted_price: prediction.predicted_price,
                assessed_value: prediction.assessed_value,
                price_ratio: prediction.price_ratio,
                confidence_score: prediction.confidence_score,
                model_version: prediction.model_version,
                input_data: inputData,
                timestamp: mlResponse.data.timestamp,
                insights: this.generateInsights(prediction, inputData)
            }
        };
    }

    /**
     * Generar insights basados en la predicción
     */
    generateInsights(prediction, inputData) {
        const insights = [];
        
        // Análisis del ratio precio/tasado
        const ratio = prediction.price_ratio;
        if (ratio > 1.1) {
            insights.push({
                type: 'warning',
                message: 'El precio predicho es significativamente mayor al valor tasado',
                detail: `Ratio: ${(ratio * 100).toFixed(1)}%`
            });
        } else if (ratio < 0.9) {
            insights.push({
                type: 'opportunity',
                message: 'El precio predicho es menor al valor tasado',
                detail: `Ratio: ${(ratio * 100).toFixed(1)}%`
            });
        } else {
            insights.push({
                type: 'neutral',
                message: 'El precio predicho está alineado con el valor tasado',
                detail: `Ratio: ${(ratio * 100).toFixed(1)}%`
            });
        }

        // Análisis por tipo de propiedad
        if (inputData.property_type) {
            insights.push({
                type: 'info',
                message: `Análisis para tipo: ${inputData.property_type}`,
                detail: 'Basado en datos históricos del mercado'
            });
        }

        // Análisis por ciudad
        if (inputData.town) {
            insights.push({
                type: 'info',
                message: `Análisis para ciudad: ${inputData.town}`,
                detail: 'Considerando tendencias locales del mercado'
            });
        }

        return insights;
    }
}

module.exports = new MLService(); 