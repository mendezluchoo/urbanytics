/**
 * Servicio de API optimizado para conectar con el BFF
 * Maneja todas las comunicaciones entre el frontend y el BFF
 */

// Configuración de la API
const API_BASE_URL = 'http://localhost:3001/api';

// Función para hacer peticiones HTTP
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Error en la respuesta del servidor');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Servicios de la API
export const apiService = {
  // Propiedades
  getProperties: (params: Record<string, any> = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/properties?${queryString}`);
  },
  
  getPropertyById: (id: string | number) => {
    return apiRequest(`/properties/${id}`);
  },
  
  getPropertyFilters: () => {
    return apiRequest('/properties/filters/all');
  },
  
  searchProperties: (searchParams: any) => {
    return apiRequest('/properties/search', {
      method: 'POST',
      body: JSON.stringify(searchParams),
    });
  },
  
  // Analíticas
  getDashboard: (propertyType: string | null = null) => {
    const params = propertyType ? `?property_type=${propertyType}` : '';
    return apiRequest(`/analytics/dashboard${params}`);
  },
  
  getKPIs: (propertyType: string | null = null) => {
    const params = propertyType ? `?property_type=${propertyType}` : '';
    return apiRequest(`/analytics/kpis${params}`);
  },
  
  getAllCharts: (propertyType: string | null = null) => {
    const params = propertyType ? `?property_type=${propertyType}` : '';
    return apiRequest(`/analytics/charts/all${params}`);
  },
  
  // Gráficos individuales (si los necesitas)
  getAveragePriceByTown: (propertyType: string | null = null) => {
    const params = propertyType ? `?property_type=${propertyType}` : '';
    return apiRequest(`/analytics/charts/avg-price-by-town${params}`);
  },
  
  getPropertyTypeAnalysis: (propertyType: string | null = null) => {
    const params = propertyType ? `?property_type=${propertyType}` : '';
    return apiRequest(`/analytics/charts/property-type-analysis${params}`);
  },
  
  getYearlyTrends: (propertyType: string | null = null) => {
    const params = propertyType ? `?property_type=${propertyType}` : '';
    return apiRequest(`/analytics/charts/yearly-trends${params}`);
  },
  
  getSalesRatioDistribution: (propertyType: string | null = null) => {
    const params = propertyType ? `?property_type=${propertyType}` : '';
    return apiRequest(`/analytics/charts/sales-ratio-distribution${params}`);
  },
  
  getTimeToSellDistribution: (propertyType: string | null = null) => {
    const params = propertyType ? `?property_type=${propertyType}` : '';
    return apiRequest(`/analytics/charts/time-to-sell-distribution${params}`);
  },
  
  getTopCitiesByVolume: (propertyType: string | null = null) => {
    const params = propertyType ? `?property_type=${propertyType}` : '';
    return apiRequest(`/analytics/charts/top-cities-by-volume${params}`);
  },
  
  // Utilidades
  clearCache: () => {
    return apiRequest('/analytics/cache/clear', {
      method: 'POST',
    });
  },
  
  getHealth: () => {
    return apiRequest('/health');
  },
  
  getInfo: () => {
    return apiRequest('/info');
  }
}; 