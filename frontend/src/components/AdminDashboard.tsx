import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import './AdminDashboard.css';

interface Property {
  serial_number: string;
  list_year: number;
  town: string;
  address: string;
  property_type: string;
  residential_type: string;
  assessed_value: number;
  sales_amount: number;
  sales_ratio: number;
  sales_date: string;
  years_until_sold: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    loadProperties();
  }, [navigate]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProperties({ page: 1, limit: 50 });
      setProperties(response.data || []);
    } catch (err) {
      setError('Error al cargar las propiedades');
      console.error('Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const handleEditProperty = () => {
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleAddProperty = () => {
    setIsAdding(true);
    setIsEditing(false);
  };

  const handleDeleteProperty = async (serialNumber: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) {
      return;
    }

    try {
      // Simular eliminación (por ahora)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProperties(prev => prev.filter(p => p.serial_number !== serialNumber));
      alert('Propiedad eliminada exitosamente');
    } catch (err) {
      setError('Error al eliminar la propiedad');
      console.error('Error deleting property:', err);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };



  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Cargando panel de administración...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-content">
          <div className="header-left">
            <h1>⚙️ Panel de Administración</h1>
            <p>Gestión de propiedades y datos del sistema</p>
          </div>
          
          <div className="header-right">
            <span className="user-info">
              👤 {localStorage.getItem('adminUser') || 'Administrador'}
            </span>
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-sidebar">
          <div className="sidebar-section">
            <h3>📊 Estadísticas</h3>
            <div className="stats-card">
              <div className="stat-item">
                <span className="stat-number">{properties.length}</span>
                <span className="stat-label">Propiedades</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {properties.filter(p => p.sales_amount > 0).length}
                </span>
                <span className="stat-label">Vendidas</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {properties.filter(p => p.sales_amount === 0).length}
                </span>
                <span className="stat-label">Disponibles</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>🔧 Acciones</h3>
            <button 
              className="action-btn primary"
              onClick={handleAddProperty}
            >
              ➕ Agregar Propiedad
            </button>
            <button 
              className="action-btn secondary"
              onClick={loadProperties}
            >
              🔄 Actualizar Lista
            </button>
          </div>

          <div className="sidebar-section">
            <h3>📋 Filtros Rápidos</h3>
            <button className="filter-btn">🏠 Residencial</button>
            <button className="filter-btn">🏢 Comercial</button>
            <button className="filter-btn">💰 Vendidas</button>
            <button className="filter-btn">⏳ Disponibles</button>
          </div>
        </div>

        <div className="admin-main">
          <div className="main-header">
            <h2>📋 Lista de Propiedades</h2>
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
          </div>

          <div className="properties-table-container">
            <table className="properties-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Año</th>
                  <th>Ciudad</th>
                  <th>Dirección</th>
                  <th>Tipo</th>
                  <th>Valor Tasado</th>
                  <th>Precio Venta</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.serial_number}>
                    <td>{property.serial_number}</td>
                    <td>{property.list_year}</td>
                    <td>{property.town}</td>
                    <td>{property.address}</td>
                    <td>
                      <span className="property-type">
                        {property.property_type}
                      </span>
                    </td>
                    <td>{formatPrice(property.assessed_value)}</td>
                    <td>
                      {property.sales_amount > 0 
                        ? formatPrice(property.sales_amount)
                        : 'No vendida'
                      }
                    </td>
                    <td>
                      <span className={`status-badge ${property.sales_amount > 0 ? 'sold' : 'available'}`}>
                        {property.sales_amount > 0 ? 'Vendida' : 'Disponible'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn small edit"
                          onClick={handleEditProperty}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn small delete"
                          onClick={() => handleDeleteProperty(property.serial_number)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {properties.length === 0 && !loading && (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No hay propiedades</h3>
              <p>Comienza agregando una nueva propiedad al sistema</p>
              <button 
                className="action-btn primary"
                onClick={handleAddProperty}
              >
                ➕ Agregar Primera Propiedad
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal para editar/agregar propiedad */}
      {(isEditing || isAdding) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{isAdding ? '➕ Agregar Propiedad' : '✏️ Editar Propiedad'}</h3>
                             <button 
                 className="modal-close"
                 onClick={() => {
                   setIsEditing(false);
                   setIsAdding(false);
                 }}
               >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <p>Formulario de propiedad (implementación pendiente)</p>
              <p>Esta funcionalidad se implementará en la siguiente fase.</p>
            </div>
            
            <div className="modal-footer">
                             <button 
                 className="action-btn secondary"
                 onClick={() => {
                   setIsEditing(false);
                   setIsAdding(false);
                 }}
               >
                Cancelar
              </button>
              <button className="action-btn primary">
                {isAdding ? 'Agregar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 