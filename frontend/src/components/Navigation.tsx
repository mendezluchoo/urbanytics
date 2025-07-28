import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

// Componente de navegación minimalista con diseño responsive
const Navigation = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Función para verificar si una ruta está activa
  const isActive = (path: string) => location.pathname === path;

  // Función para alternar el menú móvil
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav style={{
      backgroundColor: 'var(--surface-color)',
      boxShadow: '0 2px 8px var(--shadow-color)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      padding: '1rem 0'
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo/Brand */}
          <Link to="/" style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: 'var(--primary-color)',
            textDecoration: 'none'
          }}>
            🏠 Urbanytics
          </Link>

          {/* Botón de menú móvil */}
          <button
            onClick={toggleMenu}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>

          {/* Enlaces de navegación */}
          <div style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center'
          }}>
            <Link
              to="/"
              style={{
                color: isActive('/') ? 'var(--primary-color)' : 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: isActive('/') ? '600' : '400',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                backgroundColor: isActive('/') ? 'rgba(124, 152, 133, 0.1)' : 'transparent'
              }}
            >
              Propiedades
            </Link>
            <Link
              to="/dashboard"
              style={{
                color: isActive('/dashboard') ? 'var(--primary-color)' : 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: isActive('/dashboard') ? '600' : '400',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                backgroundColor: isActive('/dashboard') ? 'rgba(124, 152, 133, 0.1)' : 'transparent'
              }}
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Menú móvil */}
        <div style={{
          display: isMenuOpen ? 'flex' : 'none',
          flexDirection: 'column',
          gap: '1rem',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-color)'
        }}>
          <Link
            to="/"
            onClick={() => setIsMenuOpen(false)}
            style={{
              color: isActive('/') ? 'var(--primary-color)' : 'var(--text-secondary)',
              textDecoration: 'none',
              fontWeight: isActive('/') ? '600' : '400',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              backgroundColor: isActive('/') ? 'rgba(124, 152, 133, 0.1)' : 'transparent'
            }}
          >
            Propiedades
          </Link>
          <Link
            to="/dashboard"
            onClick={() => setIsMenuOpen(false)}
            style={{
              color: isActive('/dashboard') ? 'var(--primary-color)' : 'var(--text-secondary)',
              textDecoration: 'none',
              fontWeight: isActive('/dashboard') ? '600' : '400',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              backgroundColor: isActive('/dashboard') ? 'rgba(124, 152, 133, 0.1)' : 'transparent'
            }}
          >
            Dashboard
          </Link>
        </div>
      </div>

      {/* Media queries para responsive design */}
      <style>{`
        @media (max-width: 768px) {
          nav > div > div:last-child {
            display: none;
          }
          
          button[aria-label="Toggle menu"] {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navigation; 