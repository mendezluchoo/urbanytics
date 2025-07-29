import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Animación de entrada
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClientContinue = () => {
    navigate('/app/dashboard');
  };

  const handleAdminContinue = () => {
    navigate('/admin/login');
  };

  return (
    <div className={`landing-page ${isLoaded ? 'loaded' : ''}`}>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-overlay"></div>
        </div>
        
        <div className="hero-content">
          <div className="logo-container">
            <h1 className="main-title">
              <span className="title-urbanytics">Urbanytics</span>
            </h1>
            <p className="hero-subtitle">
              Análisis Inteligente del Mercado Inmobiliario
            </p>
          </div>

          <div className="hero-description">
            <p>
              Descubre insights valiosos sobre el mercado inmobiliario con nuestra 
              plataforma de análisis avanzado. Visualiza tendencias, compara precios 
              y toma decisiones informadas con datos reales.
            </p>
          </div>

          <div className="cta-buttons">
            <button 
              className="cta-button client-btn"
              onClick={handleClientContinue}
            >
              <span className="btn-icon">👤</span>
              Continuar como Cliente
            </button>
            
            <button 
              className="cta-button admin-btn"
              onClick={handleAdminContinue}
            >
              <span className="btn-icon">⚙️</span>
              Continuar como Administrador
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">¿Por qué elegir Urbanytics?</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Dashboard Analítico</h3>
              <p>
                Visualiza KPIs clave y tendencias del mercado con gráficos 
                interactivos y datos en tiempo real.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Búsqueda Avanzada</h3>
              <p>
                Encuentra propiedades con filtros inteligentes por ubicación, 
                precio, tipo y características específicas.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>Machine Learning</h3>
              <p>
                Tasación automática de propiedades usando algoritmos de 
                inteligencia artificial avanzados.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Interfaz Moderna</h3>
              <p>
                Diseño responsive y intuitivo que funciona perfectamente 
                en cualquier dispositivo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">20+</div>
              <div className="stat-label">Años de Datos</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Propiedades</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-number">95%</div>
              <div className="stat-label">Precisión ML</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Disponibilidad</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>Acerca de Urbanytics</h2>
              <p>
                Urbanytics es una plataforma revolucionaria que combina el poder 
                del análisis de datos con la inteligencia artificial para 
                transformar la forma en que entendemos el mercado inmobiliario.
              </p>
              <p>
                Nuestro sistema procesa millones de datos históricos para 
                proporcionar insights precisos y predicciones confiables, 
                ayudando a inversores, agentes inmobiliarios y compradores 
                a tomar decisiones informadas.
              </p>
            </div>
            
            <div className="about-image">
              <div className="image-placeholder">
                <span className="placeholder-text">🏙️</span>
                <p>Análisis de Mercado Urbano</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Urbanytics</h4>
              <p>Análisis inteligente del mercado inmobiliario</p>
            </div>
            
            <div className="footer-section">
              <h4>Funcionalidades</h4>
              <ul>
                <li>Dashboard Analítico</li>
                <li>Búsqueda de Propiedades</li>
                <li>Machine Learning</li>
                <li>Reportes Avanzados</li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Contacto</h4>
              <ul>
                <li>📧 info@urbanytics.com</li>
                <li>📞 +1 (555) 123-4567</li>
                <li>📍 Ciudad, País</li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2024 Urbanytics. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 