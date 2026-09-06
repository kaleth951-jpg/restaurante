/**
 * ReservaRest - Night Lounge
 * storage.js - Persistencia Segura, Sanitización XSS y Validación Criptográfica en localStorage
 * Compatible tanto con carga directa (file://) como servidores web (http://)
 */

(function () {
    'use strict';

    const STORAGE_KEYS = {
        USERS: 'reserva_rest_users',
        TABLES: 'reserva_rest_tables',
        MENU: 'reserva_rest_menu',
        RESERVATIONS: 'reserva_rest_reservations',
        ORDERS: 'reserva_rest_orders',
        SESSION: 'restaurante_session',
        AUDIT_LOG: 'reserva_rest_audit'
    };

    const SECRET_SALT = 'RR_NIGHT_LOUNGE_SEC_2026_!#9d4edd';

    /**
     * Sanitiza cualquier texto para prevenir ataques XSS al renderizar en el DOM.
     * @param {string|any} str 
     * @returns {string}
     */
    function sanitizeHTML(str) {
        if (str === null || str === undefined) return '';
        const stringified = String(str);
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            "/": '&#x2F;'
        };
        return stringified.replace(/[&<>"'/]/g, (match) => map[match]);
    }

    /**
     * Algoritmo SHA-256 nativo en JavaScript puro como respaldo
     * Garantiza funcionamiento total incluso en navegadores que bloquean crypto.subtle en protocolo file://
     */
    function jsSha256(ascii) {
        function rightRotate(value, amount) {
            return (value >>> amount) | (value << (32 - amount));
        }
        const mathPow = Math.pow;
        const maxWord = mathPow(2, 32);
        let i, j;
        const result = [];
        const words = [];
        const asciiLength = ascii.length * 8;
        let hash = [];
        const k = [];
        let primeCounter = 0;
        const isComposite = {};
        for (let candidate = 2; primeCounter < 64; candidate++) {
            if (!isComposite[candidate]) {
                for (i = 0; i < 312; i += candidate) {
                    isComposite[i] = true;
                }
                hash[primeCounter] = ((candidate ** 0.5 - Math.floor(candidate ** 0.5)) * maxWord) | 0;
                k[primeCounter++] = ((candidate ** (1 / 3) - Math.floor(candidate ** (1 / 3))) * maxWord) | 0;
            }
        }
        hash = hash.slice(0, 8);
        words.length = ((asciiLength + 64 >>> 9) << 4) + 16;
        for (i = 0; i < ascii.length; i++) {
            words[i >>> 2] |= (ascii.charCodeAt(i) & 255) << (24 - 8 * (i % 4));
        }
        words[ascii.length >>> 2] |= 128 << (24 - 8 * (ascii.length % 4));
        words[words.length - 1] = asciiLength;
        for (j = 0; j < words.length;) {
            const w = words.slice(j, j += 16);
            const oldHash = hash.slice(0);
            for (i = 0; i < 64; i++) {
                const w15 = w[i - 15], w2 = w[i - 2];
                const a = hash[0], e = hash[4];
                const temp1 = hash[7]
                    + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
                    + ((e & hash[5]) ^ ((~e) & hash[6]))
                    + k[i]
                    + (w[i] = (i < 16) ? (w[i] | 0) : (
                        w[i - 16]
                        + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
                        + w[i - 7]
                        + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
                    ) | 0);
                const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
                    + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
                hash = [(temp1 + temp2) | 0, a, hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
            }
            for (i = 0; i < 8; i++) {
                hash[i] = (hash[i] + oldHash[i]) | 0;
            }
        }
        for (i = 0; i < 8; i++) {
            for (j = 3; j >= 0; j--) {
                const b = (hash[i] >> (8 * j)) & 255;
                result.push((b < 16 ? '0' : '') + b.toString(16));
            }
        }
        return result.join('');
    }

    /**
     * Calcula un Hash SHA-256 usando Web Crypto API cuando esté disponible o fallback a JavaScript puro.
     * @param {string} message 
     * @returns {Promise<string>} Hexadecimal del hash
     */
    async function sha256(message) {
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            try {
                const encoder = new TextEncoder();
                const data = encoder.encode(message);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            } catch (e) {
                // fallback al algoritmo puro en JS
            }
        }
        return jsSha256(message);
    }

    /**
     * Genera una firma/checksum para la sesión para impedir adulteraciones desde DevTools.
     * @param {object} sessionData 
     * @returns {Promise<string>}
     */
    async function generateSessionChecksum(sessionData) {
        const payload = `${sessionData.id}::${sessionData.username}::${sessionData.role}::${sessionData.loginTime}::${SECRET_SALT}`;
        return jsSha256(payload);
    }

    /**
     * Guarda la sesión firmada en localStorage.
     * @param {object} user 
     */
    async function saveSecureSession(user) {
        const sessionData = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            loginTime: Date.now()
        };
        const checksum = await generateSessionChecksum(sessionData);
        const securePayload = {
            data: sessionData,
            checksum: checksum
        };
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(securePayload));
    }

    /**
     * Obtiene y valida la integridad de la sesión activa en localStorage.
     * Si ha sido alterada en DevTools o no existe, retorna null.
     * @returns {Promise<object|null>}
     */
    async function getValidSession() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
            if (!raw) return null;

            const securePayload = JSON.parse(raw);
            if (!securePayload || !securePayload.data || !securePayload.checksum) {
                clearSession();
                return null;
            }

            const calculatedChecksum = await generateSessionChecksum(securePayload.data);
            if (calculatedChecksum !== securePayload.checksum) {
                console.warn('[SEGURIDAD] Manipulación de sesión detectada en localStorage.');
                clearSession();
                return null;
            }

            return securePayload.data;
        } catch (err) {
            console.error('[STORAGE] Error validando sesión:', err);
            clearSession();
            return null;
        }
    }

    /**
     * Elimina la sesión actual.
     */
    function clearSession() {
        try {
            localStorage.removeItem(STORAGE_KEYS.SESSION);
        } catch (e) {
            console.warn('[STORAGE] No se pudo limpiar sesión:', e);
        }
    }

    /**
     * Wrapper de lectura segura para colecciones JSON en localStorage.
     * @param {string} key 
     * @param {any} defaultValue 
     * @returns {any}
     */
    function getStorage(key, defaultValue = []) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : defaultValue;
        } catch (e) {
            console.error(`[STORAGE] Error leyendo ${key}:`, e);
            return defaultValue;
        }
    }

    /**
     * Wrapper de escritura para colecciones JSON en localStorage.
     * @param {string} key 
     * @param {any} value 
     */
    function setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`[STORAGE] Error escribiendo en ${key}:`, e);
        }
    }

    /**
     * Registra eventos en un log de auditoría persistente.
     * @param {string} action 
     * @param {string} details 
     * @param {string} username 
     */
    function logAudit(action, details, username = 'sistema') {
        const logs = getStorage(STORAGE_KEYS.AUDIT_LOG, []);
        const entry = {
            id: 'LOG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            timestamp: new Date().toISOString(),
            username,
            action,
            details
        };
        logs.unshift(entry);
        // Conservar los últimos 150 registros
        if (logs.length > 150) logs.pop();
        setStorage(STORAGE_KEYS.AUDIT_LOG, logs);
    }

    // Exportación al objeto global de la ventana
    const StorageModule = {
        STORAGE_KEYS,
        SECRET_SALT,
        sanitizeHTML,
        sha256,
        generateSessionChecksum,
        saveSecureSession,
        getValidSession,
        clearSession,
        getStorage,
        setStorage,
        logAudit
    };

    window.StorageModule = StorageModule;
})();
