// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PropertyList from './components/PropertyList';
import PropertyDetail from './components/PropertyDetail';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* La ruta principal '/' mostrará la lista de propiedades */}
        <Route path="/" element={<PropertyList />} />
        {/* La ruta '/properties/:id' mostrará el detalle de una propiedad */}
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;