🏙️ Urbanytics - Plataforma de Análisis Inmobiliario
Urbanytics es una aplicación web full-stack diseñada para el análisis inteligente del mercado inmobiliario. La plataforma permite a los usuarios explorar propiedades, visualizar tendencias de mercado a través de un dashboard interactivo y obtener tasaciones de precios en tiempo real mediante un modelo de Machine Learning integrado.

Este proyecto fue construido como una demostración de competencia en arquitectura de microservicios, desarrollo backend/frontend y la operacionalización de modelos de IA (MLOps).

✨ Características Principales
Dashboard Interactivo: Visualiza KPIs y métricas del mercado con filtros avanzados (precio, zona, tipo).

Predicción de Precios: Un formulario que consume un microservicio de Machine Learning para obtener valuaciones automáticas de propiedades.

Visualización Geográfica: Un mapa interactivo que muestra la distribución espacial de las propiedades.

API Robusta: Un backend de alto rendimiento que sirve todos los datos de manera eficiente.

Arquitectura de Microservicios: El sistema está desacoplado en servicios independientes (backend, frontend, ML) para mayor escalabilidad y mantenibilidad.

🛠️ Stack Tecnológico y Arquitectura
Este proyecto utiliza una arquitectura de microservicios contenerizada, orquestada con Docker Compose.

Frontend: React (con Vite) y Material-UI (MUI)

Backend For Frontend (BFF): Node.js con Express.js

API Principal: Go con Gin Gonic

Servicio de Machine Learning: Python con FastAPI y Scikit-learn

Base de Datos: PostgreSQL

Contenerización: Docker y Docker Compose

🚀 Cómo Empezar
Para levantar el proyecto de forma local, asegúrate de tener Docker y Docker Compose instalados.

Clona el repositorio:

git clone https://github.com/tu-usuario/urbanitycs.git
cd urbanitycs

Levanta todos los servicios:

docker-compose up --build

Accede a la aplicación:

El frontend estará disponible en http://localhost:3000 (o el puerto que configures).
