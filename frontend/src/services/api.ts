/**
 * Servicio de API optimizado para conectar con el BFF
 * Maneja todas las comunicaciones entre el frontend y el BFF
 */

// Configuración de la API
const API_BASE_URL = 'http://localhost:3001/api';

// Función para hacer peticiones HTTP
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Obtener token del localStorage
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
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

// Interfaces para autenticación
interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthResponse {
  success: boolean;
  data?: {
    success: boolean;
    token: string;
    user: User;
  };
  token?: string;
  user?: User;
  message?: string;
}

// Servicios de la API
export const apiService = {
  // Autenticación
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getProfile: async (): Promise<{ success: boolean; user: User }> => {
    return apiRequest('/auth/profile');
  },

  updateProfile: async (data: { email: string }): Promise<{ success: boolean; message: string }> => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  logout: () => {
    // Limpiar token del localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

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

  // Opciones para filtros
  getCities: () => {
    return apiRequest('/properties/filters/cities');
  },

  getPropertyTypes: () => {
    return apiRequest('/properties/filters/property-types');
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
  },

  // CRUD de Propiedades (Admin)
  createProperty: (propertyData: any) => {
    return apiRequest('/admin/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  },

  updateProperty: (id: string | number, propertyData: any) => {
    return apiRequest(`/admin/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
  },

  deleteProperty: (id: number) => {
    return apiRequest(`/admin/properties/${id}`, {
      method: 'DELETE',
    });
  },

  // CRUD de Usuarios (Admin)
  getUsers: () => {
    return apiRequest('/admin/users');
  },

  createUser: (userData: any) => {
    return apiRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  updateUser: (id: number, userData: any) => {
    return apiRequest(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  deleteUser: (id: number) => {
    return apiRequest(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Machine Learning
  predictPropertyPrice: (propertyData: {
    property_type: string;
    residential_type: string;
    town: string;
    list_year: number;
    assessed_value: number;
    years_until_sold: number;
  }) => {
    return apiRequest('/ml/predict', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  },

  getMLModelInfo: () => {
    return apiRequest('/ml/model/info');
  },

  getMLDataStats: () => {
    return apiRequest('/ml/data/stats');
  }
}; 