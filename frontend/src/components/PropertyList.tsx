// src/components/PropertyList.tsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';

// Tipos de datos para las propiedades
type Property = {
  serial_number: number;
  list_year: number;
  date_recorded: string;
  town: string;
  address: string;
  assessed_value: number;
  sale_amount: number;
  sales_ratio: number;
  property_type: string;
  residential_type: string;
  years_until_sold: number;
};

// Componente principal de lista de propiedades con diseño minimalista
function PropertyList() {
  // Estados para manejar los datos y la UI
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Estados para los filtros de búsqueda
  const [filters, setFilters] = useState({
    town: '',
    min_price: '',
    max_price: '',
    property_type: '',
    residential_type: '',
    list_year: '',
    min_sales_ratio: '',
    max_sales_ratio: '',
    min_years_until_sold: '',
    max_years_until_sold: ''
  });

  // Estados para las opciones de filtros
  const [cities, setCities] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [residentialTypes, setResidentialTypes] = useState<string[]>([]);
  const [listYears, setListYears] = useState<number[]>([]);

  // Estado para mostrar/ocultar filtros en móvil
  const [showFilters, setShowFilters] = useState(false);

  // Estado para ordenamiento
  const [sortBy, setSortBy] = useState<string>('serial_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Cargar filtros disponibles desde el BFF
  const loadFilters = async () => {
    try {
      const filtersData = await apiService.getPropertyFilters();
      setCities(filtersData.data.cities || []);
      setPropertyTypes(filtersData.data.property_types || []);
      setResidentialTypes(filtersData.data.residential_types || []);
      setListYears(filtersData.data.list_years || []);
    } catch (err) {
      console.error('Error cargando filtros:', err);
    }
  };

  // Cargar propiedades desde el BFF
  const fetchProperties = useCallback(async (page: number = 1, searchFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      // Construir parámetros de consulta con mapeo correcto
      const params = {
        page,
        limit: 12,
        sort_by: sortBy,
        sort_order: sortOrder,
        town: searchFilters.town,
        min_price: searchFilters.min_price,
        max_price: searchFilters.max_price,
        property_type: searchFilters.property_type,
        residential_type: searchFilters.residential_type,
        list_year: searchFilters.list_year,
        min_sales_ratio: searchFilters.min_sales_ratio,
        max_sales_ratio: searchFilters.max_sales_ratio,
        min_years_until_sold: searchFilters.min_years_until_sold,
        max_years_until_sold: searchFilters.max_years_until_sold
      };
      // Limpiar parámetros vacíos
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] === '') {
          delete params[key as keyof typeof params];
        }
      });
      const result = await apiService.getProperties(params);
      setProperties(result.data);
      setTotalPages(result.pagination.total_pages);
      setTotalCount(result.pagination.total_count);
    } catch (err) {
      setError('Error al cargar las propiedades. Por favor, intenta de nuevo.');
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadFilters();
    fetchProperties(currentPage, filters);
  }, [currentPage, filters, fetchProperties]);

  // Función para manejar cambios en los filtros
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'property_type' && value !== 'Residential') {
      setFilters(prev => ({
        ...prev,
        [name]: value,
        residential_type: ''
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Función para aplicar filtros
  const handleSearch = () => {
    setCurrentPage(1);
    fetchProperties(1, filters);
  };

  // Función para limpiar filtros
  const handleClearFilters = () => {
    const clearedFilters = {
      town: '',
      min_price: '',
      max_price: '',
      property_type: '',
      residential_type: '',
      list_year: '',
      min_sales_ratio: '',
      max_sales_ratio: '',
      min_years_until_sold: '',
      max_years_until_sold: ''
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    fetchProperties(1, clearedFilters);
  };

  // Función para formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

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
          <p style={{ color: 'var(--text-secondary)' }}>Cargando propiedades...</p>
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
            onClick={() => fetchProperties(currentPage, filters)}
            style={{
              backgroundColor: 'var(--primary-color)',
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
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header de la página */}
      <div style={{
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '0.5rem'
        }}>
          Propiedades Disponibles
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1.1rem'
        }}>
          Explora nuestra colección de propiedades inmobiliarias
        </p>
      </div>

      {/* Sección de filtros */}
      <div style={{
        backgroundColor: 'var(--surface-color)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 2px 8px var(--shadow-color)'
      }}>
        {/* Botón para mostrar/ocultar filtros en móvil */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: 'none',
            width: '100%',
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            cursor: 'pointer'
          }}
        >
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>

        {/* Contenedor de filtros */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          alignItems: 'end'
        }}>
          {/* Filtro por ciudad */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)',
              fontWeight: '500'
            }}>
              Ciudad
            </label>
            <select
              name="town"
              value={filters.town}
              onChange={handleFilterChange}
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
              <option value="">Todas las ciudades</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por tipo de propiedad */}
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
              name="property_type"
              value={filters.property_type}
              onChange={handleFilterChange}
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

          {/* Filtro por precio mínimo */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)',
              fontWeight: '500'
            }}>
              Precio Mínimo
            </label>
            <input
              type="number"
              name="min_price"
              value={filters.min_price}
              onChange={handleFilterChange}
              placeholder="Precio mínimo..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Filtro por precio máximo */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)',
              fontWeight: '500'
            }}>
              Precio Máximo
            </label>
            <input
              type="number"
              name="max_price"
              value={filters.max_price}
              onChange={handleFilterChange}
              placeholder="Precio máximo..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Filtro por tipo residencial - Solo visible cuando se selecciona "Residential" */}
          {filters.property_type === 'Residential' && (
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'var(--text-primary)',
                fontWeight: '500'
              }}>
                Tipo Residencial
              </label>
              <select
                name="residential_type"
                value={filters.residential_type}
                onChange={handleFilterChange}
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
                <option value="">Todos los tipos residenciales</option>
                {residentialTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro por año de listado */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)',
              fontWeight: '500'
            }}>
              Año de Listado
            </label>
            <select
              name="list_year"
              value={filters.list_year}
              onChange={handleFilterChange}
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
              <option value="">Todos los años</option>
              {listYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por ratio de venta mínimo */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)',
              fontWeight: '500'
            }}>
              Ratio de Venta Mínimo
            </label>
            <input
              type="number"
              name="min_sales_ratio"
              value={filters.min_sales_ratio}
              onChange={handleFilterChange}
              placeholder="Ratio mínimo..."
              step="0.01"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Filtro por ratio de venta máximo */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)',
              fontWeight: '500'
            }}>
              Ratio de Venta Máximo
            </label>
            <input
              type="number"
              name="max_sales_ratio"
              value={filters.max_sales_ratio}
              onChange={handleFilterChange}
              placeholder="Ratio máximo..."
              step="0.01"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Filtro por años hasta venta mínimo */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)',
              fontWeight: '500'
            }}>
              Años hasta Venta Mínimo
            </label>
            <input
              type="number"
              name="min_years_until_sold"
              value={filters.min_years_until_sold}
              onChange={handleFilterChange}
              placeholder="Años mínimo..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Filtro por años hasta venta máximo */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)',
              fontWeight: '500'
            }}>
              Años hasta Venta Máximo
            </label>
            <input
              type="number"
              name="max_years_until_sold"
              value={filters.max_years_until_sold}
              onChange={handleFilterChange}
              placeholder="Años máximo..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Botones de acción */}
          <div style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            <button
              onClick={handleSearch}
              style={{
                flex: 1,
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
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
              🔍 Buscar
            </button>
            <button
              onClick={handleClearFilters}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                e.currentTarget.style.backgroundColor = 'var(--surface-color)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Información de resultados y ordenamiento */}
      {properties.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{
            color: 'var(--text-secondary)',
            fontSize: '0.9rem'
          }}>
            Mostrando {properties.length} de {totalCount} propiedades
          </div>
          
          {/* Selector de ordenamiento */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <label style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Ordenar por:
            </label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
                setCurrentPage(1);
                fetchProperties(1);
              }}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            >
              <option value="sale_amount-desc">Precio: Mayor a menor</option>
              <option value="sale_amount-asc">Precio: Menor a mayor</option>
              <option value="list_year-desc">Año: Más reciente</option>
              <option value="list_year-asc">Año: Más antiguo</option>
              <option value="sales_ratio-desc">Ratio: Mayor a menor</option>
              <option value="sales_ratio-asc">Ratio: Menor a mayor</option>
              <option value="years_until_sold-asc">Tiempo venta: Menor a mayor</option>
              <option value="years_until_sold-desc">Tiempo venta: Mayor a menor</option>
              <option value="town-asc">Ciudad: A-Z</option>
              <option value="town-desc">Ciudad: Z-A</option>
            </select>
          </div>
        </div>
      )}

      {/* Grid de propiedades */}
      {properties.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          backgroundColor: 'var(--surface-color)',
          borderRadius: '12px',
          boxShadow: '0 2px 8px var(--shadow-color)'
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            No se encontraron propiedades con los filtros aplicados.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {properties.map((property) => (
            <Link
              key={property.serial_number}
              to={`/properties/${property.serial_number}`}
              style={{
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <div style={{
                backgroundColor: 'var(--surface-color)',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 2px 8px var(--shadow-color)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer',
                border: '1px solid var(--border-color)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px var(--shadow-color)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px var(--shadow-color)';
              }}
              >
                {/* Header de la tarjeta */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    #{property.serial_number}
                  </h3>
                  <span style={{
                    backgroundColor: 'var(--accent-color)',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    {property.property_type}
                  </span>
                </div>

                {/* Información de la propiedad */}
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem'
                  }}>
                    📍 {property.town}
                  </p>
                  <p style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: 'var(--primary-color)',
                    margin: 0,
                    marginBottom: '0.5rem'
                  }}>
                    {formatPrice(property.sale_amount)}
                  </p>
                  
                  {/* Información adicional */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <div>
                      <strong>Año:</strong> {property.list_year}
                    </div>
                    <div>
                      <strong>Ratio:</strong> {property.sales_ratio.toFixed(2)}
                    </div>
                    <div>
                      <strong>Tipo:</strong> {property.residential_type || 'N/A'}
                    </div>
                    <div>
                      <strong>Años hasta venta:</strong> {property.years_until_sold}
                    </div>
                  </div>
                </div>

                {/* Botón de ver detalles */}
                <div style={{
                  textAlign: 'center',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <span style={{
                    color: 'var(--primary-color)',
                    fontWeight: '500',
                    fontSize: '0.9rem'
                  }}>
                    Ver detalles →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid var(--border-color)',
              backgroundColor: currentPage === 1 ? 'var(--background-color)' : 'var(--surface-color)',
              color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
              borderRadius: '8px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              transition: currentPage === 1 ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: currentPage === 1 ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== 1) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== 1) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }
            }}
          >
            Anterior
          </button>
          
          <span style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontWeight: '500'
          }}>
            Página {currentPage} de {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid var(--border-color)',
              backgroundColor: currentPage === totalPages ? 'var(--background-color)' : 'var(--surface-color)',
              color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
              borderRadius: '8px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              transition: currentPage === totalPages ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: currentPage === totalPages ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== totalPages) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== totalPages) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }
            }}
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Estilos CSS para animaciones */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .container > div:first-child h1 {
            font-size: 2rem;
          }
          
          .container > div:first-child p {
            font-size: 1rem;
          }
          
          .container > div:nth-child(2) > div {
            grid-template-columns: 1fr;
          }
          
          .container > div:nth-child(2) > div > div:last-child {
            grid-column: 1 / -1;
          }
          
          .container > div:nth-child(3) {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default PropertyList;