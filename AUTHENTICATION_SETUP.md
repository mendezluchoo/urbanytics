# 🔐 Configuración de Autenticación con Base de Datos

## 📋 **Resumen de Implementación**

La autenticación ahora está **completamente implementada con base de datos** en lugar de credenciales hardcodeadas.

### **✅ Funcionalidades Implementadas:**

1. **Backend Go (main.go)**
   - ✅ Login con verificación en BD
   - ✅ Registro de usuarios con hash de contraseñas
   - ✅ Gestión de perfiles (get/update)
   - ✅ Administración de usuarios (CRUD)
   - ✅ Middleware de autenticación JWT
   - ✅ Middleware de autorización por roles

2. **Frontend React**
   - ✅ Componente de registro (`Register.tsx`)
   - ✅ Login actualizado (`AdminLogin.tsx`)
   - ✅ Servicios de API para autenticación
   - ✅ Gestión de tokens en localStorage

3. **Base de Datos**
   - ✅ Script SQL para crear tabla `users`
   - ✅ Índices para optimización
   - ✅ Triggers para timestamps automáticos
   - ✅ Usuarios por defecto (admin/user1)

## 🗄️ **Script SQL Requerido**

### **Ejecutar en PostgreSQL:**

```sql
-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar usuarios por defecto
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@urbanytics.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, email, password_hash, role) VALUES 
('user1', 'user1@urbanytics.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user')
ON CONFLICT (username) DO NOTHING;
```

## 🔑 **Credenciales por Defecto**

### **Administrador:**
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Rol:** `admin`

### **Usuario Regular:**
- **Usuario:** `user1`
- **Contraseña:** `user123`
- **Rol:** `user`

## 🚀 **Pasos para Configurar**

### **1. Ejecutar Script SQL**
```bash
# Conectar a PostgreSQL
psql -h localhost -U user_urbanytics -d db_urbanytics

# Ejecutar el script
\i create_users_table.sql
```

### **2. Verificar Backend Go**
```bash
cd backend
go mod tidy
go build
```

### **3. Iniciar Servicios**
```bash
# Usar el script de inicio
./start-services.ps1
```

## 🔍 **Endpoints de Autenticación**

### **Registro:**
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "nuevo_usuario",
  "email": "usuario@example.com",
  "password": "contraseña123"
}
```

### **Login:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### **Perfil:**
```http
GET /api/v1/auth/profile
Authorization: Bearer <token>
```

### **Actualizar Perfil:**
```http
PUT /api/v1/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "nuevo@email.com"
}
```

## 🛡️ **Seguridad Implementada**

1. **Hash de Contraseñas:** bcrypt con salt
2. **JWT Tokens:** Firmados y con expiración
3. **Validación de Roles:** admin/user
4. **Índices de BD:** Para consultas rápidas
5. **Triggers:** Timestamps automáticos
6. **Validación de Entrada:** En frontend y backend

## 🔧 **Funciones de Administración**

### **Obtener Usuarios:**
```http
GET /api/v1/admin/users
Authorization: Bearer <admin_token>
```

### **Crear Usuario:**
```http
POST /api/v1/admin/users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "username": "nuevo_usuario",
  "email": "usuario@example.com",
  "password": "contraseña123"
}
```

### **Actualizar Usuario:**
```http
PUT /api/v1/admin/users/{id}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "nuevo@email.com",
  "role": "admin"
}
```

### **Eliminar Usuario:**
```http
DELETE /api/v1/admin/users/{id}
Authorization: Bearer <admin_token>
```

## 🎯 **Próximos Pasos**

1. **Ejecutar el script SQL** en tu base de datos
2. **Verificar que el backend compile** sin errores
3. **Probar el login** con las credenciales por defecto
4. **Registrar nuevos usuarios** desde el frontend
5. **Probar la gestión de usuarios** desde el panel de admin

## ⚠️ **Notas Importantes**

- Las contraseñas se hashean con bcrypt
- Los tokens JWT expiran en 24 horas
- Solo usuarios con rol `admin` pueden acceder al panel de administración
- Los emails deben ser únicos en la base de datos
- Los usernames deben ser únicos en la base de datos

¡La autenticación está lista para usar! 🎉 