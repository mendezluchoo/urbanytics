/**
 * Servicio para comunicación con el Backend Go
 * Maneja todas las llamadas al backend core
 */

const axios = require('axios');

class BackendService {
    constructor() {
        this.baseURL = process.env.BACKEND_URL || 'http://urbanytics_backend:8080';
        this.timeout = 10000; // 10 segundos
        
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
                console.log(`🚀 [BFF] → Backend: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('❌ [BFF] Error en request al backend:', error.message);
                return Promise.reject(error);
            }
        );

        this.client.interceptors.response.use(
            (response) => {
                console.log(`✅ [BFF] ← Backend: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                console.error('❌ [BFF] Error en response del backend:', error.message);
                return Promise.reject(error);
            }
        );
    }

    /**
     * Realizar request autenticado
     */
    async authenticatedRequest(config, token) {
        if (token) {
            config.headers = {
                ...config.headers,
                'Authorization': `Bearer ${token}`
            };
        }
        return this.client.request(config);
    }

    /**
     * Health check del backend
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
     * Autenticación
     */
    async login(credentials) {
        try {
            const response = await this.client.post('/api/v1/auth/login', credentials);
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

    async register(userData) {
        try {
            const response = await this.client.post('/api/v1/auth/register', userData);
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
     * Propiedades
     */
    async getProperties(params = {}, token = null) {
        try {
            const response = await this.authenticatedRequest({
                method: 'GET',
                url: '/api/v1/properties',
                params
            }, token);
            
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

    async getPropertyById(id, token = null) {
        try {
            const response = await this.authenticatedRequest({
                method: 'GET',
                url: `/api/v1/properties/${id}`
            }, token);
            
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

    async createProperty(propertyData, token) {
        try {
            const response = await this.authenticatedRequest({
                method: 'POST',
                url: '/api/v1/admin/properties',
                data: propertyData
            }, token);
            
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

    async updateProperty(id, propertyData, token) {
        try {
            const response = await this.authenticatedRequest({
                method: 'PUT',
                url: `/api/v1/admin/properties/${id}`,
                data: propertyData
            }, token);
            
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

    async deleteProperty(id, token) {
        try {
            const response = await this.authenticatedRequest({
                method: 'DELETE',
                url: `/api/v1/admin/properties/${id}`
            }, token);
            
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
     * Filtros
     */
    async getCities(token = null) {
        try {
            const response = await this.authenticatedRequest({
                method: 'GET',
                url: '/api/v1/properties/filters/cities'
            }, token);
            
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

    async getPropertyTypes(token = null) {
        try {
            const response = await this.authenticatedRequest({
                method: 'GET',
                url: '/api/v1/properties/filters/property-types'
            }, token);
            
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

    async getResidentialTypes(token = null) {
        try {
            const response = await this.authenticatedRequest({
                method: 'GET',
                url: '/api/v1/properties/filters/residential-types'
            }, token);
            
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

    async getListYears(token = null) {
        try {
            const response = await this.authenticatedRequest({
                method: 'GET',
                url: '/api/v1/properties/filters/list-years'
            }, token);
            
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
     * Analytics
     */
    async getKPIs(token = null) {
        try {
            const response = await this.authenticatedRequest({
                method: 'GET',
                url: '/api/v1/analytics/kpis'
            }, token);
            
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

    async getTrendsByYear(token = null) {
        try {
            const response = await this.authenticatedRequest({
                method: 'GET',
                url: '/api/v1/analytics/trends-by-year'
            }, token);
            
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

    async getAveragePriceByTown(token = null) {
        try {
            const response = await this.authenticatedRequest({
                method: 'GET',
                url: '/api/v1/analytics/avg-price-by-town'
            }, token);
            
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

    async getPropertyTypeAnalysis(token = null) {
        try {
            const response = await this.authenticatedRequest({
                method: 'GET',
                url: '/api/v1/analytics/property-type-analysis'
            }, token);
            
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

    async getSalesRatioDistribution(token = null) {
        try {
            const response = await this.authenticatedRequest({
                method: 'GET',
                url: '/api/v1/analytics/sales-ratio-distribution'
            }, token);
            
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

    async getTimeToSellDistribution(token = null) {
        try {
            const response = await this.authenticatedRequest({
                method: 'GET',
                url: '/api/v1/analytics/time-to-sell-distribution'
            }, token);
            
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

    async getTopCitiesByVolume(token = null) {
        try {
            const response = await this.authenticatedRequest({
                method: 'GET',
                url: '/api/v1/analytics/top-cities-by-volume'
            }, token);
            
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
     * Perfil de usuario
     */
    async getProfile(token) {
        try {
            const response = await this.authenticatedRequest({
                method: 'GET',
                url: '/api/v1/profile'
            }, token);
            
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

    async updateProfile(profileData, token) {
        try {
            const response = await this.authenticatedRequest({
                method: 'PUT',
                url: '/api/v1/profile',
                data: profileData
            }, token);
            
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
     * Administración
     */
    async getUsers(token) {
        try {
            const response = await this.authenticatedRequest({
                method: 'GET',
                url: '/api/v1/admin/users'
            }, token);
            
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

    async createUser(userData, token) {
        try {
            const response = await this.authenticatedRequest({
                method: 'POST',
                url: '/api/v1/admin/users',
                data: userData
            }, token);
            
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

    async updateUser(id, userData, token) {
        try {
            const response = await this.authenticatedRequest({
                method: 'PUT',
                url: `/api/v1/admin/users/${id}`,
                data: userData
            }, token);
            
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

    async deleteUser(id, token) {
        try {
            const response = await this.authenticatedRequest({
                method: 'DELETE',
                url: `/api/v1/admin/users/${id}`
            }, token);
            
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
}

module.exports = new BackendService(); 