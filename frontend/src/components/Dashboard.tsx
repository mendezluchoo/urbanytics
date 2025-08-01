import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';

// Definición de tipos para los datos de analíticas
// Estas interfaces definen la estructura de los datos que vienen del backend

// Tipo para datos de precio promedio por ciudad
type TownAnalytics = {
  town: string;           // Nombre de la ciudad
  average_price: number;  // Precio promedio de las propiedades en esa ciudad
  count: number;          // Número total de ventas en esa ciudad
};

// Tipo para análisis por tipo de propiedad
type PropertyTypeAnalytics = {
  property_type: string;    // Tipo de propiedad (ej: "Single Family", "Condo")
  count: number;            // Número total de propiedades de este tipo
  average_price: number;    // Precio promedio de este tipo de propiedad
  avg_sales_ratio: number;  // Ratio de venta promedio de este tipo
};

// Tipo para análisis temporal por año
type YearlyAnalytics = {
  year: number;             // Año de análisis
  total_sales: number;      // Total de ventas en ese año
  average_price: number;    // Precio promedio en ese año
  avg_sales_ratio: number;  // Ratio de venta promedio en ese año
};

// Tipo para distribución de ratio de venta
type SalesRatioAnalytics = {
  range: string;            // Rango de ratio (ej: "90-110%")
  count: number;            // Número de propiedades en este rango
  percentage: number;       // Porcentaje que representa del total
};

// Tipo para distribución de tiempo hasta venta
type TimeToSellAnalytics = {
  range: string;            // Rango de tiempo (ej: "1-3 años")
  count: number;            // Número de propiedades en este rango
  percentage: number;       // Porcentaje que representa del total
};

// Tipo para top ciudades por volumen
type TopCityAnalytics = {
  town: string;             // Nombre de la ciudad
  total_sales: number;      // Total de ventas en esta ciudad
  average_price: number;    // Precio promedio en esta ciudad
  total_volume: number;     // Volumen total de ventas (suma de todos los precios)
};

// Tipo para los KPIs principales del dashboard
type KPIs = {
  total_properties: number;         // Total de propiedades en la base de datos
  average_price: number;            // Precio promedio general
  average_sales_ratio: number;      // Ratio de venta promedio general
  average_years_until_sold: number; // Tiempo promedio hasta venta
  top_city: {                       // Ciudad con mayor volumen de ventas
    name: string;                   // Nombre de la ciudad
    count: number;                  // Número de ventas en esa ciudad
  };
  top_property_type: {              // Tipo de propiedad más vendido
    name: string;                   // Nombre del tipo de propiedad
    count: number;                  // Número de ventas de este tipo
  };
};

// Paleta de colores mejorada con mejor contraste
const COLORS = {
  primary: '#2563EB',      // Azul principal más oscuro
  secondary: '#059669',    // Verde más oscuro
  accent: '#D97706',       // Amarillo/Naranja más oscuro
  purple: '#7C3AED',       // Púrpura más oscuro
  pink: '#DB2777',         // Rosa más oscuro
  teal: '#0D9488',         // Verde azulado más oscuro
  orange: '#EA580C',       // Naranja más oscuro
  indigo: '#4F46E5',       // Índigo más oscuro
  red: '#DC2626',          // Rojo más oscuro
  gray: '#4B5563'          // Gris más oscuro
};

// Colores para gráficos circulares
const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.purple, COLORS.pink, COLORS.teal];

// Componente de dashboard con múltiples gráficos y análisis
function Dashboard() {
  // Estados para los datos del dashboard (optimizados con BFF)
  const [dashboardData, setDashboardData] = useState<{
    kpis: KPIs;
    charts: {
      avg_price_by_town: TownAnalytics[];
      property_type_analysis: PropertyTypeAnalytics[];
      yearly_trends: YearlyAnalytics[];
      sales_ratio_distribution: SalesRatioAnalytics[];
      time_to_sell_distribution: TimeToSellAnalytics[];
      top_cities_by_volume: TopCityAnalytics[];
    };
  } | null>(null);

  // Estados para los filtros y opciones
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);  // Lista de tipos de propiedad disponibles
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('');  // Tipo de propiedad seleccionado para filtrar
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para el manejo de la interfaz de usuario
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  // Función para cargar datos del dashboard usando el BFF
  const loadDashboard = async (propertyType: string = '') => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener datos del dashboard en una sola petición optimizada
      const response = await apiService.getDashboard(propertyType);
      setDashboardData(response.data);
      
    } catch (err) {
      console.error('Error cargando dashboard:', err);
      setError('Error al cargar los datos del dashboard. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar tipos de propiedad disponibles
  const loadPropertyTypes = async () => {
    try {
      const filtersData = await apiService.getPropertyFilters();
      setPropertyTypes(filtersData.data.property_types || []);
    } catch (err) {
      console.error('Error cargando tipos de propiedad:', err);
    }
  };

  // Función para formatear números con separadores de miles
  const formatNumber = (num: number): string => {
    return num.toLocaleString('es-ES');
  };

  // Función para formatear precios en formato de moneda
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Función para obtener el título dinámico de los gráficos
  const getChartTitle = (baseTitle: string): string => {
    if (selectedPropertyType) {
      return `${baseTitle} - ${selectedPropertyType}`;
    }
    return baseTitle;
  };

  // Funciones para manejo de gráficos expandidos
  const handleChartClick = (chartId: string) => {
    setExpandedChart(chartId);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Solo cerrar si se hace click en el overlay, no en el contenido
    if (e.target === e.currentTarget) {
      setExpandedChart(null);
    }
  };

  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setExpandedChart(null);
    }
  };

  // useEffect para manejar la tecla Escape
  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Función para limpiar todos los filtros aplicados
  // Restaura el dashboard a su estado inicial sin filtros
  const clearFilters = () => {
    setSelectedPropertyType('');
    loadDashboard();
  };

  // Efecto para cargar datos iniciales al montar el componente
  // Se ejecuta solo una vez al cargar la página
  useEffect(() => {
    loadPropertyTypes();
    loadDashboard();
  }, []);

  // Efecto para recargar analíticas cuando cambia el filtro de tipo de propiedad
  // Se ejecuta cada vez que el usuario selecciona un tipo de propiedad diferente
  useEffect(() => {
    loadDashboard(selectedPropertyType);
  }, [selectedPropertyType]);

  // Componente de carga
  if (loading) {
    return (
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border-color)',
            borderTop: '3px solid var(--primary-color)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Componente de error
  if (error) {
    return (
      <div className="container">
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          backgroundColor: 'var(--surface-color)',
          borderRadius: '12px',
          boxShadow: '0 2px 8px var(--shadow-color)',
          margin: '2rem 0'
        }}>
          <h3 style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>Error</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{error}</p>
          <button
            onClick={() => loadDashboard(selectedPropertyType)}
            style={{
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header del Dashboard */}
      <div style={{
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          color: 'var(--text-primary)',
          marginBottom: '0.5rem'
        }}>
          Dashboard Analítico
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-secondary)',
          marginBottom: '2rem'
        }}>
          Análisis completo del mercado inmobiliario
        </p>
      </div>

      {/* KPIs Principales */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Cargando dashboard...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
          <p>{error}</p>
        </div>
      ) : dashboardData?.kpis && dashboardData?.charts && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <div 
            style={{
              backgroundColor: 'var(--surface-color)',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px var(--shadow-color)',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px var(--shadow-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px var(--shadow-color)';
            }}
          >
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '600' }}>
              Total Propiedades
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.primary, margin: 0 }}>
              {formatNumber(dashboardData.kpis.total_properties)}
            </p>
          </div>

          <div 
            style={{
              backgroundColor: 'var(--surface-color)',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px var(--shadow-color)',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px var(--shadow-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px var(--shadow-color)';
            }}
          >
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '600' }}>
              Precio Promedio
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.secondary, margin: 0 }}>
              {formatPrice(dashboardData.kpis.average_price)}
            </p>
          </div>

          <div 
            style={{
              backgroundColor: 'var(--surface-color)',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px var(--shadow-color)',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px var(--shadow-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px var(--shadow-color)';
            }}
          >
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '600' }}>
              Ratio Promedio
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.accent, margin: 0 }}>
              {(dashboardData.kpis.average_sales_ratio * 100).toFixed(1)}%
            </p>
          </div>

          <div 
            style={{
              backgroundColor: 'var(--surface-color)',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px var(--shadow-color)',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px var(--shadow-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px var(--shadow-color)';
            }}
          >
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '600' }}>
              Tiempo Promedio
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.purple, margin: 0 }}>
              {dashboardData.kpis.average_years_until_sold.toFixed(1)} años
            </p>
          </div>

          <div 
            style={{
              backgroundColor: 'var(--surface-color)',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px var(--shadow-color)',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px var(--shadow-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px var(--shadow-color)';
            }}
          >
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '600' }}>
              Ciudad Top
            </h3>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.teal, margin: 0 }}>
              {dashboardData?.kpis.top_city.name || 'N/A'}
            </p>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0, fontWeight: '500' }}>
              {formatNumber(dashboardData?.kpis.top_city.count || 0)} ventas
            </p>
          </div>

          <div 
            style={{
              backgroundColor: 'var(--surface-color)',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px var(--shadow-color)',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px var(--shadow-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px var(--shadow-color)';
            }}
          >
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '600' }}>
              Tipo Más Vendido
            </h3>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.pink, margin: 0 }}>
              {dashboardData?.kpis.top_property_type.name || 'N/A'}
            </p>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0, fontWeight: '500' }}>
              {formatNumber(dashboardData?.kpis.top_property_type.count || 0)} ventas
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{
        backgroundColor: 'var(--surface-color)',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px var(--shadow-color)',
        marginBottom: '2rem',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{
          color: 'var(--text-primary)',
          marginBottom: '1rem',
          fontSize: '1.2rem'
        }}>
          Filtros
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          alignItems: 'end'
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)',
              fontWeight: '500'
            }}>
              Tipo de Propiedad
            </label>
            <select
              value={selectedPropertyType}
              onChange={(e) => setSelectedPropertyType(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem',
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">Todos los tipos</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              onClick={clearFilters}
              style={{
                backgroundColor: COLORS.gray,
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Gráfico de Precio Promedio por Ciudad */}
        <div 
          onClick={() => handleChartClick('price-by-town')}
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '2rem',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          }}
        >
          <h3 style={{
            margin: '0 0 1rem 0',
            color: 'var(--text-color)',
            fontSize: '1.2rem'
          }}>
            {getChartTitle('Precio Promedio por Ciudad')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData?.charts?.avg_price_by_town || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="town" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}>
                        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Ciudad: {label}</p>
                        <p style={{ margin: '0 0 4px 0' }}>Precio Promedio: {formatPrice(data.average_price)}</p>
                        <p style={{ margin: 0 }}>Ventas: {formatNumber(data.count)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="average_price" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico 2: Análisis por Tipo de Propiedad */}
        <div 
          onClick={() => handleChartClick('property-type-analysis')}
          style={{
            backgroundColor: 'var(--surface-color)',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px var(--shadow-color)',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px var(--shadow-color)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px var(--shadow-color)';
          }}
        >
          <h3 style={{
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            fontSize: '1.2rem'
          }}>
            {getChartTitle('Volumen por Tipo de Propiedad')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData?.charts?.property_type_analysis || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="property_type" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatNumber(value), 
                  name === 'count' ? 'Cantidad de Ventas' : 'Precio Promedio'
                ]}
                labelFormatter={(label) => `Tipo: ${label}`}
              />
              <Bar dataKey="count" fill={COLORS.secondary} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico 3: Tendencias Anuales */}
        <div 
          onClick={() => handleChartClick('yearly-trends')}
          style={{
            backgroundColor: 'var(--surface-color)',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px var(--shadow-color)',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px var(--shadow-color)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px var(--shadow-color)';
          }}
        >
          <h3 style={{
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            fontSize: '1.2rem'
          }}>
            {getChartTitle('Tendencias de Precio por Año')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData?.charts?.yearly_trends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" fontSize={12} />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number) => [formatPrice(value), 'Precio Promedio']}
                labelFormatter={(label) => `Año: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="average_price" 
                stroke={COLORS.accent} 
                strokeWidth={3}
                dot={{ fill: COLORS.accent, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: COLORS.accent, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Distribución de Ratio de Venta */}
        <div 
          onClick={() => handleChartClick('sales-ratio-distribution')}
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '2rem',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          }}
        >
          <h3 style={{
            margin: '0 0 1rem 0',
            color: 'var(--text-color)',
            fontSize: '1.2rem'
          }}>
            {getChartTitle('Distribución de Ratio de Venta')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData?.charts?.sales_ratio_distribution || []}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="count"
                label={({ range, percentage }) => `${range}: ${percentage.toFixed(1)}%`}
              >
                {(dashboardData?.charts?.sales_ratio_distribution || []).map((_, index: number) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatNumber(value), 'Cantidad']}
                labelFormatter={(label) => `Rango: ${label}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico 5: Tiempo hasta Venta */}
        <div 
          onClick={() => handleChartClick('time-to-sell-distribution')}
          style={{
            backgroundColor: 'var(--surface-color)',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px var(--shadow-color)',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px var(--shadow-color)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px var(--shadow-color)';
          }}
        >
          <h3 style={{
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            fontSize: '1.2rem'
          }}>
            {getChartTitle('Distribución de Tiempo hasta Venta')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData?.charts?.time_to_sell_distribution || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="range" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value: number) => [formatNumber(value), 'Cantidad']}
                labelFormatter={(label) => `Tiempo: ${label}`}
              />
              <Bar dataKey="count" fill={COLORS.purple} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico 6: Top Ciudades por Volumen */}
        <div 
          onClick={() => handleChartClick('top-cities')}
          style={{
            backgroundColor: 'var(--surface-color)',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px var(--shadow-color)',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px var(--shadow-color)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px var(--shadow-color)';
          }}
        >
          <h3 style={{
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            fontSize: '1.2rem'
          }}>
            {getChartTitle('Top 10 Ciudades por Volumen de Ventas')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData?.charts?.top_cities_by_volume || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="town" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value: number) => [formatNumber(value), 'Ventas']}
                labelFormatter={(label) => `Ciudad: ${label}`}
              />
              <Bar dataKey="total_sales" fill={COLORS.teal} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Overlay para gráficos expandidos */}
      {expandedChart && (
        <div 
          onClick={handleOverlayClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            {/* Botón de cerrar */}
            <button
              onClick={() => setExpandedChart(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#666',
                zIndex: 1
              }}
            >
              ×
            </button>

            {/* Contenido del gráfico expandido */}
            {expandedChart === 'price-by-town' && (
              <div>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                  {getChartTitle('Precio Promedio por Ciudad')} - Vista Expandida
                </h2>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={dashboardData?.charts?.avg_price_by_town || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="town" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={14}
                    />
                    <YAxis fontSize={14} />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #ccc',
                              borderRadius: '8px',
                              padding: '12px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}>
                              <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Ciudad: {label}</p>
                              <p style={{ margin: '0 0 4px 0' }}>Precio Promedio: {formatPrice(data.average_price)}</p>
                              <p style={{ margin: 0 }}>Ventas: {formatNumber(data.count)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="average_price" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {expandedChart === 'property-type-analysis' && (
              <div>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                  {getChartTitle('Volumen por Tipo de Propiedad')} - Vista Expandida
                </h2>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={dashboardData?.charts.property_type_analysis || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="property_type" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={14}
                    />
                    <YAxis fontSize={14} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatNumber(value), 
                        name === 'count' ? 'Cantidad de Ventas' : 'Precio Promedio'
                      ]}
                      labelFormatter={(label) => `Tipo: ${label}`}
                    />
                    <Bar dataKey="count" fill={COLORS.secondary} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {expandedChart === 'yearly-trends' && (
              <div>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                  {getChartTitle('Tendencias de Precio por Año')} - Vista Expandida
                </h2>
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart data={dashboardData?.charts.yearly_trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" fontSize={14} />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      fontSize={14}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatPrice(value), 'Precio Promedio']}
                      labelFormatter={(label) => `Año: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="average_price" 
                      stroke={COLORS.accent} 
                      strokeWidth={3}
                      dot={{ fill: COLORS.accent, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: COLORS.accent, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {expandedChart === 'sales-ratio-distribution' && (
              <div>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                  {getChartTitle('Distribución de Ratio de Venta')} - Vista Expandida
                </h2>
                <ResponsiveContainer width="100%" height={500}>
                  <PieChart>
                    <Pie
                      data={dashboardData?.charts.sales_ratio_distribution || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      dataKey="count"
                      label={({ range, percentage }) => `${range}: ${percentage.toFixed(1)}%`}
                    >
                      {(dashboardData?.charts.sales_ratio_distribution || []).map((_, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [formatNumber(value), 'Cantidad']}
                      labelFormatter={(label) => `Rango: ${label}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {expandedChart === 'time-to-sell-distribution' && (
              <div>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                  {getChartTitle('Distribución de Tiempo hasta Venta')} - Vista Expandida
                </h2>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={dashboardData?.charts.time_to_sell_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="range" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={14}
                    />
                    <YAxis fontSize={14} />
                    <Tooltip 
                      formatter={(value: number) => [formatNumber(value), 'Cantidad']}
                      labelFormatter={(label) => `Tiempo: ${label}`}
                    />
                    <Bar dataKey="count" fill={COLORS.purple} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {expandedChart === 'top-cities' && (
              <div>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                  {getChartTitle('Top 10 Ciudades por Volumen de Ventas')} - Vista Expandida
                </h2>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={dashboardData?.charts.top_cities_by_volume || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="town" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={14}
                    />
                    <YAxis fontSize={14} />
                    <Tooltip 
                      formatter={(value: number) => [formatNumber(value), 'Ventas']}
                      labelFormatter={(label) => `Ciudad: ${label}`}
                    />
                    <Bar dataKey="total_sales" fill={COLORS.teal} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Agregar más casos para otros gráficos aquí */}
          </div>
        </div>
      )}

      {/* Enlace a la lista de propiedades */}
      <div style={{
        textAlign: 'center',
        marginTop: '3rem',
        padding: '2rem',
        backgroundColor: 'var(--surface-color)',
        borderRadius: '12px',
        boxShadow: '0 2px 8px var(--shadow-color)',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{
          color: 'var(--text-primary)',
          marginBottom: '1rem'
        }}>
          ¿Quieres explorar las propiedades?
        </h3>
        <Link
          to="/app"
          style={{
            backgroundColor: COLORS.primary,
            color: 'white',
            textDecoration: 'none',
            padding: '1rem 2rem',
            borderRadius: '8px',
            fontSize: '1.1rem',
            fontWeight: '500',
            display: 'inline-block'
          }}
        >
          Ver Lista de Propiedades
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;