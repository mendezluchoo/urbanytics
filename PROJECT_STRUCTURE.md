# Estructura del Proyecto - Urbanytics v2.0.0

## 📁 Estructura de Directorios

```
urbanytics/
├── 📁 backend/                    # Backend original en Go (Legacy)
│   ├── main.go                   # Servidor principal
│   ├── go.mod                    # Dependencias Go
│   └── go.sum                    # Checksums de dependencias
│
├── 📁 bff/                       # Backend for Frontend (Nuevo)
│   ├── 📁 src/
│   │   ├── 📁 config/
│   │   │   └── database.js       # Configuración DB y Redis
│   │   ├── 📁 services/
│   │   │   ├── cacheService.js   # Servicio de caché inteligente
│   │   │   ├── propertyService.js # Lógica de propiedades
│   │   │   └── analyticsService.js # Lógica de analytics
│   │   ├── 📁 routes/
│   │   │   ├── properties.js     # Rutas de propiedades
│   │   │   └── analytics.js      # Rutas de analytics
│   │   └── index.js              # Servidor principal del BFF
│   ├── package.json              # Dependencias Node.js
│   ├── Dockerfile                # Containerización
│   ├── env.example               # Template de variables de entorno
│   └── README.md                 # Documentación técnica del BFF
│
├── 📁 frontend/                  # Aplicación React
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── Dashboard.tsx     # Dashboard principal
│   │   │   ├── PropertyList.tsx  # Lista de propiedades
│   │   │   ├── PropertyDetail.tsx # Detalle de propiedad
│   │   │   └── Navigation.tsx    # Navegación
│   │   ├── 📁 services/
│   │   │   └── api.ts            # Servicio de API centralizado
│   │   ├── App.tsx               # Componente raíz
│   │   ├── main.tsx              # Punto de entrada
│   │   └── index.css             # Estilos globales
│   ├── 📁 public/                # Assets estáticos
│   ├── package.json              # Dependencias React
│   ├── vite.config.ts            # Configuración Vite
│   ├── tsconfig.json             # Configuración TypeScript
│   └── index.html                # HTML principal
│
├── 📁 postgres-data/             # Datos de PostgreSQL (Docker)
│
├── 📄 README.md                  # Documentación principal
├── 📄 CHANGELOG.md               # Historial de cambios
├── 📄 RELEASE_NOTES_v2.0.0.md    # Notas de release v2.0.0
├── 📄 PROJECT_STRUCTURE.md       # Este archivo
├── 📄 docker-compose.yml         # Configuración Docker
├── 📄 .gitignore                 # Archivos ignorados por Git
├── 📄 clean_data_complete.py     # Script de limpieza de datos
├── 📄 load_data.py               # Script de carga de datos
└── 📄 Real_Estate_Sales_2001-2020_GL.csv # Dataset principal
```

## 🎯 Componentes Principales

### Backend for Frontend (BFF)
- **Propósito**: Capa intermedia entre frontend y backend
- **Tecnología**: Node.js + Express + Redis
- **Funcionalidades**: Caché, rate limiting, agregación de datos
- **Puerto**: 3001

### Frontend
- **Propósito**: Interfaz de usuario
- **Tecnología**: React 18 + TypeScript + Vite
- **Funcionalidades**: Dashboard, listado, filtros, gráficos
- **Puerto**: 5173

### Backend Original (Legacy)
- **Propósito**: API original en Go
- **Tecnología**: Go + Gin + PostgreSQL
- **Funcionalidades**: Endpoints REST originales
- **Puerto**: 8080

### Base de Datos
- **Propósito**: Almacenamiento de datos
- **Tecnología**: PostgreSQL (Docker)
- **Datos**: Ventas inmobiliarias 2001-2020

## 📊 Archivos de Datos

### Dataset Principal
- **Archivo**: `Real_Estate_Sales_2001-2020_GL.csv`
- **Tamaño**: ~90MB
- **Contenido**: Datos de ventas inmobiliarias
- **Período**: 2001-2020

### Scripts de Datos
- **`load_data.py`**: Carga inicial de datos
- **`clean_data_complete.py`**: Limpieza y optimización de datos

## 🔧 Archivos de Configuración

### Docker
- **`docker-compose.yml`**: Orquestación de servicios
  - PostgreSQL
  - Redis
  - BFF

### Variables de Entorno
- **`bff/env.example`**: Template para configuración del BFF
- **Variables principales**:
  - `BFF_PORT`: Puerto del BFF (3001)
  - `DB_HOST`: Host de PostgreSQL
  - `REDIS_URL`: URL de Redis
  - `FRONTEND_URL`: URL del frontend

## 📚 Documentación

### Documentación Principal
- **`README.md`**: Guía completa de instalación y uso
- **`CHANGELOG.md`**: Historial detallado de cambios
- **`RELEASE_NOTES_v2.0.0.md`**: Notas específicas del release

### Documentación Técnica
- **`bff/README.md`**: Documentación específica del BFF
- **`PROJECT_STRUCTURE.md`**: Este archivo de estructura

## 🚀 Instalación y Uso

### Prerrequisitos
- Docker y Docker Compose
- Node.js 18+
- Go 1.21+ (opcional, para backend legacy)

### Pasos de Instalación
1. **Clonar repositorio**
2. **Configurar variables de entorno**: `cp bff/env.example bff/.env`
3. **Levantar servicios**: `docker-compose up -d`
4. **Instalar dependencias BFF**: `cd bff && npm install`
5. **Ejecutar BFF**: `npm run dev`
6. **Ejecutar frontend**: `cd frontend && npm run dev`

### URLs de Acceso
- **Frontend**: http://localhost:5173
- **BFF API**: http://localhost:3001
- **Backend Original**: http://localhost:8080 (legacy)

## 🔒 Seguridad

### Rate Limiting
- **Default**: 5000 requests por 15 minutos
- **Configurable**: Por endpoint y tipo de operación

### Headers de Seguridad
- **Helmet**: Headers de seguridad automáticos
- **CORS**: Configurado para frontend específico
- **Compression**: Respuestas comprimidas automáticamente

## 📈 Rendimiento

### Caché
- **Redis**: Caché principal distribuido
- **Memoria**: Fallback cuando Redis no está disponible
- **TTL**: 5-60 minutos según endpoint

### Optimizaciones
- **Agregación de datos**: Múltiples endpoints en uno
- **Compresión**: Respuestas comprimidas
- **Paginación**: Listados optimizados

## 🧪 Testing

### Endpoints de Prueba
- **Health Check**: `GET /health`
- **Info**: `GET /info`
- **Dashboard**: `GET /api/analytics/dashboard`
- **Propiedades**: `GET /api/properties`

## 🔮 Próximos Pasos

### Desarrollo
1. **Tests**: Implementar suite de tests completo
2. **Métricas**: Integrar Prometheus/Grafana
3. **Documentación API**: Swagger/OpenAPI

### Producción
1. **CI/CD**: Pipeline de despliegue automático
2. **Monitoreo**: Alertas y dashboards
3. **Optimización**: Ajustes de rendimiento

---

**Urbanytics v2.0.0** - Sistema completo de análisis inmobiliario con arquitectura BFF optimizada. 