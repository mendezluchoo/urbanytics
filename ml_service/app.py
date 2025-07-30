"""
Machine Learning Service for Urbanytics
Property Appraisal Regression Model
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os
import logging
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuración
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'db_urbanytics'),
    'user': os.getenv('DB_USER', 'user_urbanytics'),
    'password': os.getenv('DB_PASSWORD', 'password_urbanytics')
}

MODEL_PATH = 'models/property_appraisal_model.pkl'
SCALER_PATH = 'models/scaler.pkl'
ENCODERS_PATH = 'models/encoders.pkl'

class PropertyAppraisalModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = [
            'list_year', 'assessed_value', 'property_type', 
            'residential_type', 'town', 'years_until_sold'
        ]
        self.target_column = 'sale_amount'
        
    def load_data_from_db(self):
        """Cargar datos desde PostgreSQL"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            query = """
                SELECT list_year, assessed_value, property_type, residential_type, 
                       town, years_until_sold, sale_amount
                FROM properties 
                WHERE sale_amount > 0 
                AND assessed_value > 0 
                AND property_type IS NOT NULL 
                AND town IS NOT NULL
                AND list_year IS NOT NULL
            """
            
            df = pd.read_sql_query(query, conn)
            conn.close()
            
            logger.info(f"Datos cargados: {len(df)} registros")
            return df
            
        except Exception as e:
            logger.error(f"Error cargando datos: {e}")
            return None
    
    def preprocess_data(self, df):
        """Preprocesar datos para el modelo"""
        try:
            # Copiar datos
            data = df.copy()
            
            # Filtrar datos válidos
            data = data.dropna(subset=self.feature_columns + [self.target_column])
            
            # Codificar variables categóricas
            categorical_columns = ['property_type', 'residential_type', 'town']
            
            for col in categorical_columns:
                if col in data.columns:
                    le = LabelEncoder()
                    data[f'{col}_encoded'] = le.fit_transform(data[col].astype(str))
                    self.label_encoders[col] = le
            
            # Seleccionar features numéricas
            numeric_features = ['list_year', 'assessed_value', 'years_until_sold']
            encoded_features = [f'{col}_encoded' for col in categorical_columns if col in data.columns]
            
            X = data[numeric_features + encoded_features]
            y = data[self.target_column]
            
            # Escalar features
            X_scaled = self.scaler.fit_transform(X)
            
            return X_scaled, y, X.columns.tolist()
            
        except Exception as e:
            logger.error(f"Error en preprocesamiento: {e}")
            return None, None, None
    
    def train_model(self):
        """Entrenar el modelo"""
        try:
            # Cargar datos
            df = self.load_data_from_db()
            if df is None or len(df) == 0:
                logger.error("No se pudieron cargar datos para entrenamiento")
                return False
            
            # Preprocesar datos
            X, y, feature_names = self.preprocess_data(df)
            if X is None:
                logger.error("Error en preprocesamiento de datos")
                return False
            
            # Dividir datos
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Entrenar modelo
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            
            self.model.fit(X_train, y_train)
            
            # Evaluar modelo
            y_pred = self.model.predict(X_test)
            mae = mean_absolute_error(y_test, y_pred)
            mse = mean_squared_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            logger.info(f"Modelo entrenado exitosamente:")
            logger.info(f"MAE: ${mae:,.2f}")
            logger.info(f"RMSE: ${np.sqrt(mse):,.2f}")
            logger.info(f"R²: {r2:.4f}")
            
            # Guardar modelo
            self.save_model()
            
            return True
            
        except Exception as e:
            logger.error(f"Error entrenando modelo: {e}")
            return False
    
    def save_model(self):
        """Guardar modelo y componentes"""
        try:
            os.makedirs('models', exist_ok=True)
            
            # Guardar modelo
            joblib.dump(self.model, MODEL_PATH)
            
            # Guardar scaler
            joblib.dump(self.scaler, SCALER_PATH)
            
            # Guardar encoders
            joblib.dump(self.label_encoders, ENCODERS_PATH)
            
            logger.info("Modelo guardado exitosamente")
            
        except Exception as e:
            logger.error(f"Error guardando modelo: {e}")
    
    def load_model(self):
        """Cargar modelo guardado"""
        try:
            if os.path.exists(MODEL_PATH):
                self.model = joblib.load(MODEL_PATH)
                self.scaler = joblib.load(SCALER_PATH)
                self.label_encoders = joblib.load(ENCODERS_PATH)
                logger.info("Modelo cargado exitosamente")
                return True
            else:
                logger.warning("Modelo no encontrado, entrenando nuevo modelo...")
                return self.train_model()
                
        except Exception as e:
            logger.error(f"Error cargando modelo: {e}")
            return False
    
    def predict(self, input_data):
        """Realizar predicción"""
        try:
            if self.model is None:
                if not self.load_model():
                    return None
            
            # Preparar datos de entrada
            features = []
            
            # Features numéricas
            features.append(input_data.get('list_year', 2020))
            features.append(input_data.get('assessed_value', 0))
            features.append(input_data.get('years_until_sold', 0))
            
            # Features categóricas codificadas
            for col in ['property_type', 'residential_type', 'town']:
                le = self.label_encoders.get(col)
                if le:
                    value = input_data.get(col, 'Unknown')
                    try:
                        encoded_value = le.transform([value])[0]
                    except ValueError:
                        # Si el valor no existe en el encoder, usar 0
                        encoded_value = 0
                    features.append(encoded_value)
                else:
                    features.append(0)
            
            # Escalar features
            features_scaled = self.scaler.transform([features])
            
            # Predicción
            prediction = self.model.predict(features_scaled)[0]
            
            return max(0, prediction)  # No permitir valores negativos
            
        except Exception as e:
            logger.error(f"Error en predicción: {e}")
            return None

# Instanciar modelo
ml_model = PropertyAppraisalModel()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'urbanytics-ml-service',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': ml_model.model is not None
    })

@app.route('/train', methods=['POST'])
def train_model():
    """Entrenar modelo"""
    try:
        success = ml_model.train_model()
        if success:
            return jsonify({
                'success': True,
                'message': 'Modelo entrenado exitosamente',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error entrenando modelo'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/predict', methods=['POST'])
def predict():
    """Realizar predicción de valor de propiedad"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Datos de entrada requeridos'
            }), 400
        
        # Validar datos requeridos
        required_fields = ['assessed_value', 'property_type', 'town']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Campo requerido: {field}'
                }), 400
        
        # Realizar predicción
        prediction = ml_model.predict(data)
        
        if prediction is None:
            return jsonify({
                'success': False,
                'error': 'Error en predicción'
            }), 500
        
        # Calcular métricas adicionales
        assessed_value = data.get('assessed_value', 0)
        price_ratio = prediction / assessed_value if assessed_value > 0 else 0
        
        return jsonify({
            'success': True,
            'prediction': {
                'predicted_price': round(prediction, 2),
                'assessed_value': assessed_value,
                'price_ratio': round(price_ratio, 4),
                'confidence_score': 0.85,  # Simulado
                'model_version': '1.0.0'
            },
            'input_data': data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/model/info', methods=['GET'])
def model_info():
    """Información del modelo"""
    try:
        if ml_model.model is None:
            return jsonify({
                'success': False,
                'error': 'Modelo no cargado'
            }), 404
        
        # Obtener información del modelo
        feature_importance = {}
        if hasattr(ml_model.model, 'feature_importances_'):
            feature_names = ['list_year', 'assessed_value', 'years_until_sold']
            for col in ['property_type', 'residential_type', 'town']:
                if col in ml_model.label_encoders:
                    feature_names.append(f'{col}_encoded')
            
            for name, importance in zip(feature_names, ml_model.model.feature_importances_):
                feature_importance[name] = round(importance, 4)
        
        return jsonify({
            'success': True,
            'model_info': {
                'type': 'RandomForestRegressor',
                'n_estimators': ml_model.model.n_estimators,
                'max_depth': ml_model.model.max_depth,
                'feature_importance': feature_importance,
                'available_categories': {
                    'property_types': list(ml_model.label_encoders.get('property_type', {}).classes_) if 'property_type' in ml_model.label_encoders else [],
                    'residential_types': list(ml_model.label_encoders.get('residential_type', {}).classes_) if 'residential_type' in ml_model.label_encoders else [],
                    'towns': list(ml_model.label_encoders.get('town', {}).classes_) if 'town' in ml_model.label_encoders else []
                }
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/data/stats', methods=['GET'])
def data_stats():
    """Estadísticas de los datos de entrenamiento"""
    try:
        df = ml_model.load_data_from_db()
        if df is None:
            return jsonify({
                'success': False,
                'error': 'No se pudieron cargar datos'
            }), 500
        
        stats = {
            'total_records': len(df),
            'price_stats': {
                'mean': round(df['sale_amount'].mean(), 2),
                'median': round(df['sale_amount'].median(), 2),
                'min': round(df['sale_amount'].min(), 2),
                'max': round(df['sale_amount'].max(), 2),
                'std': round(df['sale_amount'].std(), 2)
            },
            'assessed_value_stats': {
                'mean': round(df['assessed_value'].mean(), 2),
                'median': round(df['assessed_value'].median(), 2),
                'min': round(df['assessed_value'].min(), 2),
                'max': round(df['assessed_value'].max(), 2),
                'std': round(df['assessed_value'].std(), 2)
            },
            'year_range': {
                'min': int(df['list_year'].min()),
                'max': int(df['list_year'].max())
            },
            'unique_values': {
                'property_types': df['property_type'].nunique(),
                'residential_types': df['residential_type'].nunique(),
                'towns': df['town'].nunique()
            }
        }
        
        return jsonify({
            'success': True,
            'data_stats': stats,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Cargar modelo al iniciar
    logger.info("Iniciando servicio de Machine Learning...")
    ml_model.load_model()
    
    # Iniciar servidor
    port = int(os.getenv('ML_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False) 