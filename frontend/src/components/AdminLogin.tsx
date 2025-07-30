import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import './AdminLogin.css';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.login({
        username: formData.username,
        password: formData.password
      });

      if (response.success) {
        // Extraer datos de la respuesta anidada
        const userData = response.data?.user || response.user;
        const token = response.data?.token || response.token;
        
        if (!userData || !token) {
          setError('Respuesta del servidor inválida. Por favor, intenta de nuevo.');
          return;
        }
        
        // Guardar token y datos del usuario
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Verificar si es admin
        if (userData.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          setError('Acceso denegado. Solo administradores pueden acceder a este panel.');
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión. Por favor, intenta de nuevo.';
      setError(errorMessage);
      console.error('Login Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="admin-login-container">
      <div className="login-background">
        <div className="login-overlay"></div>
      </div>
      
      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <button 
              className="back-button"
              onClick={handleBackToHome}
            >
              ← Volver al Inicio
            </button>
            
            <div className="logo-section">
              <div className="admin-logo">⚙️</div>
              <h1>Panel de Administración</h1>
              <p>Accede al sistema de gestión de Urbanytics</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="username">Usuario</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Ingresa tu usuario"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Ingresa tu contraseña"
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Iniciando Sesión...
                </>
              ) : (
                <>
                  <span className="btn-icon">🔐</span>
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <div className="security-note">
              <p>
                <span className="security-icon">🔒</span>
                Conexión segura con encriptación SSL
              </p>
            </div>
          </div>
        </div>

        <div className="login-info">
          <div className="info-card">
            <div className="info-icon">📊</div>
            <h3>Gestión de Datos</h3>
            <p>
              Administra propiedades, actualiza información y 
              mantén la base de datos actualizada.
            </p>
          </div>

          <div className="info-card">
            <div className="info-icon">📈</div>
            <h3>Análisis Avanzado</h3>
            <p>
              Accede a reportes detallados y métricas 
              del rendimiento del sistema.
            </p>
          </div>

          <div className="info-card">
            <div className="info-icon">⚙️</div>
            <h3>Configuración</h3>
            <p>
              Personaliza parámetros del sistema y 
              gestiona configuraciones avanzadas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 