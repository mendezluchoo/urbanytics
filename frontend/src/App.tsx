import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PropertyList from './components/PropertyList';
import PropertyDetail from './components/PropertyDetail';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';

// Componente principal de la aplicación con navegación y rutas
function App() {
  return (
    <Router>
      {/* Navegación global que aparece en todas las páginas */}
      <Navigation />
      
      {/* Contenedor principal con padding para el contenido */}
      <main style={{
        minHeight: 'calc(100vh - 80px)', // Altura completa menos la navegación
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
        </Routes>
      </main>
    </Router>
  );
}

export default App;