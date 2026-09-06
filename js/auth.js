/**
 * ReservaRest - Night Lounge
 * auth.js - Autenticación, Hashing SHA-256, Gestión de Sesiones y Control de Acceso basado en Roles (RBAC)
 * Compatible tanto con carga directa (file://) como servidores web (http://)
 */

(function () {
    'use strict';

    // Extraer helpers desde StorageModule
    const {
        STORAGE_KEYS,
        sha256,
        saveSecureSession,
        getValidSession,
        clearSession,
        getStorage,
        setStorage,
        logAudit
    } = window.StorageModule;

    // Matriz de permisos por rol
    const ROLE_PERMISSIONS = {
        admin: ['dashboard', 'tables', 'reservations', 'orders', 'kitchen', 'dispatch', 'users'],
        mesero: ['dashboard', 'tables', 'reservations', 'orders', 'dispatch'],
        cocina: ['dashboard', 'kitchen'],
        despacho: ['dashboard', 'dispatch']
    };

    const ROLE_LABELS = {
        admin: 'Administrador Master',
        mesero: 'Capitán / Mesero Lounge',
        cocina: 'Chef & Mixólogo (Cocina/Bar)',
        despacho: 'Runner / Despacho'
    };

    /**
     * Precarga y asegura los usuarios demo iniciales con sus contraseñas hasheadas en SHA-256.
     */
    async function initializeAuth() {
        const existingUsers = getStorage(STORAGE_KEYS.USERS, null);
        if (!existingUsers || existingUsers.length === 0) {
            const defaultUsers = [
                {
                    id: 'USR-001',
                    username: 'admin',
                    name: 'Alexander Sterling (VIP Manager)',
                    role: 'admin',
                    passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
                    avatar: '👑',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'USR-002',
                    username: 'mesero',
                    name: 'Valeria Mendoza (Hostess & Mesera)',
                    role: 'mesero',
                    passwordHash: '51838d20209b0878a87141aa9f5c001db79c9c130a4c2f6192f1bcc5ced778cc', // mesero123
                    avatar: '🍸',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'USR-003',
                    username: 'cocina',
                    name: 'Chef Marcus & Mixólogo Jean',
                    role: 'cocina',
                    passwordHash: '17fb2b2ef0554390dfdcb2eb9099e1279e12bd4b4b01fb33a1d5f4c0ce15e85c', // cocina123
                    avatar: '🔥',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'USR-004',
                    username: 'despacho',
                    name: 'Leo Navarro (Lounge Runner)',
                    role: 'despacho',
                    passwordHash: '861c7061d0b37a55c93270f41a412d33ed9600a5309a1b75b4f58147680e1c82', // despacho123
                    avatar: '🚀',
                    createdAt: new Date().toISOString()
                }
            ];
            setStorage(STORAGE_KEYS.USERS, defaultUsers);
            logAudit('INIT_AUTH', 'Usuarios demo inicializados con credenciales SHA-256');
        }
    }

    /**
     * Autentica un usuario verificando el hash SHA-256 de la contraseña proporcionada.
     * @param {string} username 
     * @param {string} plainPassword 
     * @returns {Promise<{success: boolean, message?: string, user?: object}>}
     */
    async function login(username, plainPassword) {
        if (!username || !plainPassword) {
            return { success: false, message: 'Ingresa tu usuario y contraseña nocturna.' };
        }

        const users = getStorage(STORAGE_KEYS.USERS, []);
        const cleanUsername = username.trim().toLowerCase();
        const user = users.find(u => u.username.toLowerCase() === cleanUsername);

        if (!user) {
            return { success: false, message: 'Credenciales inválidas. Verifica tu usuario.' };
        }

        const inputHash = await sha256(plainPassword);
        if (inputHash !== user.passwordHash) {
            logAudit('LOGIN_FAILED', `Intento fallido para usuario: ${cleanUsername}`, cleanUsername);
            return { success: false, message: 'Contraseña incorrecta para el acceso Lounge.' };
        }

        await saveSecureSession(user);
        logAudit('LOGIN_SUCCESS', `Sesión iniciada como ${user.role} (${user.name})`, user.username);
        return { success: true, user };
    }

    /**
     * Cierra la sesión activa de forma segura.
     */
    async function logout() {
        const current = await getValidSession();
        if (current) {
            logAudit('LOGOUT', 'Sesión cerrada por el usuario', current.username);
        }
        clearSession();
    }

    /**
     * Obtiene el usuario autenticado en la sesión actual.
     * @returns {Promise<object|null>}
     */
    async function getCurrentUser() {
        return await getValidSession();
    }

    /**
     * Verifica si el rol actual cuenta con permiso para acceder a una sección.
     * @param {string} role 
     * @param {string} moduleKey 
     * @returns {boolean}
     */
    function hasPermission(role, moduleKey) {
        if (!role || !ROLE_PERMISSIONS[role]) return false;
        return ROLE_PERMISSIONS[role].includes(moduleKey);
    }

    /**
     * Registra un nuevo miembro del equipo Lounge (Solo permitido por rol admin).
     * @param {string} username 
     * @param {string} plainPassword 
     * @param {string} name 
     * @param {string} role 
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async function registerUser(username, plainPassword, name, role) {
        const session = await getValidSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'Acción no autorizada. Se requiere permiso de Administrador.' };
        }

        const cleanUser = username.trim().toLowerCase();
        if (!cleanUser || cleanUser.length < 3) {
            return { success: false, message: 'El usuario debe tener al menos 3 caracteres.' };
        }
        if (!plainPassword || plainPassword.length < 4) {
            return { success: false, message: 'La contraseña debe tener al menos 4 caracteres.' };
        }
        if (!ROLE_PERMISSIONS[role]) {
            return { success: false, message: 'Rol inválido especificado.' };
        }

        const users = getStorage(STORAGE_KEYS.USERS, []);
        if (users.some(u => u.username.toLowerCase() === cleanUser)) {
            return { success: false, message: 'El nombre de usuario ya está registrado en el sistema.' };
        }

        const avatars = { admin: '👑', mesero: '🍸', cocina: '🔥', despacho: '🚀' };

        const newUser = {
            id: 'USR-' + Date.now().toString(36).toUpperCase(),
            username: cleanUser,
            name: name.trim() || cleanUser,
            role,
            passwordHash: await sha256(plainPassword),
            avatar: avatars[role] || '✨',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        setStorage(STORAGE_KEYS.USERS, users);
        logAudit('CREATE_USER', `Usuario creado: ${cleanUser} con rol ${role}`, session.username);
        return { success: true, message: `Usuario ${cleanUser} creado con éxito.` };
    }

    /**
     * Obtiene la lista completa de usuarios (excluyendo contraseñas o hashes).
     * @returns {Array<object>}
     */
    function listUsers() {
        const users = getStorage(STORAGE_KEYS.USERS, []);
        return users.map(({ passwordHash, ...safeUser }) => safeUser);
    }

    // Exportación al objeto global de la ventana
    const AuthModule = {
        ROLE_PERMISSIONS,
        ROLE_LABELS,
        initializeAuth,
        login,
        logout,
        getCurrentUser,
        hasPermission,
        registerUser,
        listUsers
    };

    window.AuthModule = AuthModule;
})();
