/**
 * Backend for Frontend (BFF) para Urbanytics
 * Optimiza y agrega caché para mejorar el rendimiento del frontend
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Importar configuración y servicios
const { 
  connectRedis, 
  testPostgresConnection, 
  closeConnections 
} = require('./config/database');

// Importar rutas
const propertiesRoutes = require('./routes/properties');
const analyticsRoutes = require('./routes/analytics');

// Configuración de la aplicación
const app = express();
const PORT = process.env.BFF_PORT || 3001;

// Configuración de seguridad con Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Configuración de CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compresión de respuestas
app.use(compression());

// Logging con Morgan
app.use(morgan('combined', {
  skip: (req, res) => res.statusCode < 400,
  stream: {
    write: (message) => {
      console.log(message.trim());
    }
  }
}));

// Rate limiting - Configuración más permisiva para desarrollo
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5000, // Máximo 5000 peticiones por ventana (más permisivo)
  message: {
    success: false,
    error: 'Demasiadas peticiones desde esta IP',
    message: 'Por favor, intenta de nuevo más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Endpoint de salud principal
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'urbanytics-bff',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Endpoint de información del sistema
app.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'Urbanytics BFF',
      description: 'Backend for Frontend optimizado para Urbanytics',
      version: '1.0.0',
      features: [
        'Caché inteligente con Redis y memoria',
        'Optimización de consultas PostgreSQL',
        'Rate limiting y seguridad',
        'Compresión de respuestas',
        'Logging estructurado',
        'Monitoreo de salud'
      ],
      endpoints: {
        properties: '/api/properties',
        analytics: '/api/analytics',
        health: '/health'
      },
      timestamp: new Date().toISOString()
    }
  });
});

// Configurar rutas de la API
app.use('/api/properties', propertiesRoutes);
app.use('/api/analytics', analyticsRoutes);

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.originalUrl} no existe`,
    available_endpoints: {
      health: '/health',
      info: '/info',
      properties: '/api/properties',
      analytics: '/api/analytics'
    }
  });
});

// Función para inicializar el servidor
const initializeServer = async () => {
  try {
    console.log('🚀 Iniciando BFF de Urbanytics...');

    // Conectar a Redis
    await connectRedis();

    // Verificar conexión a PostgreSQL
    const postgresConnected = await testPostgresConnection();
    if (!postgresConnected) {
      console.error('❌ No se pudo conectar a PostgreSQL. El BFF puede no funcionar correctamente.');
    }

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`✅ BFF iniciado exitosamente en puerto ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`ℹ️  Info: http://localhost:${PORT}/info`);
      console.log(`🏠 API Properties: http://localhost:${PORT}/api/properties`);
      console.log(`📈 API Analytics: http://localhost:${PORT}/api/analytics`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });

    // Manejo graceful de cierre
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Recibida señal ${signal}. Cerrando servidor...`);
      
      server.close(async () => {
        console.log('✅ Servidor HTTP cerrado');
        
        try {
          await closeConnections();
          console.log('✅ Conexiones cerradas');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error cerrando conexiones:', error);
          process.exit(1);
        }
      });

      // Forzar cierre si no se completa en 10 segundos
      setTimeout(() => {
        console.error('❌ Forzando cierre del servidor');
        process.exit(1);
      }, 10000);
    };

    // Escuchar señales de cierre
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejo de errores no capturados
    process.on('uncaughtException', (error) => {
      console.error('❌ Error no capturado:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesa rechazada no manejada:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('❌ Error iniciando BFF:', error);
    process.exit(1);
  }
};

// Iniciar servidor si este archivo se ejecuta directamente
if (require.main === module) {
  initializeServer();
}

module.exports = app; 