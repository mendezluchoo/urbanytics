# Backend for Frontend (BFF) - Urbanytics

## 🎯 Propósito

El BFF (Backend for Frontend) de Urbanytics actúa como una capa intermedia entre el frontend React y el backend Go original. Su objetivo es optimizar la comunicación, agregar datos y proporcionar una API más eficiente para el frontend.

## 🏗️ Arquitectura

```
Frontend (React) → BFF (Node.js/Express) → Backend Go → PostgreSQL
                              ↓
                           Redis Cache
```

### Componentes Principales

- **Express Server**: Servidor HTTP con middleware de seguridad
- **PostgreSQL Client**: Conexión directa a la base de datos
- **Redis Cache**: Caché distribuido con fallback a memoria
- **Rate Limiting**: Protección contra abuso de API
- **Services Layer**: Lógica de negocio separada por dominio

## 📁 Estructura del Proyecto

```
bff/
├── src/
│   ├── config/
│   │   └── database.js          # Configuración de DB y Redis
│   ├── services/
│   │   ├── cacheService.js      # Servicio de caché inteligente
│   │   ├── propertyService.js   # Lógica de propiedades
│   │   └── analyticsService.js  # Lógica de analytics
│   ├── routes/
│   │   ├── properties.js        # Rutas de propiedades
│   │   └── analytics.js         # Rutas de analytics
│   └── index.js                 # Servidor principal
├── package.json                 # Dependencias
├── Dockerfile                   # Containerización
└── env.example                  # Variables de entorno
```

## 🚀 Instalación

### Prerrequisitos
- Node.js 18+
- PostgreSQL (via Docker)
- Redis (opcional, tiene fallback a memoria)

### Configuración

1. **Instalar dependencias**:
```bash
npm install
```

2. **Configurar variables de entorno**:
```bash
cp env.example .env
```

3. **Variables de entorno**:
```env
# Servidor
BFF_PORT=3001
NODE_ENV=development

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=urbanytics
DB_USER=postgres
DB_PASSWORD=password

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Frontend
FRONTEND_URL=http://localhost:5173
```

## 🔧 Desarrollo

### Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Servidor con nodemon
npm start           # Servidor de producción
npm test            # Tests (pendiente)
```

### Estructura de Respuestas

Todas las respuestas siguen el formato estándar:

```json
{
  "success": true,
  "data": {
    // Datos específicos del endpoint
  },
  "pagination": {
    // Solo en endpoints paginados
  },
  "filters": {
    // Solo en endpoints con filtros
  }
}
```

## 📊 Endpoints

### Propiedades

#### `GET /api/properties`
Lista de propiedades con filtros y paginación.

**Query Parameters**:
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 12)
- `sort_by`: Campo de ordenamiento
- `sort_order`: asc/desc
- `city`: Filtro por ciudad
- `property_type`: Filtro por tipo
- `min_price`, `max_price`: Rango de precios
- `min_ratio`, `max_ratio`: Rango de ratio de venta
- `min_years`, `max_years`: Rango de años hasta venta

**Respuesta**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_items": 100,
    "items_per_page": 12
  }
}
```

#### `GET /api/properties/:id`
Detalle de una propiedad específica.

#### `GET /api/properties/filters/all`
Todos los filtros disponibles en un solo endpoint.

### Analytics

#### `GET /api/analytics/dashboard`
Dashboard completo con KPIs y gráficos.

**Query Parameters**:
- `property_type`: Filtro opcional por tipo de propiedad

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "kpis": {
      "total_properties": 1000,
      "average_price": 250000,
      // ... más KPIs
    },
    "charts": {
      "avg_price_by_town": [...],
      "property_type_analysis": [...],
      // ... más gráficos
    }
  }
}
```

#### `POST /api/analytics/cache/clear`
Limpia el caché manualmente.

### Monitoreo

#### `GET /health`
Estado del servicio.

#### `GET /info`
Información del sistema.

## 💾 Caché

### Estrategia de Caché

- **Redis**: Caché principal distribuido
- **Memoria**: Fallback cuando Redis no está disponible
- **TTL**: 5-60 minutos según el endpoint
- **Invalidación**: Manual o automática por TTL

### Configuración de TTL

```javascript
const CACHE_TTL = {
  PROPERTIES: 5 * 60,        // 5 minutos
  PROPERTY_DETAIL: 10 * 60,  // 10 minutos
  FILTERS: 30 * 60,          // 30 minutos
  ANALYTICS: 60 * 60,        // 60 minutos
  KPIS: 60 * 60              // 60 minutos
};
```

## 🔒 Seguridad

### Rate Limiting
- **Default**: 5000 requests por 15 minutos
- **Configurable**: Por endpoint y tipo de operación
- **Headers**: Incluye información de límites

### Headers de Seguridad
- **Helmet**: Headers de seguridad automáticos
- **CORS**: Configurado para frontend específico
- **Compression**: Respuestas comprimidas automáticamente

## 📈 Monitoreo

### Logs
- **Morgan**: Logging estructurado
- **Niveles**: Error, Warn, Info, Debug
- **Formato**: Combined con timestamps

### Métricas
- **Response Time**: Tiempo de respuesta por endpoint
- **Cache Hit Rate**: Efectividad del caché
- **Error Rate**: Tasa de errores

## 🐳 Docker

### Construir Imagen
```bash
docker build -t urbanytics-bff .
```

### Ejecutar con Docker Compose
```bash
docker-compose up bff
```

## 🧪 Testing

### Tests Unitarios (Pendiente)
```bash
npm test
```

### Tests de Integración (Pendiente)
```bash
npm run test:integration
```

## 🔄 Migración desde Backend Original

### Cambios Principales
1. **Agregación de datos**: Múltiples endpoints en uno
2. **Caché inteligente**: Reducción de carga en DB
3. **Rate limiting**: Protección contra abuso
4. **Logging mejorado**: Debugging más fácil

### Compatibilidad
- **Backend original**: Sigue funcionando independientemente
- **Frontend**: Migrado completamente al BFF
- **Datos**: Misma base de datos PostgreSQL

## 🚀 Próximos Pasos

1. **Tests**: Implementar suite de tests completo
2. **Métricas**: Integrar Prometheus/Grafana
3. **Documentación API**: Swagger/OpenAPI
4. **CI/CD**: Pipeline de despliegue automático
5. **Monitoreo**: Alertas y dashboards

---

*Documentación del BFF - Urbanytics v2.0.0* 