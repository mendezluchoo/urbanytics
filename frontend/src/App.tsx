import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PropertyList from './components/PropertyList';
import PropertyDetail from './components/PropertyDetail';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import LandingPage from './components/LandingPage';
import MachineLearning from './components/MachineLearning';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

// Componente principal de la aplicación con navegación y rutas
function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal - Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Ruta directa para propiedades (para compatibilidad) */}
        <Route path="/properties/:id" element={<PropertyDetail />} />
        
        {/* Rutas con navegación */}
        <Route path="/app/*" element={
          <>
            <Navigation />
            <main style={{
              minHeight: 'calc(100vh - 80px)',
              padding: '2rem 0',
              backgroundColor: 'var(--background-color)'
            }}>
              <Routes>
                {/* Ruta principal - Lista de propiedades */}
                <Route path="/" element={<PropertyList />} />
                
                {/* Ruta para detalles de una propiedad específica */}
                <Route path="/properties/:id" element={<PropertyDetail />} />
                
                {/* Ruta para el dashboard de analíticas */}
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Ruta para Machine Learning */}
                <Route path="/machine-learning" element={<MachineLearning />} />
              </Routes>
            </main>
          </>
        } />
        
        {/* Rutas de administración */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;