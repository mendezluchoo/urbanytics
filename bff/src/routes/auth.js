/**
 * Rutas de autenticación para el BFF
 * Proporciona endpoints para login, registro y gestión de perfiles
 */

const express = require('express');
const router = express.Router();

// Importar servicios
const backendService = require('../services/backendService');
const cacheService = require('../services/cacheService');

/**
 * POST /api/auth/login
 * Iniciar sesión de usuario
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validar datos de entrada
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username y password son requeridos'
            });
        }

        // Llamar al backend
        const result = await backendService.login({ username, password });

        if (!result.success) {
            return res.status(result.status).json({
                success: false,
                error: result.error
            });
        }

        // Cachear información del usuario (opcional)
        const userData = result.data.user;
        const cacheKey = `user:${userData.id}`;
        await cacheService.setCache(cacheKey, userData, 3600); // 1 hora

        res.json({
            success: true,
            data: result.data,
            message: 'Login exitoso'
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/auth/register
 * Registrar nuevo usuario
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validar datos de entrada
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username, email y password son requeridos'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password debe tener al menos 6 caracteres'
            });
        }

        // Llamar al backend
        const result = await backendService.register({ username, email, password });

        if (!result.success) {
            return res.status(result.status).json({
                success: false,
                error: result.error
            });
        }

        res.status(201).json({
            success: true,
            data: result.data,
            message: 'Usuario registrado exitosamente'
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/auth/profile
 * Obtener perfil del usuario autenticado
 */
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token de autenticación requerido'
            });
        }

        // Llamar al backend
        const result = await backendService.getProfile(token);

        if (!result.success) {
            return res.status(result.status).json({
                success: false,
                error: result.error
            });
        }

        res.json({
            success: true,
            data: result.data,
            message: 'Perfil obtenido exitosamente'
        });

    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * PUT /api/auth/profile
 * Actualizar perfil del usuario autenticado
 */
router.put('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const profileData = req.body;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token de autenticación requerido'
            });
        }

        // Validar datos de entrada
        if (profileData.email && !isValidEmail(profileData.email)) {
            return res.status(400).json({
                success: false,
                error: 'Email inválido'
            });
        }

        // Llamar al backend
        const result = await backendService.updateProfile(profileData, token);

        if (!result.success) {
            return res.status(result.status).json({
                success: false,
                error: result.error
            });
        }

        // Invalidar caché del usuario
        const userData = result.data;
        const cacheKey = `user:${userData.user_id}`;
        await cacheService.deleteFromCache(cacheKey);

        res.json({
            success: true,
            data: result.data,
            message: 'Perfil actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/auth/logout
 * Cerrar sesión (invalidar token)
 */
router.post('/logout', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (token) {
            // Agregar token a lista negra (implementación básica)
            const blacklistKey = `blacklist:${token}`;
            await cacheService.setCache(blacklistKey, true, 86400); // 24 horas
        }

        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });

    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/auth/validate
 * Validar token de autenticación
 */
router.get('/validate', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token de autenticación requerido'
            });
        }

        // Verificar si el token está en lista negra
        const blacklistKey = `blacklist:${token}`;
        const isBlacklisted = await cacheService.getFromCache(blacklistKey);

        if (isBlacklisted) {
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }

        // Validar token con el backend
        const result = await backendService.getProfile(token);

        if (!result.success) {
            return res.status(result.status).json({
                success: false,
                error: result.error
            });
        }

        res.json({
            success: true,
            data: result.data,
            message: 'Token válido'
        });

    } catch (error) {
        console.error('Error validando token:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * Función auxiliar para validar email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

module.exports = router; 