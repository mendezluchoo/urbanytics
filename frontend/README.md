# Urbanytics Frontend

## 🎨 Diseño Minimalista y Responsive

Este frontend ha sido completamente reestructurado con un diseño minimalista, colores relajados y completamente responsive para ofrecer la mejor experiencia de usuario.

## 🎯 Características Principales

### 🎨 **Diseño Minimalista**
- **Paleta de colores relajados**: Verde sage, menta claro y beige cálido
- **Tipografía moderna**: Inter font family para mejor legibilidad
- **Espaciado generoso**: Mejor respiración visual
- **Sombras sutiles**: Efectos visuales suaves y elegantes

### 📱 **Completamente Responsive**
- **Mobile-first**: Diseño optimizado para dispositivos móviles
- **Grid adaptativo**: Se ajusta automáticamente a diferentes tamaños de pantalla
- **Navegación móvil**: Menú hamburguesa para pantallas pequeñas
- **Touch-friendly**: Botones y elementos optimizados para touch

### 🚀 **Funcionalidades Mejoradas**

#### 📋 **Lista de Propiedades**
- **Filtros avanzados**: Por ciudad, precio mínimo y máximo
- **Paginación**: Navegación por páginas con controles intuitivos
- **Tarjetas interactivas**: Efectos hover y transiciones suaves
- **Estados de carga**: Indicadores visuales durante las peticiones
- **Manejo de errores**: Mensajes claros y opciones de recuperación

#### 🏠 **Detalle de Propiedad**
- **Información completa**: Todos los datos de la propiedad organizados
- **Diseño de tarjetas**: Información agrupada en secciones visuales
- **Navegación intuitiva**: Botones de regreso y navegación clara
- **Estados de error**: Manejo elegante de errores y propiedades no encontradas

#### 📊 **Dashboard Analítico**
- **Múltiples visualizaciones**: Gráficos de barras, líneas y circular
- **Selector de gráficos**: Interfaz intuitiva para cambiar entre visualizaciones
- **Resumen estadístico**: Métricas clave en tarjetas informativas
- **Tooltips mejorados**: Información detallada al hacer hover
- **Colores consistentes**: Paleta unificada en todos los gráficos

## 🛠️ **Estructura del Proyecto**

```
src/
├── components/
│   ├── Navigation.tsx      # Navegación principal responsive
│   ├── PropertyList.tsx    # Lista de propiedades con filtros
│   ├── PropertyDetail.tsx  # Detalle completo de propiedad
│   └── Dashboard.tsx       # Dashboard con gráficos analíticos
├── App.tsx                 # Componente principal con rutas
├── main.tsx               # Punto de entrada de la aplicación
└── index.css              # Estilos globales y variables CSS
```

## 🎨 **Sistema de Colores**

```css
/* Paleta de colores relajados */
--primary-color: #7c9885;      /* Verde sage suave */
--secondary-color: #a8c5a8;    /* Verde menta claro */
--accent-color: #d4a574;       /* Beige cálido */
--background-color: #f8f9fa;   /* Gris muy claro */
--surface-color: #ffffff;      /* Blanco puro */
--text-primary: #2c3e50;       /* Azul gris oscuro */
--text-secondary: #6c757d;     /* Gris medio */
--border-color: #e9ecef;       /* Gris muy claro para bordes */
```

## 📱 **Breakpoints Responsive**

- **Desktop**: > 1200px
- **Tablet**: 768px - 1200px
- **Mobile**: < 768px
- **Small Mobile**: < 480px

## 🚀 **Cómo Ejecutar**

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Ejecutar en modo desarrollo**:
   ```bash
   npm run dev
   ```

3. **Construir para producción**:
   ```bash
   npm run build
   ```

## 🔧 **Tecnologías Utilizadas**

- **React 19**: Framework principal
- **TypeScript**: Tipado estático
- **React Router**: Navegación entre páginas
- **Axios**: Cliente HTTP para API
- **Recharts**: Biblioteca de gráficos
- **CSS Variables**: Sistema de diseño consistente

## 📊 **Endpoints de la API Utilizados**

- `GET /properties` - Lista de propiedades con filtros
- `GET /properties/:id` - Detalle de una propiedad
- `GET /analytics/avg-price-by-town` - Datos para el dashboard

## 🎯 **Mejoras Implementadas**

### ✅ **UX/UI**
- Diseño minimalista con colores relajados
- Navegación intuitiva y responsive
- Estados de carga y error mejorados
- Transiciones suaves y animaciones

### ✅ **Funcionalidad**
- Filtros avanzados en la lista de propiedades
- Paginación para mejor rendimiento
- Múltiples tipos de gráficos en el dashboard
- Manejo robusto de errores

### ✅ **Performance**
- Lazy loading de componentes
- Optimización de re-renders
- CSS optimizado con variables
- Responsive design eficiente

### ✅ **Accesibilidad**
- Contraste adecuado en colores
- Navegación por teclado
- Etiquetas semánticas
- Estados de foco visibles

## 🎨 **Comentarios del Diseño**

Cada componente incluye comentarios detallados explicando:
- **Estructura del componente**: Organización del código
- **Estados y efectos**: Manejo de datos y ciclo de vida
- **Estilos y responsive**: Adaptaciones para diferentes pantallas
- **Funcionalidades específicas**: Características únicas de cada vista

El diseño sigue principios de **simplicidad**, **consistencia** y **usabilidad**, creando una experiencia visual relajante y funcional para los usuarios.
