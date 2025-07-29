# 🏙️ Urbanytics - Análisis Inmobiliario

**Urbanytics** es una aplicación web full-stack para el análisis inteligente del mercado inmobiliario. La plataforma permite explorar propiedades, visualizar tendencias de mercado a través de un dashboard interactivo y obtener insights valiosos sobre el comportamiento del mercado.

## ✨ Características Principales

### 📊 Dashboard Analítico
- **KPIs Principales**: 6 métricas clave del mercado inmobiliario
- **Gráficos Interactivos**: 6 visualizaciones con filtros por tipo de propiedad
- **Análisis Comparativo**: Tendencias temporales y distribución geográfica
- **Filtros Avanzados**: Por tipo de propiedad con actualización en tiempo real

### 🏠 Gestión de Propiedades
- **Listado Avanzado**: Paginación, filtros múltiples y ordenamiento
- **Búsqueda Inteligente**: Por ciudad, tipo, precio, ratio de venta, tiempo hasta venta
- **Detalles Completos**: Información completa de cada propiedad
- **Navegación Fluida**: Interfaz responsive con efectos visuales

### 🎨 Interfaz Moderna
- **Diseño Minimalista**: Colores relajados y responsive
- **Efectos Interactivos**: Hover effects en todos los elementos clickeables
- **Gráficos Expandibles**: Modal overlay para visualización detallada
- **Navegación Intuitiva**: Barra de navegación simplificada

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** con TypeScript
- **Vite** para desarrollo rápido
- **Recharts** para visualizaciones
- **Fetch API** para comunicación con BFF
- **React Router** para navegación

### BFF (Backend for Frontend) 🚀
- **Node.js** con Express
- **PostgreSQL** con pgxpool
- **Redis** para caché distribuido
- **Caché inteligente** con fallback a memoria
- **Rate limiting** y seguridad con Helmet
- **Compresión** automática de respuestas
- **Logging** estructurado con Morgan

### Backend Original (Legacy)
- **Go** con Gin framework
- **PostgreSQL** con pgxpool
- **CORS** habilitado
- **Arquitectura RESTful**

### Base de Datos
- **PostgreSQL** con Docker
- **Redis** para caché (opcional)
- **Datos**: Ventas inmobiliarias 2001-2020
- **Optimización**: Índices y consultas eficientes

## 🚀 Instalación y Uso

### Prerrequisitos
- Docker y Docker Compose
- Go 1.21+ (para desarrollo backend)
- Node.js 18+ (para desarrollo frontend)

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd urbanytics
```

### 2. Configurar Base de Datos
```bash
# Levantar PostgreSQL
docker-compose up -d

# Cargar datos (opcional - ya incluidos)
python load_data.py

# Limpiar datos (recomendado para mejor calidad)
python clean_data_complete.py
```

### 3. Ejecutar BFF (Recomendado)
```bash
# Instalar dependencias del BFF
cd bff
npm install

# Configurar variables de entorno
cp env.example .env

# Ejecutar BFF
npm run dev
```

### 4. Ejecutar Backend Original (Opcional)
```bash
cd backend
go run main.go
```

### 5. Ejecutar Frontend
```bash
cd frontend
npm install
npm run dev
```

### 6. Acceder a la Aplicación
- **Frontend**: http://localhost:5173
- **BFF API**: http://localhost:3001
- **Backend Original**: http://localhost:8080 (legacy)

## 📊 Funcionalidades del Dashboard

### KPIs Principales
1. **Total de Propiedades**: Volumen total del mercado
2. **Precio Promedio**: Valor típico de las propiedades
3. **Ratio de Venta Promedio**: Relación precio de venta vs tasado
4. **Tiempo Promedio hasta Venta**: Velocidad del mercado
5. **Ciudad Más Activa**: Mayor volumen de transacciones
6. **Tipo Más Popular**: Propiedad más demandada

### Gráficos Analíticos
1. **Precio Promedio por Ciudad**: Análisis geográfico
2. **Análisis por Tipo de Propiedad**: Segmentación del mercado
3. **Tendencias Anuales**: Evolución temporal
4. **Distribución de Ratio de Venta**: Categorización de transacciones
5. **Distribución de Tiempo hasta Venta**: Velocidad de mercado
6. **Top 10 Ciudades por Volumen**: Mercados más activos

## 🔍 Filtros Avanzados

### PropertyList
- **Ciudad**: Dropdown con todas las ciudades disponibles
- **Tipo de Propiedad**: Dropdown con tipos únicos
- **Tipo Residencial**: Condicional (solo para propiedades residenciales)
- **Año de Listado**: Filtro por año
- **Ratio de Venta**: Rango personalizable
- **Años hasta Venta**: Rango personalizable
- **Ordenamiento**: Por precio, año, ratio, tiempo, ciudad

### Dashboard
- **Tipo de Propiedad**: Filtro universal que aplica a todos los gráficos
- **Actualización en Tiempo Real**: Todos los KPIs y gráficos se actualizan

## 🎨 Características de UX/UI

### Efectos Visuales
- **Hover Effects**: Elevación y sombras en elementos interactivos
- **Transiciones Suaves**: Animaciones de 0.2s en todos los elementos
- **Responsive Design**: Adaptable a todos los dispositivos
- **Colores Relajados**: Paleta profesional y moderna

### Interactividad
- **Gráficos Clickables**: Expansión en modal overlay
- **Tooltips Informativos**: Información detallada en hover
- **Navegación Fluida**: Transiciones entre páginas
- **Feedback Visual**: Estados de carga y error

## 📁 Estructura del Proyecto

```
urbanytics/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/       # Componentes principales
│   │   ├── services/         # Servicios de API
│   │   ├── App.tsx          # Componente raíz
│   │   └── main.tsx         # Punto de entrada
│   ├── public/              # Assets estáticos
│   └── index.html           # HTML principal
├── bff/                     # Backend for Frontend (NUEVO)
│   ├── src/
│   │   ├── config/          # Configuración DB y Redis
│   │   ├── services/        # Servicios de negocio
│   │   ├── routes/          # Rutas de la API
│   │   └── index.js         # Servidor principal
│   ├── package.json         # Dependencias Node.js
│   ├── env.example          # Variables de entorno
│   └── README.md            # Documentación del BFF
├── backend/                 # API Go (Legacy)
│   └── main.go             # Servidor principal
├── postgres-data/          # Datos de PostgreSQL
├── load_data.py            # Script de carga de datos
├── clean_data_complete.py  # Script de limpieza completa
├── migrate-to-bff.md       # Guía de migración
└── docker-compose.yml      # Configuración Docker
```

## 🧹 Limpieza de Datos

### Script de Limpieza Completa (`clean_data_complete.py`)

El proyecto incluye un script comprehensivo que realiza todas las operaciones de limpieza necesarias para garantizar la calidad de los datos:

#### Operaciones de Limpieza
1. **Limpieza Básica**: Eliminación de valores nulos en columnas críticas
2. **Limpieza de Precios**: Eliminación de precios <= 0 y outliers extremos
3. **Limpieza de Ratio de Venta**: Validación de ratios > 0 y eliminación de outliers
4. **Limpieza de Tiempo**: Eliminación de tiempos negativos y > 20 años
5. **Limpieza de Fechas**: Conversión y validación de fechas
6. **Limpieza de Tipos**: Eliminación de 'Nan' en Property Type y Residential Type
7. **Limpieza de Ciudades**: Eliminación de ciudades vacías y problemáticas
8. **Limpieza de Años**: Validación de años entre 2000-2020
9. **Limpieza de Direcciones**: Eliminación de direcciones vacías
10. **Limpieza de Valores Avaluados**: Eliminación de valores <= 0
11. **Eliminación de Duplicados**: Basado en Serial Number
12. **Conversión de Tipos**: Tipos de datos apropiados
13. **Renombrado de Columnas**: Formato snake_case

#### Uso
```bash
# Ejecutar limpieza completa
python clean_data_complete.py
```

#### Beneficios
- **Calidad de Datos**: Eliminación de registros problemáticos
- **Consistencia**: Tipos de datos uniformes
- **Precisión**: Análisis más confiables
- **Rendimiento**: Consultas más eficientes

## 🔧 API Endpoints

### BFF (Recomendado) - Puerto 3001

#### Propiedades
- `GET /api/properties` - Listado con filtros y paginación optimizada
- `GET /api/properties/:id` - Detalle de propiedad con caché
- `GET /api/properties/filters/all` - Todos los filtros en una petición
- `POST /api/properties/search` - Búsqueda avanzada con múltiples criterios

#### Analytics
- `GET /api/analytics/dashboard` - Dashboard completo con todos los datos
- `GET /api/analytics/kpis` - KPIs principales con caché
- `GET /api/analytics/charts/all` - Todos los gráficos en una petición
- `GET /api/analytics/charts/avg-price-by-town` - Precios por ciudad
- `GET /api/analytics/charts/property-type-analysis` - Análisis por tipo
- `GET /api/analytics/charts/yearly-trends` - Tendencias anuales
- `GET /api/analytics/charts/sales-ratio-distribution` - Distribución de ratios
- `GET /api/analytics/charts/time-to-sell-distribution` - Tiempo hasta venta
- `GET /api/analytics/charts/top-cities-by-volume` - Top ciudades

#### Monitoreo
- `GET /health` - Health check del sistema
- `GET /info` - Información del servicio

### Backend Original (Legacy) - Puerto 8080

#### Propiedades
- `GET /properties` - Listado con filtros y paginación
- `GET /properties/:id` - Detalle de propiedad
- `GET /cities` - Lista de ciudades
- `GET /property-types` - Tipos de propiedad
- `GET /residential-types` - Tipos residenciales

#### Analytics
- `GET /analytics/kpis` - KPIs principales
- `GET /analytics/avg-price-by-town` - Precios por ciudad
- `GET /analytics/property-type-analysis` - Análisis por tipo
- `GET /analytics/yearly-trends` - Tendencias anuales
- `GET /analytics/sales-ratio-distribution` - Distribución de ratios
- `GET /analytics/time-to-sell-distribution` - Tiempo hasta venta
- `GET /analytics/top-cities-by-volume` - Top ciudades

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

Para preguntas o soporte, contacta al equipo de desarrollo.

## 🚀 Migración al BFF

Para migrar el frontend al nuevo BFF optimizado, sigue la guía completa en [`migrate-to-bff.md`](./migrate-to-bff.md).

### Beneficios de la Migración
- **70-80% menos peticiones HTTP** al servidor
- **Respuestas 3-5x más rápidas** con caché automático
- **Código más limpio** y mantenible en el frontend
- **Mejor escalabilidad** con caché distribuido
- **Monitoreo avanzado** con health checks

### Arquitectura Final
```
Frontend (React) → BFF (Node.js) → PostgreSQL + Redis
```

---

**Urbanytics** - Transformando datos inmobiliarios en insights accionables 🏠📊
