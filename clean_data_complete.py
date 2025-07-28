#!/usr/bin/env python3
"""
Script completo de limpieza de datos para Urbanytics
Incluye todas las operaciones de limpieza realizadas durante el desarrollo
"""

import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def clean_data_complete():
    """
    Función principal que ejecuta todas las operaciones de limpieza
    """
    logger.info("🚀 Iniciando limpieza completa de datos...")
    
    # Conexión a la base de datos
    DATABASE_URL = "postgresql://user_urbanytics:password_urbanytics@localhost:5432/db_urbanytics"
    
    try:
        engine = create_engine(DATABASE_URL)
        logger.info("✅ Conexión a la base de datos establecida")
    except Exception as e:
        logger.error(f"❌ Error al conectar a la base de datos: {e}")
        return
    
    # 1. LEER DATOS ORIGINALES
    logger.info("📖 Leyendo datos originales...")
    try:
        df = pd.read_csv('Real_Estate_Sales_2001-2020_GL.csv')
        logger.info(f"✅ Datos cargados: {len(df)} registros, {len(df.columns)} columnas")
    except Exception as e:
        logger.error(f"❌ Error al leer el archivo CSV: {e}")
        return
    
    # Mostrar información inicial
    logger.info(f"📊 Información inicial:")
    logger.info(f"   - Registros: {len(df):,}")
    logger.info(f"   - Columnas: {list(df.columns)}")
    
    # 2. LIMPIEZA BÁSICA DE DATOS
    logger.info("🧹 Iniciando limpieza básica...")
    
    # Eliminar registros con valores nulos en columnas críticas
    initial_count = len(df)
    df = df.dropna(subset=['Serial Number', 'Sale Amount', 'Town'])
    logger.info(f"   - Eliminados registros con valores nulos críticos: {initial_count - len(df)} registros")
    
    # 3. LIMPIEZA DE PRECIOS
    logger.info("💰 Limpiando datos de precios...")
    
    # Eliminar registros con precios <= 0
    before_price = len(df)
    df = df[df['Sale Amount'] > 0]
    logger.info(f"   - Eliminados registros con precio <= 0: {before_price - len(df)} registros")
    
    # Eliminar outliers extremos de precio (más de 3 desviaciones estándar)
    price_mean = df['Sale Amount'].mean()
    price_std = df['Sale Amount'].std()
    price_upper_limit = price_mean + (3 * price_std)
    price_lower_limit = price_mean - (3 * price_std)
    
    before_outliers = len(df)
    df = df[(df['Sale Amount'] >= price_lower_limit) & (df['Sale Amount'] <= price_upper_limit)]
    logger.info(f"   - Eliminados outliers de precio: {before_outliers - len(df)} registros")
    logger.info(f"   - Rango de precios válido: ${price_lower_limit:,.0f} - ${price_upper_limit:,.0f}")
    
    # 4. LIMPIEZA DE RATIO DE VENTA
    logger.info("📈 Limpiando ratio de venta...")
    
    # Eliminar registros con ratio de venta inválido
    before_ratio = len(df)
    df = df[df['Sales Ratio'] > 0]
    logger.info(f"   - Eliminados registros con ratio de venta <= 0: {before_ratio - len(df)} registros")
    
    # Eliminar outliers extremos de ratio (más de 3 desviaciones estándar)
    ratio_mean = df['Sales Ratio'].mean()
    ratio_std = df['Sales Ratio'].std()
    ratio_upper_limit = ratio_mean + (3 * ratio_std)
    ratio_lower_limit = max(0.1, ratio_mean - (3 * ratio_std))  # Mínimo 0.1
    
    before_ratio_outliers = len(df)
    df = df[(df['Sales Ratio'] >= ratio_lower_limit) & (df['Sales Ratio'] <= ratio_upper_limit)]
    logger.info(f"   - Eliminados outliers de ratio: {before_ratio_outliers - len(df)} registros")
    logger.info(f"   - Rango de ratio válido: {ratio_lower_limit:.2f} - {ratio_upper_limit:.2f}")
    
    # 5. LIMPIEZA DE TIEMPO HASTA VENTA
    logger.info("⏰ Limpiando tiempo hasta venta...")
    
    # Eliminar registros con tiempo negativo
    before_time = len(df)
    df = df[df['Years Until Sold'] >= 0]
    logger.info(f"   - Eliminados registros con tiempo negativo: {before_time - len(df)} registros")
    
    # Eliminar outliers extremos de tiempo (más de 20 años)
    before_time_outliers = len(df)
    df = df[df['Years Until Sold'] <= 20]
    logger.info(f"   - Eliminados registros con tiempo > 20 años: {before_time_outliers - len(df)} registros")
    
    # 6. LIMPIEZA DE FECHAS
    logger.info("📅 Limpiando fechas...")
    
    # Convertir Date Recorded a datetime y eliminar fechas inválidas
    before_dates = len(df)
    df['Date Recorded'] = pd.to_datetime(df['Date Recorded'], errors='coerce')
    df = df.dropna(subset=['Date Recorded'])
    logger.info(f"   - Eliminados registros con fechas inválidas: {before_dates - len(df)} registros")
    
    # 7. LIMPIEZA DE TIPOS DE PROPIEDAD
    logger.info("🏠 Limpiando tipos de propiedad...")
    
    # Mostrar tipos de propiedad antes de la limpieza
    logger.info(f"   - Tipos de propiedad antes: {df['Property Type'].value_counts().to_dict()}")
    
    # Eliminar registros con 'Nan' o valores nulos en Property Type
    before_property_type = len(df)
    df = df[df['Property Type'].notna() & (df['Property Type'] != 'Nan')]
    logger.info(f"   - Eliminados registros con Property Type 'Nan' o nulo: {before_property_type - len(df)} registros")
    
    # 8. LIMPIEZA DE TIPOS RESIDENCIALES
    logger.info("🏘️ Limpiando tipos residenciales...")
    
    # Mostrar tipos residenciales antes de la limpieza
    logger.info(f"   - Tipos residenciales antes: {df['Residential Type'].value_counts().to_dict()}")
    
    # Eliminar registros con 'Nan' en Residential Type
    before_residential = len(df)
    df = df[df['Residential Type'].notna() & (df['Residential Type'] != 'Nan')]
    logger.info(f"   - Eliminados registros con Residential Type 'Nan': {before_residential - len(df)} registros")
    
    # 9. LIMPIEZA DE CIUDADES
    logger.info("🏙️ Limpiando ciudades...")
    
    # Eliminar registros con ciudades vacías o nulas
    before_towns = len(df)
    df = df[df['Town'].notna() & (df['Town'].str.strip() != '')]
    logger.info(f"   - Eliminados registros con ciudades vacías: {before_towns - len(df)} registros")
    
    # Eliminar registros con ciudades problemáticas específicas
    problematic_towns = ['***Unknown***', 'Unknown', 'N/A', 'NA']
    before_problematic = len(df)
    df = df[~df['Town'].isin(problematic_towns)]
    logger.info(f"   - Eliminados registros con ciudades problemáticas: {before_problematic - len(df)} registros")
    
    # 10. LIMPIEZA DE AÑOS
    logger.info("📅 Limpiando años...")
    
    # Eliminar registros con años inválidos
    before_years = len(df)
    df = df[df['List Year'].notna() & (df['List Year'] >= 2000) & (df['List Year'] <= 2020)]
    logger.info(f"   - Eliminados registros con años inválidos: {before_years - len(df)} registros")
    
    # 11. LIMPIEZA DE DIRECCIONES
    logger.info("📍 Limpiando direcciones...")
    
    # Eliminar registros con direcciones vacías
    before_addresses = len(df)
    df = df[df['Address'].notna() & (df['Address'].str.strip() != '')]
    logger.info(f"   - Eliminados registros con direcciones vacías: {before_addresses - len(df)} registros")
    
    # 12. LIMPIEZA DE VALORES AVALUADOS
    logger.info("💵 Limpiando valores avaluados...")
    
    # Eliminar registros con valores avaluados <= 0
    before_assessed = len(df)
    df = df[df['Assessed Value'] > 0]
    logger.info(f"   - Eliminados registros con valor avaluado <= 0: {before_assessed - len(df)} registros")
    
    # 13. RENOMBRAR COLUMNAS
    logger.info("🏷️ Renombrando columnas...")
    
    column_mapping = {
        'Serial Number': 'serial_number',
        'List Year': 'list_year',
        'Date Recorded': 'date_recorded',
        'Town': 'town',
        'Address': 'address',
        'Assessed Value': 'assessed_value',
        'Sale Amount': 'sale_amount',
        'Sales Ratio': 'sales_ratio',
        'Property Type': 'property_type',
        'Residential Type': 'residential_type',
        'Years Until Sold': 'years_until_sold'
    }
    
    df = df.rename(columns=column_mapping)
    logger.info("   - Columnas renombradas exitosamente")
    
    # 14. CONVERTIR TIPOS DE DATOS
    logger.info("🔄 Convirtiendo tipos de datos...")
    
    # Convertir tipos numéricos
    df['serial_number'] = df['serial_number'].astype('int64')
    df['list_year'] = df['list_year'].astype('int64')
    df['assessed_value'] = df['assessed_value'].astype('float64')
    df['sale_amount'] = df['sale_amount'].astype('float64')
    df['sales_ratio'] = df['sales_ratio'].astype('float64')
    df['years_until_sold'] = df['years_until_sold'].astype('int64')
    
    # Convertir fecha a string en formato ISO
    df['date_recorded'] = df['date_recorded'].dt.strftime('%Y-%m-%d')
    
    logger.info("   - Tipos de datos convertidos exitosamente")
    
    # 15. ELIMINAR DUPLICADOS
    logger.info("🔄 Eliminando duplicados...")
    
    before_duplicates = len(df)
    df = df.drop_duplicates(subset=['serial_number'])
    logger.info(f"   - Eliminados duplicados: {before_duplicates - len(df)} registros")
    
    # 16. ORDENAR DATOS
    logger.info("📊 Ordenando datos...")
    
    df = df.sort_values(['list_year', 'town', 'sale_amount'])
    logger.info("   - Datos ordenados por año, ciudad y precio")
    
    # 17. ESTADÍSTICAS FINALES
    logger.info("📈 Estadísticas finales:")
    logger.info(f"   - Registros finales: {len(df):,}")
    logger.info(f"   - Reducción total: {initial_count - len(df):,} registros ({((initial_count - len(df)) / initial_count * 100):.1f}%)")
    logger.info(f"   - Tipos de propiedad: {df['property_type'].nunique()}")
    logger.info(f"   - Ciudades únicas: {df['town'].nunique()}")
    logger.info(f"   - Rango de años: {df['list_year'].min()} - {df['list_year'].max()}")
    logger.info(f"   - Rango de precios: ${df['sale_amount'].min():,.0f} - ${df['sale_amount'].max():,.0f}")
    
    # 18. GUARDAR DATOS LIMPIOS
    logger.info("💾 Guardando datos limpios...")
    
    try:
        # Eliminar tabla existente si existe
        with engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS properties"))
            conn.commit()
        
        # Crear nueva tabla con datos limpios
        df.to_sql('properties', engine, if_exists='replace', index=False)
        logger.info("✅ Datos limpios guardados en la base de datos")
        
    except Exception as e:
        logger.error(f"❌ Error al guardar en la base de datos: {e}")
        return
    
    # 19. VERIFICACIÓN FINAL
    logger.info("🔍 Verificación final...")
    
    try:
        with engine.connect() as conn:
            # Verificar que la tabla se creó correctamente
            result = conn.execute(text("SELECT COUNT(*) FROM properties"))
            count = result.scalar()
            logger.info(f"   - Registros en BD: {count:,}")
            
            # Verificar tipos de propiedad
            result = conn.execute(text("SELECT property_type, COUNT(*) FROM properties GROUP BY property_type ORDER BY COUNT(*) DESC"))
            property_types = result.fetchall()
            logger.info(f"   - Tipos de propiedad finales: {dict(property_types)}")
            
            # Verificar ciudades
            result = conn.execute(text("SELECT COUNT(DISTINCT town) FROM properties"))
            town_count = result.scalar()
            logger.info(f"   - Ciudades únicas: {town_count}")
            
    except Exception as e:
        logger.error(f"❌ Error en verificación final: {e}")
        return
    
    logger.info("🎉 ¡Limpieza de datos completada exitosamente!")
    logger.info("📊 Los datos están listos para el análisis en Urbanytics")

if __name__ == "__main__":
    clean_data_complete() 