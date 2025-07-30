/**
 * Rutas de administración para el BFF
 * Proporciona endpoints para gestión de usuarios y propiedades (solo admin)
 */

const express = require('express');
const router = express.Router();

// Importar servicios
const backendService = require('../services/backendService');
const cacheService = require('../services/cacheService');

/**
 * GET /api/admin/users
 * Obtener lista de usuarios (solo admin)
 */
router.get('/users', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token de autorización requerido'
            });
        }

        const result = await backendService.getUsers(token);

        if (!result.success) {
            return res.status(result.status).json({
                success: false,
                error: result.error
            });
        }

        res.json({
            success: true,
            data: result.data,
            message: 'Usuarios obtenidos exitosamente'
        });

    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/admin/users
 * Crear nuevo usuario (solo admin)
 */
router.post('/users', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token de autorización requerido'
            });
        }

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

        const result = await backendService.createUser({ username, email, password, role }, token);

        if (!result.success) {
            return res.status(result.status).json({
                success: false,
                error: result.error
            });
        }

        res.status(201).json({
            success: true,
            data: result.data,
            message: 'Usuario creado exitosamente'
        });

    } catch (error) {
        console.error('Error creando usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * PUT /api/admin/users/:id
 * Actualizar usuario (solo admin)
 */
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role } = req.body;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token de autorización requerido'
            });
        }

        // Validar datos de entrada
        if (!username || !email) {
            return res.status(400).json({
                success: false,
                error: 'Username y email son requeridos'
            });
        }

        const result = await backendService.updateUser(id, { username, email, role }, token);

        if (!result.success) {
            return res.status(result.status).json({
                success: false,
                error: result.error
            });
        }

        res.json({
            success: true,
            data: result.data,
            message: 'Usuario actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * DELETE /api/admin/users/:id
 * Eliminar usuario (solo admin)
 */
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token de autorización requerido'
            });
        }

        const result = await backendService.deleteUser(id, token);

        if (!result.success) {
            return res.status(result.status).json({
                success: false,
                error: result.error
            });
        }

        res.json({
            success: true,
            data: result.data,
            message: 'Usuario eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/admin/properties
 * Crear nueva propiedad (solo admin)
 */
router.post('/properties', async (req, res) => {
    try {
        const propertyData = req.body;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token de autorización requerido'
            });
        }

        const result = await backendService.createProperty(propertyData, token);

        if (!result.success) {
            return res.status(result.status).json({
                success: false,
                error: result.error
            });
        }

        // Limpiar caché de propiedades
        await cacheService.deletePattern('properties:*');

        res.status(201).json({
            success: true,
            data: result.data,
            message: 'Propiedad creada exitosamente'
        });

    } catch (error) {
        console.error('Error creando propiedad:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * PUT /api/admin/properties/:id
 * Actualizar propiedad (solo admin)
 */
router.put('/properties/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const propertyData = req.body;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token de autorización requerido'
            });
        }

        const result = await backendService.updateProperty(id, propertyData, token);

        if (!result.success) {
            return res.status(result.status).json({
                success: false,
                error: result.error
            });
        }

        // Limpiar caché de propiedades
        await cacheService.deletePattern('properties:*');

        res.json({
            success: true,
            data: result.data,
            message: 'Propiedad actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error actualizando propiedad:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * DELETE /api/admin/properties/:id
 * Eliminar propiedad (solo admin)
 */
router.delete('/properties/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token de autorización requerido'
            });
        }

        const result = await backendService.deleteProperty(id, token);

        if (!result.success) {
            return res.status(result.status).json({
                success: false,
                error: result.error
            });
        }

        // Limpiar caché de propiedades
        await cacheService.deletePattern('properties:*');

        res.json({
            success: true,
            data: result.data,
            message: 'Propiedad eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando propiedad:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

module.exports = router; 