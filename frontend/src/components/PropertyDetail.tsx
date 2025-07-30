import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
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

// Componente de detalle de propiedad con diseño minimalista
function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener los detalles de la propiedad desde el BFF
  const fetchProperty = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.getPropertyById(id!);
      setProperty(result.data);
    } catch (err) {
      setError('No se pudo cargar la propiedad. Verifica que el ID sea correcto.');
      console.error('Error fetching property:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Efecto para cargar los datos cuando cambia el ID
  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id, fetchProperty]);

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
          <p style={{ color: 'var(--text-secondary)' }}>Cargando detalles de la propiedad...</p>
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
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={fetchProperty}
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
            <Link
              to="/"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                textDecoration: 'none',
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
              Volver al listado
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay propiedad, mostrar mensaje
  if (!property) {
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
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Propiedad no encontrada</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            La propiedad que buscas no existe o ha sido eliminada.
          </p>
          <Link
            to="/app"
            style={{
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              textDecoration: 'none',
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
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Botón de regreso */}
      <div style={{ marginBottom: '2rem' }}>
        <Link
          to="/app"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '1rem',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          ← Volver al listado
        </Link>
      </div>

      {/* Contenedor principal de detalles */}
      <div style={{
        backgroundColor: 'var(--surface-color)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 20px var(--shadow-color)',
        border: '1px solid var(--border-color)'
      }}>
        {/* Header con número de serie y tipo */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: '0.5rem'
            }}>
              Propiedad #{property.serial_number}
            </h1>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1.1rem',
              margin: 0
            }}>
              Detalles completos de la propiedad
            </p>
          </div>
          
          <span style={{
            backgroundColor: 'var(--accent-color)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '25px',
            fontSize: '1rem',
            fontWeight: '600',
            whiteSpace: 'nowrap'
          }}>
            {property.property_type}
          </span>
        </div>

        {/* Grid de información completa */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Información básica */}
          <div style={{
            backgroundColor: 'var(--background-color)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{
              margin: 0,
              marginBottom: '1rem',
              color: 'var(--text-primary)',
              fontSize: '1.1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📋 Información Básica
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <strong>Dirección:</strong> {property.address}
              </div>
              <div>
                <strong>Ciudad:</strong> {property.town}
              </div>
              <div>
                <strong>Año de listado:</strong> {property.list_year}
              </div>
              <div>
                <strong>Fecha de venta:</strong> {new Date(property.date_recorded).toLocaleDateString('es-ES')}
              </div>
            </div>
          </div>

          {/* Información financiera */}
          <div style={{
            backgroundColor: 'var(--background-color)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{
              margin: 0,
              marginBottom: '1rem',
              color: 'var(--text-primary)',
              fontSize: '1.1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              💰 Información Financiera
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <strong>Precio de venta:</strong> {formatPrice(property.sale_amount)}
              </div>
              <div>
                <strong>Valor tasado:</strong> {formatPrice(property.assessed_value)}
              </div>
              <div>
                <strong>Ratio de venta:</strong> {property.sales_ratio.toFixed(2)}
              </div>
              <div>
                <strong>Años hasta venta:</strong> {property.years_until_sold} años
              </div>
            </div>
          </div>

          {/* Información de la propiedad */}
          <div style={{
            backgroundColor: 'var(--background-color)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{
              margin: 0,
              marginBottom: '1rem',
              color: 'var(--text-primary)',
              fontSize: '1.1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🏠 Información de la Propiedad
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <strong>Tipo de propiedad:</strong> {property.property_type}
              </div>
              <div>
                <strong>Tipo residencial:</strong> {property.residential_type}
              </div>
              <div>
                <strong>Número de serie:</strong> {property.serial_number}
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div style={{
          backgroundColor: 'var(--background-color)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{
            margin: 0,
            marginBottom: '1rem',
            color: 'var(--text-primary)',
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>
            Información Adicional
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <p style={{
                margin: 0,
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                Número de Serie
              </p>
              <p style={{
                margin: 0,
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontWeight: '600'
              }}>
                {property.serial_number}
              </p>
            </div>
            <div>
              <p style={{
                margin: 0,
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                Estado
              </p>
              <p style={{
                margin: 0,
                color: 'var(--success-color)',
                fontSize: '1rem',
                fontWeight: '600'
              }}>
                Disponible
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '2rem',
          flexWrap: 'wrap'
        }}>
          <Link
            to="/app"
            style={{
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              textAlign: 'center',
              flex: '1',
              minWidth: '200px',
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
            Ver más propiedades
          </Link>
          <Link
            to="/app/dashboard"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              padding: '1rem 2rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              textAlign: 'center',
              flex: '1',
              minWidth: '200px',
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
            Ver Dashboard
          </Link>
        </div>
      </div>

      {/* Estilos CSS para animaciones */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .container > div:nth-child(2) > div:first-child {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .container > div:nth-child(2) > div:first-child h1 {
            font-size: 2rem;
          }
          
          .container > div:nth-child(2) > div:nth-child(2) {
            grid-template-columns: 1fr;
          }
          
          .container > div:nth-child(2) > div:last-child {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default PropertyDetail;