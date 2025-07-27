import pandas as pd
from sqlalchemy import create_engine

# --- 1. CONFIGURACIÓN ---
db_user = "user_urbanytics"
db_password = "password_urbanytics"
db_host = "localhost"
db_port = "5432"
db_name = "db_urbanytics"

file_path = 'Real_Estate_Sales_2001-2020_GL.csv'
table_name = 'properties'

# --- 2. CONEXIÓN A LA BASE DE DATOS ---
connection_string = f'postgresql+psycopg2://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
engine = create_engine(connection_string)

try:
    # --- 3. LECTURA Y PREPARACIÓN DE DATOS ---
    print(f"Leyendo datos desde {file_path}...")
    df = pd.read_csv(file_path)

    # --- NUEVA LÍNEA PARA CORREGIR LA FECHA ---
    # Convierte la columna de fecha al formato que PostgreSQL entiende (YYYY-MM-DD)
    df['Date Recorded'] = pd.to_datetime(df['Date Recorded'], format='%m/%d/%Y').dt.strftime('%Y-%m-%d')

    # Renombra las columnas del DataFrame para que coincidan con la tabla SQL
    df = df.rename(columns={
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
        'Years until sold': 'years_until_sold'
    })

    # --- 4. CARGA DE DATOS A POSTGRESQL ---
    print(f"Cargando {len(df)} filas en la tabla '{table_name}'...")
    df.to_sql(table_name, engine, if_exists='replace', index=False)

    print("¡Carga de datos completada exitosamente!")

except Exception as e:
    print(f"Ocurrió un error: {e}")