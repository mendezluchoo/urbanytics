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
- **Axios** para comunicación con API
- **React Router** para navegación

### Backend
- **Go** con Gin framework
- **PostgreSQL** con pgxpool
- **CORS** habilitado
- **Arquitectura RESTful**

### Base de Datos
- **PostgreSQL** con Docker
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
```

### 3. Ejecutar Backend
```bash
cd backend
go run main.go
```

### 4. Ejecutar Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Acceder a la Aplicación
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080

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
│   │   ├── App.tsx          # Componente raíz
│   │   └── main.tsx         # Punto de entrada
│   ├── public/              # Assets estáticos
│   └── index.html           # HTML principal
├── backend/                 # API Go
│   └── main.go             # Servidor principal
├── postgres-data/          # Datos de PostgreSQL
├── load_data.py            # Script de carga de datos
└── docker-compose.yml      # Configuración Docker
```

## 🔧 API Endpoints

### Propiedades
- `GET /properties` - Listado con filtros y paginación
- `GET /properties/:id` - Detalle de propiedad
- `GET /cities` - Lista de ciudades
- `GET /property-types` - Tipos de propiedad
- `GET /residential-types` - Tipos residenciales

### Analytics
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

---

**Urbanytics** - Transformando datos inmobiliarios en insights accionables 🏠📊
