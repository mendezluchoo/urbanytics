import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import './AdminDashboard.css';

// Interfaces
interface Property {
  serial_number: number;
  list_year: number;
  date_recorded: string; // Agregado para coincidir con el backend
  town: string;
  address: string;
  property_type: string;
  residential_type: string;
  assessed_value: number;
  sale_amount: number; // Cambiado de sales_amount a sale_amount para coincidir con el backend
  sales_ratio: number;
  sales_date: string;
  years_until_sold: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

interface KPIs {
  total_properties: number;
  average_price: number;
  average_sales_ratio: number;
  average_years_until_sold: number;
  top_city: {
    name: string;
    count: number;
  };
  top_property_type: {
    name: string;
    count: number;
  };
}

interface Filters {
  search: string;
  town: string;
  propertyType: string;
  status: string;
  yearFrom: string;
  yearTo: string;
  priceFrom: string;
  priceTo: string;
}

// Componente principal del AdminDashboard
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados principales
  const [activeTab, setActiveTab] = useState<'properties' | 'users' | 'analytics'>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para CRUD
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Estados para filtros
  const [filters, setFilters] = useState<Filters>({
    search: '',
    town: '',
    propertyType: '',
    status: '',
    yearFrom: '',
    yearTo: '',
    priceFrom: '',
    priceTo: ''
  });
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  
  // Estados para KPIs
  const [kpis, setKpis] = useState<KPIs>({
    total_properties: 0,
    average_price: 0,
    average_sales_ratio: 0,
    average_years_until_sold: 0,
    top_city: { name: 'N/A', count: 0 },
    top_property_type: { name: 'N/A', count: 0 }
  });

  // Verificar autenticación al cargar
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      navigate('/admin/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') {
        navigate('/admin/login');
        return;
      }
    } catch {
      navigate('/admin/login');
      return;
    }

    loadInitialData();
  }, [navigate]);

  // Cargar datos iniciales
  const loadInitialData = async () => {
    try {
      setLoading(true);
      await loadProperties(); // Primero cargar propiedades
      await loadUsers(); // Luego usuarios
      // Los KPIs se calcularán automáticamente cuando las propiedades cambien
    } catch {
      setError('Error al cargar los datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  // Cargar propiedades con filtros del servidor
  const loadProperties = async (filterParams = {}) => {
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...filterParams
      };
      
      const response = await apiService.getProperties(params);
      setProperties(response.data || []);
      setFilteredProperties(response.data || []);
      
      // Actualizar información de paginación si está disponible
      if (response.pagination) {
        setTotalPages(response.pagination.total_pages || 1);
        setTotalResults(response.pagination.total_count || 0);
      }
    } catch {
      setError('Error al cargar las propiedades');
    }
  };

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      const response = await apiService.getUsers();
      
      
      // Verificar si response.data es un array
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (response.data && Array.isArray(response.data.users)) {
        setUsers(response.data.users);
      } else if (response.data && Array.isArray(response.data.data)) {
        // Estructura anidada: response.data.data
        setUsers(response.data.data);
      } else {
        console.warn('Users data is not an array:', response.data);

        setUsers([]);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      // Si falla la carga de usuarios, no mostrar error crítico
      console.warn('No se pudieron cargar los usuarios (posiblemente no hay permisos)');
      setUsers([]);
    }
  };

  // Cargar KPIs
  const loadKPIs = async () => {
    try {
      const response = await apiService.getKPIs();
      if (response.data) {

        setKpis(response.data);
      } else {
        // Calcular KPIs localmente si no hay respuesta del servidor
        console.warn('No KPIs data from server, calculating locally');
        calculateLocalKPIs();
      }
    } catch (err) {
      // Si falla, calcular KPIs localmente
      console.warn('Failed to load KPIs from server, calculating locally:', err);
      calculateLocalKPIs();
    }
  };

  // Función para calcular KPIs localmente (fallback)
  const calculateLocalKPIs = () => {
    const totalProperties = properties.length;
    const soldProperties = properties.filter(p => p.sale_amount > 0).length;
    const totalValue = properties.reduce((sum, p) => sum + (p.assessed_value || 0), 0);
    const averagePrice = totalProperties > 0 ? totalValue / totalProperties : 0;
    const salesRatio = totalProperties > 0 ? soldProperties / totalProperties : 0;

    setKpis({
      total_properties: totalProperties,
      average_price: averagePrice,
      average_sales_ratio: salesRatio,
      average_years_until_sold: 0,
      top_city: { name: 'N/A', count: 0 },
      top_property_type: { name: 'N/A', count: 0 }
    });
  };

  // Cargar KPIs al inicializar
  useEffect(() => {
    loadKPIs();
  }, []);

  // Estados para las listas de opciones
  const [cities, setCities] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);

  // Cargar listas de opciones
  const loadOptions = async () => {
    try {
      const filtersData = await apiService.getPropertyFilters();
      
      if (filtersData.success && filtersData.data) {
        setCities(filtersData.data.cities || []);
        setPropertyTypes(filtersData.data.property_types || []);
      }
    } catch (err) {
      console.error('Error loading options:', err);
    }
  };

  // Cargar opciones al inicializar
  useEffect(() => {
    loadOptions();
  }, []);

  // Aplicar filtros y recargar datos del servidor
  useEffect(() => {
    const filterParams: Record<string, string | number> = {};
    
    if (filters.search) {
      filterParams.town = filters.search;
    }
    if (filters.town) {
      filterParams.town = filters.town;
    }
    if (filters.propertyType) {
      filterParams.property_type = filters.propertyType;
    }
    if (filters.status) {
      filterParams.status = filters.status;
    }
    if (filters.yearFrom) {
      filterParams.list_year = filters.yearFrom;
    }
    if (filters.priceFrom) {
      filterParams.min_price = filters.priceFrom;
    }
    if (filters.priceTo) {
      filterParams.max_price = filters.priceTo;
    }

    loadProperties(filterParams);
    setCurrentPage(1);
  }, [filters]);



  // CRUD de propiedades
  const handleAddProperty = () => {
    setEditingProperty(null);
    setIsAdding(true);
    setIsEditing(false);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleDeleteProperty = async (serialNumber: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) {
      return;
    }

    try {
      await apiService.deleteProperty(serialNumber);
      await loadProperties();
      await loadKPIs();
    } catch {
      setError('Error al eliminar la propiedad');
    }
  };

  const handleSaveProperty = async (propertyData: Partial<Property>) => {
    try {
      
      
      if (isAdding) {
        await apiService.createProperty(propertyData);
      } else if (editingProperty) {
        await apiService.updateProperty(editingProperty.serial_number, propertyData);
      }
      
      setIsAdding(false);
      setIsEditing(false);
      setEditingProperty(null);
      setError(null); // Limpiar errores previos
      await loadProperties();
      await loadKPIs();
    } catch (err) {
      console.error('Error saving property:', err);
      setError('Error al guardar la propiedad. Verifica que todos los campos sean válidos.');
    }
  };

  // CRUD de usuarios
  const handleAddUser = () => {
    setEditingUser(null);
    setIsAdding(true);
    setIsEditing(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }

    try {
      await apiService.deleteUser(userId);
      await loadUsers();
    } catch {
      setError('Error al eliminar el usuario');
    }
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      if (isAdding) {
        await apiService.createUser(userData);
      } else if (editingUser) {
        await apiService.updateUser(editingUser.id, userData);
      }
      
      setIsAdding(false);
      setIsEditing(false);
      setEditingUser(null);
      await loadUsers();
    } catch {
      setError('Error al guardar el usuario');
    }
  };

  // Utilidades
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };



  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  // Usar propiedades directamente (ya vienen paginadas del backend)
  const currentProperties = properties;

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
      {/* Header */}
      <header className="admin-header">
        <div className="header-content">
          <div className="header-left">
            <h1>⚙️ Panel de Administración</h1>
            <p>Gestión completa del sistema Urbanytics</p>
          </div>
          
          <div className="header-right">
            <span className="user-info">
              👤 {JSON.parse(localStorage.getItem('user') || '{}').username || 'Administrador'}
            </span>
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* KPIs Dashboard */}
      <div className="kpis-section">
        <div className="kpi-card">
          <div className="kpi-icon">🏠</div>
          <div className="kpi-content">
            <h3>{(kpis.total_properties || 0).toLocaleString()}</h3>
            <p>Total Propiedades</p>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <h3>${(kpis.average_price || 0).toLocaleString()}</h3>
            <p>Precio Promedio</p>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <h3>{formatPercentage(kpis.average_sales_ratio || 0)}</h3>
            <p>Ratio de Ventas</p>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon">⏱️</div>
          <div className="kpi-content">
            <h3>{(kpis.average_years_until_sold || 0).toFixed(1)}</h3>
            <p>Años hasta Venta</p>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon">🏙️</div>
          <div className="kpi-content">
            <h3>{kpis.top_city?.name || 'N/A'}</h3>
            <p>Ciudad Top</p>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon">📈</div>
          <div className="kpi-content">
            <h3>{kpis.top_property_type?.name || 'N/A'}</h3>
            <p>Tipo Top</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          🏠 Propiedades
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Usuarios
        </button>

      </div>

      {/* Content Area */}
      <div className="admin-content">
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div className="tab-content">
            {/* Filters */}
            <div className="filters-section">
              <div className="filter-row">
                <input
                  type="text"
                  placeholder="🔍 Buscar por dirección, ciudad o número..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="filter-input"
                />
                
                <select 
                  value={filters.town}
                  onChange={(e) => setFilters({...filters, town: e.target.value})}
                  className="filter-select"
                >
                  <option value="">Todas las ciudades</option>
                  {cities.map(town => (
                    <option key={town} value={town}>{town}</option>
                  ))}
                </select>
                
                <select 
                  value={filters.propertyType}
                  onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
                  className="filter-select"
                >
                  <option value="">Todos los tipos</option>
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="filter-select"
                >
                  <option value="">Todos los estados</option>
                  <option value="sold">Vendidas</option>
                  <option value="available">Disponibles</option>
                </select>
              </div>
              
              <div className="filter-row">
                <input
                  type="number"
                  placeholder="Año desde"
                  value={filters.yearFrom}
                  onChange={(e) => setFilters({...filters, yearFrom: e.target.value})}
                  className="filter-input"
                />
                
                <input
                  type="number"
                  placeholder="Año hasta"
                  value={filters.yearTo}
                  onChange={(e) => setFilters({...filters, yearTo: e.target.value})}
                  className="filter-input"
                />
                
                <input
                  type="number"
                  placeholder="Precio desde"
                  value={filters.priceFrom}
                  onChange={(e) => setFilters({...filters, priceFrom: e.target.value})}
                  className="filter-input"
                />
                
                <input
                  type="number"
                  placeholder="Precio hasta"
                  value={filters.priceTo}
                  onChange={(e) => setFilters({...filters, priceTo: e.target.value})}
                  className="filter-input"
                />
                
                <button 
                  onClick={() => setFilters({
                    search: '', town: '', propertyType: '', status: '',
                    yearFrom: '', yearTo: '', priceFrom: '', priceTo: ''
                  })}
                  className="clear-filters-btn"
                >
                  🗑️ Limpiar Filtros
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="actions-section">
              <button className="action-btn primary" onClick={handleAddProperty}>
                ➕ Agregar Propiedad
              </button>
              <button className="action-btn secondary" onClick={loadProperties}>
                🔄 Actualizar
              </button>
              <span className="results-count">
                Mostrando {currentProperties.length} de {totalResults || filteredProperties.length} propiedades
                {totalResults > 0 && (
                  <span style={{ color: '#4CAF50', fontSize: '0.9rem', marginLeft: '10px' }}>
                    ✅ Filtrado del servidor activo - resultados de toda la base de datos
                  </span>
                )}
              </span>
            </div>

            {/* Properties Table */}
            <div className="table-container">
              <table className="data-table">
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
                  {currentProperties.map((property) => (
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
                        {property.sale_amount > 0 
                          ? formatPrice(property.sale_amount)
                          : 'No vendida'
                        }
                      </td>
                      <td>
                        <span className={`status-badge ${property.sale_amount > 0 ? 'sold' : 'available'}`}>
                          {property.sale_amount > 0 ? 'Vendida' : 'Disponible'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn small edit"
                            onClick={() => handleEditProperty(property)}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ← Anterior
                </button>
                
                <span className="pagination-info">
                  Página {currentPage} de {totalPages}
                </span>
                
                <button 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="tab-content">
            <div className="actions-section">
              <button className="action-btn primary" onClick={handleAddUser}>
                ➕ Agregar Usuario
              </button>
              <button className="action-btn secondary" onClick={loadUsers}>
                🔄 Actualizar
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Fecha Creación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(users) && users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn small edit"
                            onClick={() => handleEditUser(user)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button 
                            className="action-btn small delete"
                            onClick={() => handleDeleteUser(user.id)}
                            title="Eliminar"
                            disabled={user.role === 'admin'}
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
          </div>
        )}


      </div>

      {/* Modals */}
      {(isEditing || isAdding) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {activeTab === 'properties' 
                  ? (isAdding ? '➕ Agregar Propiedad' : '✏️ Editar Propiedad')
                  : (isAdding ? '➕ Agregar Usuario' : '✏️ Editar Usuario')
                }
              </h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setIsEditing(false);
                  setIsAdding(false);
                  setEditingProperty(null);
                  setEditingUser(null);
                }}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              {activeTab === 'properties' ? (
                <PropertyForm 
                  property={editingProperty}
                  onSave={handleSaveProperty}
                  onCancel={() => {
                    setIsEditing(false);
                    setIsAdding(false);
                    setEditingProperty(null);
                  }}
                />
              ) : (
                <UserForm 
                  user={editingUser}
                  onSave={handleSaveUser}
                  onCancel={() => {
                    setIsEditing(false);
                    setIsAdding(false);
                    setEditingUser(null);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de formulario para propiedades
const PropertyForm: React.FC<{
  property: Property | null;
  onSave: (data: Partial<Property>) => void;
  onCancel: () => void;
}> = ({ property, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    serial_number: property?.serial_number || 0,
    list_year: property?.list_year || new Date().getFullYear(),
    date_recorded: property?.date_recorded || new Date().toISOString().split('T')[0],
    town: property?.town || '',
    address: property?.address || '',
    property_type: property?.property_type || '',
    residential_type: property?.residential_type || '',
    assessed_value: property?.assessed_value || '',
    sale_amount: property?.sale_amount || '',
    sales_ratio: property?.sales_ratio || '',
    years_until_sold: property?.years_until_sold || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convertir valores numéricos
    const processedData = {
      ...formData,
      serial_number: parseInt(formData.serial_number.toString()) || 0,
      list_year: parseInt(formData.list_year.toString()) || new Date().getFullYear(),
      assessed_value: parseFloat(formData.assessed_value.toString()) || 0,
      sale_amount: parseFloat(formData.sale_amount.toString()) || 0,
      sales_ratio: parseFloat(formData.sales_ratio.toString()) || 0,
      years_until_sold: parseInt(formData.years_until_sold.toString()) || 0
    };
    
    onSave(processedData);
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-row">
        <div className="form-group">
          <label>Número de Serie</label>
          <input
            type="number"
            value={formData.serial_number}
            onChange={(e) => setFormData({...formData, serial_number: parseInt(e.target.value) || 0})}
            required
          />
        </div>
        <div className="form-group">
          <label>Año</label>
          <input
            type="number"
            value={formData.list_year}
            onChange={(e) => setFormData({...formData, list_year: parseInt(e.target.value)})}
            required
          />
        </div>
        <div className="form-group">
          <label>Fecha Registrada</label>
          <input
            type="date"
            value={formData.date_recorded}
            onChange={(e) => setFormData({...formData, date_recorded: e.target.value})}
            required
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>Ciudad</label>
          <input
            type="text"
            value={formData.town}
            onChange={(e) => setFormData({...formData, town: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>Dirección</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            required
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>Tipo de Propiedad</label>
          <select
            value={formData.property_type}
            onChange={(e) => setFormData({...formData, property_type: e.target.value})}
            required
          >
            <option value="">Seleccionar tipo</option>
            <option value="Residential">Residencial</option>
            <option value="Commercial">Comercial</option>
            <option value="Industrial">Industrial</option>
          </select>
        </div>
        <div className="form-group">
          <label>Tipo Residencial</label>
          <select
            value={formData.residential_type}
            onChange={(e) => setFormData({...formData, residential_type: e.target.value})}
          >
            <option value="">Seleccionar tipo</option>
            <option value="Single Family">Casa Familiar</option>
            <option value="Multi Family">Multi Familiar</option>
            <option value="Condo">Condominio</option>
          </select>
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>Valor Tasado</label>
          <input
            type="number"
            value={formData.assessed_value}
            onChange={(e) => setFormData({...formData, assessed_value: parseFloat(e.target.value)})}
            required
          />
        </div>
        <div className="form-group">
          <label>Precio de Venta</label>
          <input
            type="number"
            value={formData.sale_amount}
            onChange={(e) => setFormData({...formData, sale_amount: parseFloat(e.target.value)})}
          />
        </div>
      </div>
      
      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" className="btn-primary">
          {property ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
};

// Componente de formulario para usuarios
const UserForm: React.FC<{
  user: User | null;
  onSave: (data: Partial<User>) => void;
  onCancel: () => void;
}> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || 'user',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label>Usuario</label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Rol</label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({...formData, role: e.target.value})}
          required
        >
          <option value="user">Usuario</option>
          <option value="admin">Administrador</option>
        </select>
      </div>
      
      {!user && (
        <div className="form-group">
          <label>Contraseña</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required={!user}
            minLength={6}
          />
        </div>
      )}
      
      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" className="btn-primary">
          {user ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
};

export default AdminDashboard; 