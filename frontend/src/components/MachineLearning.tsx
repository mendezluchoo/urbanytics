import React, { useState } from 'react';
import './MachineLearning.css';

// Tipos para el formulario de ML
interface MLFormData {
  property_type: string;
  residential_type: string;
  town: string;
  list_year: number;
  assessed_value: number;
  sales_ratio: number;
  years_until_sold: number;
}

interface MLPrediction {
  predicted_price: number;
  confidence: number;
  factors: string[];
  model_info: {
    name: string;
    version: string;
    accuracy: number;
  };
}

const MachineLearning: React.FC = () => {
  const [formData, setFormData] = useState<MLFormData>({
    property_type: '',
    residential_type: '',
    town: '',
    list_year: new Date().getFullYear(),
    assessed_value: 0,
    sales_ratio: 0,
    years_until_sold: 0
  });

  const [prediction, setPrediction] = useState<MLPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'list_year' || name === 'assessed_value' || name === 'sales_ratio' || name === 'years_until_sold' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      // Simular llamada a API de ML (por ahora)
      // const result = await apiService.predictPropertyPrice(formData);
      
      // Simulación de respuesta
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockPrediction: MLPrediction = {
        predicted_price: Math.round(formData.assessed_value * (0.8 + Math.random() * 0.4)),
        confidence: 85 + Math.random() * 10,
        factors: [
          'Ubicación geográfica',
          'Tipo de propiedad',
          'Valor tasado',
          'Ratio de venta histórico',
          'Tendencias del mercado'
        ],
        model_info: {
          name: 'Random Forest Regression',
          version: '2.1.0',
          accuracy: 94.2
        }
      };

      setPrediction(mockPrediction);
    } catch (err) {
      setError('Error al procesar la predicción. Por favor, intenta de nuevo.');
      console.error('ML Prediction Error:', err);
    } finally {
      setLoading(false);
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

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="ml-container">
      <div className="ml-header">
        <h1>🤖 Machine Learning - Tasación Inteligente</h1>
        <p>
          Utiliza nuestro modelo de inteligencia artificial para obtener una 
          tasación precisa de propiedades basada en datos históricos y 
          características del mercado.
        </p>
      </div>

      <div className="ml-content">
        <div className="ml-form-section">
          <h2>📋 Datos de la Propiedad</h2>
          <form onSubmit={handleSubmit} className="ml-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="property_type">Tipo de Propiedad *</label>
                <select
                  id="property_type"
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="Residential">Residencial</option>
                  <option value="Commercial">Comercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Land">Terreno</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="residential_type">Tipo Residencial</label>
                <select
                  id="residential_type"
                  name="residential_type"
                  value={formData.residential_type}
                  onChange={handleInputChange}
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="Single Family">Casa Familiar</option>
                  <option value="Condo">Condominio</option>
                  <option value="Multi Family">Multifamiliar</option>
                  <option value="Townhouse">Townhouse</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="town">Ciudad *</label>
                <input
                  type="text"
                  id="town"
                  name="town"
                  value={formData.town}
                  onChange={handleInputChange}
                  placeholder="Ej: Hartford, Bridgeport"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="list_year">Año de Listado *</label>
                <input
                  type="number"
                  id="list_year"
                  name="list_year"
                  value={formData.list_year}
                  onChange={handleInputChange}
                  min="2000"
                  max={new Date().getFullYear()}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="assessed_value">Valor Tasado (USD) *</label>
                <input
                  type="number"
                  id="assessed_value"
                  name="assessed_value"
                  value={formData.assessed_value}
                  onChange={handleInputChange}
                  placeholder="Ej: 250000"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="sales_ratio">Ratio de Venta (%)</label>
                <input
                  type="number"
                  id="sales_ratio"
                  name="sales_ratio"
                  value={formData.sales_ratio}
                  onChange={handleInputChange}
                  placeholder="Ej: 95.5"
                  min="0"
                  max="200"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="years_until_sold">Años hasta Venta</label>
                <input
                  type="number"
                  id="years_until_sold"
                  name="years_until_sold"
                  value={formData.years_until_sold}
                  onChange={handleInputChange}
                  placeholder="Ej: 2.5"
                  min="0"
                  max="20"
                  step="0.1"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="ml-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Procesando...
                </>
              ) : (
                <>
                  <span className="btn-icon">🔮</span>
                  Obtener Predicción
                </>
              )}
            </button>
          </form>
        </div>

        <div className="ml-results-section">
          <h2>📊 Resultados de la Predicción</h2>
          
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {loading && (
            <div className="loading-section">
              <div className="loading-animation">
                <div className="ml-brain">🧠</div>
                <div className="ml-particles">
                  <span>📊</span>
                  <span>📈</span>
                  <span>🔍</span>
                  <span>📉</span>
                </div>
              </div>
              <p>Analizando datos y generando predicción...</p>
            </div>
          )}

          {prediction && (
            <div className="prediction-results">
              <div className="prediction-card main-prediction">
                <div className="prediction-header">
                  <h3>💰 Precio Predicho</h3>
                  <div className="confidence-badge">
                    {formatPercentage(prediction.confidence)} confianza
                  </div>
                </div>
                <div className="predicted-price">
                  {formatPrice(prediction.predicted_price)}
                </div>
                <p className="prediction-note">
                  Basado en análisis de {prediction.factors.length} factores clave
                </p>
              </div>

              <div className="prediction-details">
                <div className="detail-card">
                  <h4>🎯 Factores Considerados</h4>
                  <ul className="factors-list">
                    {prediction.factors.map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>

                <div className="detail-card">
                  <h4>🤖 Información del Modelo</h4>
                  <div className="model-info">
                    <div className="model-item">
                      <span className="model-label">Modelo:</span>
                      <span className="model-value">{prediction.model_info.name}</span>
                    </div>
                    <div className="model-item">
                      <span className="model-label">Versión:</span>
                      <span className="model-value">{prediction.model_info.version}</span>
                    </div>
                    <div className="model-item">
                      <span className="model-label">Precisión:</span>
                      <span className="model-value">{formatPercentage(prediction.model_info.accuracy)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="prediction-disclaimer">
                <p>
                  <strong>⚠️ Descargo de Responsabilidad:</strong> Esta predicción es 
                  generada por un modelo de machine learning y debe ser utilizada 
                  únicamente como referencia. Se recomienda consultar con un 
                  profesional inmobiliario para decisiones de inversión.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="ml-info-section">
        <h2>🔬 ¿Cómo Funciona?</h2>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon">📊</div>
            <h3>Análisis de Datos</h3>
            <p>
              Nuestro modelo analiza más de 50,000 propiedades históricas 
              para identificar patrones y tendencias del mercado.
            </p>
          </div>

          <div className="info-card">
            <div className="info-icon">🤖</div>
            <h3>Algoritmo Avanzado</h3>
            <p>
              Utilizamos Random Forest Regression, un algoritmo de 
              machine learning que combina múltiples modelos para 
              mayor precisión.
            </p>
          </div>

          <div className="info-card">
            <div className="info-icon">📈</div>
            <h3>Predicción Precisa</h3>
            <p>
              El modelo considera factores como ubicación, tipo de 
              propiedad, valor tasado y tendencias del mercado.
            </p>
          </div>

          <div className="info-card">
            <div className="info-icon">🔄</div>
            <h3>Aprendizaje Continuo</h3>
            <p>
              El modelo se actualiza constantemente con nuevos datos 
              para mejorar su precisión y adaptarse a cambios del mercado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineLearning; 