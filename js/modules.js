/**
 * ReservaRest - Night Lounge
 * modules.js - Lógica de Negocio Completa, Inicialización de Datos y Renderizadores de Vistas
 * Compatible tanto con carga directa (file://) como servidores web (http://)
 */

(function () {
    'use strict';

    const {
        STORAGE_KEYS,
        sanitizeHTML,
        getStorage,
        setStorage,
        logAudit
    } = window.StorageModule;

const {
    initializeAuth,
    listUsers,
    registerUser,
    hasPermission
} = window.AuthModule;

/* ==========================================================================
   DATOS INICIALES DEMO (NIGHT LOUNGE AMBIENCE)
   ========================================================================== */

const INITIAL_TABLES = [
    { id: 'T-01', number: '01', name: 'Barra Neón 01', zone: 'Barra Central', capacity: 2, status: 'disponible', minConsumption: 30 },
    { id: 'T-02', number: '02', name: 'Barra Neón 02', zone: 'Barra Central', capacity: 2, status: 'ocupada', minConsumption: 30 },
    { id: 'T-03', number: '03', name: 'Cabina Velvet 03', zone: 'Salón Principal', capacity: 4, status: 'reservada', minConsumption: 70 },
    { id: 'T-04', number: '04', name: 'Cabina Velvet 04', zone: 'Salón Principal', capacity: 4, status: 'disponible', minConsumption: 70 },
    { id: 'T-05', number: '05', name: 'Sky Lounge 05', zone: 'Terraza Lounge', capacity: 6, status: 'ocupada', minConsumption: 120 },
    { id: 'T-06', number: '06', name: 'Sky Lounge 06', zone: 'Terraza Lounge', capacity: 4, status: 'disponible', minConsumption: 90 },
    { id: 'T-07', number: '07', name: 'Privé Black 07', zone: 'Zona VIP', capacity: 8, status: 'reservada', minConsumption: 220 },
    { id: 'T-08', number: '08', name: 'Imperial Gold 08', zone: 'Zona VIP', capacity: 10, status: 'disponible', minConsumption: 350 }
];

const INITIAL_MENU = [
    {
        id: 'MN-01',
        name: 'Smoked Old Fashioned de Roble',
        category: 'Coctelería de Autor',
        station: 'bar',
        price: 18.00,
        description: 'Bourbon premium infusionado en roble quemado, bitter de angostura y piel de naranja caramelizada.',
        icon: '🥃'
    },
    {
        id: 'MN-02',
        name: 'Electric Dragonfruit Mule',
        category: 'Coctelería de Autor',
        station: 'bar',
        price: 16.50,
        description: 'Mezcal artesanal oaxaqueño, pulpa de pitahaya rosa, cerveza de jengibre y escarcha de sal volcánica.',
        icon: '🍸'
    },
    {
        id: 'MN-03',
        name: 'Purple Velvet & Lichi Spheres',
        category: 'Coctelería de Autor',
        station: 'bar',
        price: 17.50,
        description: 'Gin botánico infusionado con butterfly pea flower, agua tónica artesanal y esferificaciones de lichi.',
        icon: '🍹'
    },
    {
        id: 'MN-04',
        name: 'Black Truffle Tartare Brioche',
        category: 'Entradas Gourmet',
        station: 'cocina',
        price: 24.00,
        description: 'Lomo fino madurado al cuchillo, trufa negra de Umbría, yema curada y láminas de brioche crujiente.',
        icon: '🥩'
    },
    {
        id: 'MN-05',
        name: 'Wagyu A5 Sliders & Tuétano',
        category: 'Platos Principales',
        station: 'cocina',
        price: 32.00,
        description: 'Trilogía de hamburguesas Wagyu japonés A5, emulsión caliente de tuétano y queso gouda trufado.',
        icon: '🍔'
    },
    {
        id: 'MN-06',
        name: 'Pulpo Glaseado Miso & Carbón',
        category: 'Platos Principales',
        station: 'cocina',
        price: 28.50,
        description: 'Tentáculo de pulpo braseado al Josper con miso dulce, puré de coliflor ahumada y teja de carbón.',
        icon: '🐙'
    },
    {
        id: 'MN-07',
        name: 'Tacos de Pato Confit & Berries',
        category: 'Especialidades Lounge',
        station: 'cocina',
        price: 22.00,
        description: 'Pato laqueado y confitado en tortillas de maíz azul nixtamalizado con reducción de moras silvestres.',
        icon: '🌮'
    },
    {
        id: 'MN-08',
        name: 'Choco-Gold Sphere Flambé',
        category: 'Postres de Autor',
        station: 'cocina',
        price: 15.00,
        description: 'Esfera de chocolate amargo al 70%, corazón cremoso de praliné y avellanas flameado con Grand Marnier.',
        icon: '✨'
    }
];

const INITIAL_RESERVATIONS = [
    {
        id: 'RES-101',
        tableId: 'T-03',
        tableName: 'Cabina Velvet 03',
        customerName: 'Dra. Carolina Albarracín',
        customerPhone: '+57 312 890 4455',
        date: new Date().toISOString().split('T')[0],
        time: '21:30',
        guests: 4,
        notes: 'Celebración de aniversario. Desean botella de bienvenida fría.',
        status: 'confirmada',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
        id: 'RES-102',
        tableId: 'T-07',
        tableName: 'Privé Black 07',
        customerName: 'Mauricio Restrepo & Invitados',
        customerPhone: '+57 300 456 7890',
        date: new Date().toISOString().split('T')[0],
        time: '22:00',
        guests: 8,
        notes: 'Grupo VIP empresarial. Servicio con coctelería personalizada.',
        status: 'confirmada',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    }
];

const INITIAL_ORDERS = [
    {
        id: 'ORD-801',
        tableId: 'T-02',
        tableName: 'Barra Neón 02',
        waiter: 'Valeria Mendoza',
        status: 'abierto',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        items: [
            {
                itemId: 'ITEM-1',
                menuId: 'MN-01',
                name: 'Smoked Old Fashioned de Roble',
                price: 18.00,
                quantity: 2,
                station: 'bar',
                notes: 'Poco hielo',
                status: 'en_preparacion' // pendiente | en_preparacion | listo | en_ruta | entregado
            },
            {
                itemId: 'ITEM-2',
                menuId: 'MN-04',
                name: 'Black Truffle Tartare Brioche',
                price: 24.00,
                quantity: 1,
                station: 'cocina',
                notes: 'Yema bien centrada',
                status: 'pendiente'
            }
        ]
    },
    {
        id: 'ORD-802',
        tableId: 'T-05',
        tableName: 'Sky Lounge 05',
        waiter: 'Valeria Mendoza',
        status: 'abierto',
        createdAt: new Date(Date.now() - 3200000).toISOString(),
        items: [
            {
                itemId: 'ITEM-3',
                menuId: 'MN-05',
                name: 'Wagyu A5 Sliders & Tuétano',
                price: 32.00,
                quantity: 2,
                station: 'cocina',
                notes: 'Término medio en la carne',
                status: 'listo' // Listo para despacho
            },
            {
                itemId: 'ITEM-4',
                menuId: 'MN-02',
                name: 'Electric Dragonfruit Mule',
                price: 16.50,
                quantity: 3,
                station: 'bar',
                notes: 'Vasos bien fríos de cobre',
                status: 'listo' // Listo para despacho
            }
        ]
    }
];

/**
 * Inicializa los datos maestros de la aplicación si no existen en localStorage.
 */
async function initializeDatabase() {
    await initializeAuth();

    if (!localStorage.getItem(STORAGE_KEYS.TABLES)) {
        setStorage(STORAGE_KEYS.TABLES, INITIAL_TABLES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MENU)) {
        setStorage(STORAGE_KEYS.MENU, INITIAL_MENU);
    }
    if (!localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) {
        setStorage(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
        setStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    }
}

/**
 * Resetea completamente todos los datos a los valores demo originales.
 * Solo ejecutable por el Administrador.
 */
async function resetAllDemoData(adminUser) {
    if (!adminUser || adminUser.role !== 'admin') {
        throw new Error('Solo el Administrador tiene autorización para resetear los datos demo.');
    }

    localStorage.removeItem(STORAGE_KEYS.TABLES);
    localStorage.removeItem(STORAGE_KEYS.MENU);
    localStorage.removeItem(STORAGE_KEYS.RESERVATIONS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOG);

    await initializeDatabase();
    logAudit('RESET_DEMO_DATA', 'Restablecimiento total de datos de demo por el Administrador', adminUser.username);
    return true;
}

/* ==========================================================================
   SERVICIOS Y CONTROLADORES DE NEGOCIO
   ========================================================================== */

// --- MESAS ---
const TableService = {
    getAll() {
        return getStorage(STORAGE_KEYS.TABLES, INITIAL_TABLES);
    },
    getById(id) {
        return this.getAll().find(t => t.id === id);
    },
    updateStatus(id, newStatus, username = 'sistema') {
        const tables = this.getAll();
        const index = tables.findIndex(t => t.id === id);
        if (index !== -1) {
            const oldStatus = tables[index].status;
            tables[index].status = newStatus;
            setStorage(STORAGE_KEYS.TABLES, tables);
            logAudit('TABLE_STATUS_CHANGED', `Mesa ${tables[index].number} cambió de ${oldStatus} a ${newStatus}`, username);
            return tables[index];
        }
        return null;
    }
};

// --- MENÚ ---
const MenuService = {
    getAll() {
        return getStorage(STORAGE_KEYS.MENU, INITIAL_MENU);
    },
    getById(id) {
        return this.getAll().find(m => m.id === id);
    }
};

// --- RESERVAS ---
const ReservationService = {
    getAll() {
        return getStorage(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS);
    },
    create(data, username = 'sistema') {
        const reservations = this.getAll();
        const table = TableService.getById(data.tableId);

        if (!table) {
            return { success: false, message: 'La mesa seleccionada no existe.' };
        }
        if (data.guests > table.capacity) {
            return { success: false, message: `La mesa soporta máximo ${table.capacity} personas.` };
        }

        const newRes = {
            id: 'RES-' + (Math.floor(100 + Math.random() * 900)),
            tableId: table.id,
            tableName: table.name,
            customerName: data.customerName.trim(),
            customerPhone: data.customerPhone.trim(),
            date: data.date,
            time: data.time,
            guests: parseInt(data.guests, 10),
            notes: data.notes ? data.notes.trim() : '',
            status: 'confirmada',
            createdAt: new Date().toISOString()
        };

        reservations.unshift(newRes);
        setStorage(STORAGE_KEYS.RESERVATIONS, reservations);

        // Actualizar visualmente la mesa a 'reservada'
        TableService.updateStatus(table.id, 'reservada', username);
        logAudit('RESERVATION_CREATED', `Reserva ${newRes.id} creada para ${newRes.customerName} en ${table.name}`, username);

        return { success: true, reservation: newRes };
    },
    seatCustomer(id, username = 'sistema') {
        const reservations = this.getAll();
        const res = reservations.find(r => r.id === id);
        if (res) {
            res.status = 'sentada';
            setStorage(STORAGE_KEYS.RESERVATIONS, reservations);
            TableService.updateStatus(res.tableId, 'ocupada', username);
            logAudit('RESERVATION_SEATED', `Clientes de la reserva ${res.id} han sido ubicados en la mesa.`, username);
            return { success: true };
        }
        return { success: false, message: 'Reserva no encontrada' };
    },
    cancel(id, username = 'sistema') {
        const reservations = this.getAll();
        const res = reservations.find(r => r.id === id);
        if (res) {
            res.status = 'cancelada';
            setStorage(STORAGE_KEYS.RESERVATIONS, reservations);

            // Verificar si hay otra reserva activa hoy para esa mesa antes de liberarla
            const today = new Date().toISOString().split('T')[0];
            const hasOther = reservations.some(r => r.tableId === res.tableId && r.status === 'confirmada' && r.date === today);
            if (!hasOther) {
                TableService.updateStatus(res.tableId, 'disponible', username);
            }

            logAudit('RESERVATION_CANCELLED', `Reserva ${res.id} cancelada.`, username);
            return { success: true };
        }
        return { success: false, message: 'Reserva no encontrada' };
    }
};

// --- PEDIDOS ---
const OrderService = {
    getAll() {
        return getStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    },
    getOpen() {
        return this.getAll().filter(o => o.status === 'abierto');
    },
    getById(id) {
        return this.getAll().find(o => o.id === id);
    },
    create(data, username = 'sistema') {
        const orders = this.getAll();
        const table = TableService.getById(data.tableId);
        if (!table) return { success: false, message: 'Mesa inválida' };

        if (!data.items || data.items.length === 0) {
            return { success: false, message: 'Agrega al menos un ítem al pedido nocturno.' };
        }

        const newOrder = {
            id: 'ORD-' + (Math.floor(800 + Math.random() * 200)),
            tableId: table.id,
            tableName: table.name,
            waiter: data.waiter || username,
            status: 'abierto',
            createdAt: new Date().toISOString(),
            items: data.items.map((item, idx) => ({
                itemId: 'ITEM-' + Date.now() + '-' + idx,
                menuId: item.menuId,
                name: item.name,
                price: parseFloat(item.price),
                quantity: parseInt(item.quantity, 10) || 1,
                station: item.station || 'cocina',
                notes: item.notes ? item.notes.trim() : '',
                status: 'pendiente' // Siempre entra en cola pendiente
            }))
        };

        orders.unshift(newOrder);
        setStorage(STORAGE_KEYS.ORDERS, orders);

        // Si la mesa no estaba ocupada, pasarla a ocupada
        if (table.status !== 'ocupada') {
            TableService.updateStatus(table.id, 'ocupada', username);
        }

        logAudit('ORDER_CREATED', `Pedido ${newOrder.id} creado para mesa ${table.name} con ${newOrder.items.length} ítems.`, username);
        return { success: true, order: newOrder };
    },
    updateItemStatus(orderId, itemId, newStatus, username = 'sistema') {
        const orders = this.getAll();
        const order = orders.find(o => o.id === orderId);
        if (!order) return false;

        const item = order.items.find(i => i.itemId === itemId);
        if (!item) return false;

        const oldStatus = item.status;
        item.status = newStatus;
        setStorage(STORAGE_KEYS.ORDERS, orders);

        logAudit('ITEM_STATUS_UPDATED', `Ítem '${item.name}' del pedido ${order.id} cambió a '${newStatus}'`, username);
        return true;
    },
    closeOrder(orderId, username = 'sistema') {
        const orders = this.getAll();
        const order = orders.find(o => o.id === orderId);
        if (!order) return { success: false, message: 'Pedido no encontrado' };

        order.status = 'cerrado';
        order.closedAt = new Date().toISOString();
        setStorage(STORAGE_KEYS.ORDERS, orders);

        // Verificar si la mesa tiene otros pedidos abiertos; si no, liberarla a disponible
        const hasOtherOpenOrders = orders.some(o => o.tableId === order.tableId && o.status === 'abierto');
        if (!hasOtherOpenOrders) {
            TableService.updateStatus(order.tableId, 'disponible', username);
        }

        logAudit('ORDER_CLOSED', `Pedido ${order.id} liquidado y cerrado con éxito.`, username);
        return { success: true };
    }
};

/* ==========================================================================
   RENDERIZADORES DE VISTAS (HTML Y COMPONENTES)
   ========================================================================== */

/**
 * Vista de Dashboard Nocturno con KPIs en vivo
 */
function renderDashboardView(currentUser) {
    const tables = TableService.getAll();
    const reservations = ReservationService.getAll();
    const orders = OrderService.getOpen();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayReservations = reservations.filter(r => r.date === todayStr && r.status !== 'cancelada').length;

    // Conteo de ítems en cocina/bar
    let kitchenPending = 0;
    let dispatchActive = 0;
    let totalSales = 0;

    orders.forEach(o => {
        o.items.forEach(item => {
            totalSales += (item.price * item.quantity);
            if (item.status === 'pendiente' || item.status === 'en_preparacion') {
                kitchenPending++;
            }
            if (item.status === 'listo' || item.status === 'en_ruta') {
                dispatchActive++;
            }
        });
    });

    const occupiedTables = tables.filter(t => t.status === 'ocupada').length;
    const reservedTables = tables.filter(t => t.status === 'reservada').length;
    const availableTables = tables.filter(t => t.status === 'disponible').length;

    return `
        <div class="dashboard-header animate-fade-in">
            <div class="welcome-badge">
                <span class="neon-dot"></span>
                <span>Lounge Atmosphere Live • Turno Nocturno</span>
            </div>
            <h1 class="page-title glow-title">Panel de Control General</h1>
            <p class="page-subtitle">Bienvenido de vuelta, <strong>${sanitizeHTML(currentUser.name)}</strong>. Resumen operacional en tiempo real.</p>
        </div>

        <!-- KPIs GRID -->
        <div class="kpi-grid">
            <div class="kpi-card card-glow-cyan">
                <div class="kpi-icon-wrap cyan">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <div class="kpi-content">
                    <span class="kpi-label">Reservas de Hoy</span>
                    <span class="kpi-value">${todayReservations}</span>
                    <span class="kpi-subtext">Mesas agendadas</span>
                </div>
            </div>

            <div class="kpi-card card-glow-purple">
                <div class="kpi-icon-wrap purple">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" stroke-width="2"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path><line x1="6" y1="17" x2="18" y2="17"></line></svg>
                </div>
                <div class="kpi-content">
                    <span class="kpi-label">Cocina / Bar en Espera</span>
                    <span class="kpi-value text-purple">${kitchenPending}</span>
                    <span class="kpi-subtext">Platos y cócteles en marcha</span>
                </div>
            </div>

            <div class="kpi-card card-glow-magenta">
                <div class="kpi-icon-wrap magenta">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                </div>
                <div class="kpi-content">
                    <span class="kpi-label">Despachos Activos</span>
                    <span class="kpi-value text-magenta">${dispatchActive}</span>
                    <span class="kpi-subtext">Listos o en camino a mesas</span>
                </div>
            </div>

            <div class="kpi-card card-glow-green">
                <div class="kpi-icon-wrap green">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M16 8l-8 8"></path><path d="M8 8l8 8"></path></svg>
                </div>
                <div class="kpi-content">
                    <span class="kpi-label">Mesas Libres</span>
                    <span class="kpi-value text-green">${availableTables} <span class="kpi-denom">/ ${tables.length}</span></span>
                    <span class="kpi-subtext">${occupiedTables} Ocupadas • ${reservedTables} Reservadas</span>
                </div>
            </div>
        </div>

        <!-- QUICK ACCESS ACCORDING TO ROLES -->
        <div class="dashboard-sections-grid">
            <!-- Columna Izquierda: Acciones y Estado de Salón -->
            <div class="dashboard-col">
                <div class="glass-panel">
                    <div class="panel-header">
                        <h3 class="panel-title">
                            <span class="neon-dot-small neon-cyan"></span>
                            Distribución de Mesas en Vivo
                        </h3>
                        <button class="btn btn-sm btn-outline-cyan" data-navigate="tables">Ver Mapa Completo</button>
                    </div>
                    <div class="table-mini-grid">
                        ${tables.map(t => `
                            <div class="table-mini-card status-${t.status}" data-table-id="${t.id}">
                                <div class="table-mini-number">${t.number}</div>
                                <div class="table-mini-zone">${sanitizeHTML(t.zone)}</div>
                                <span class="badge-status-dot ${t.status}"></span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="table-legend">
                        <span class="legend-item"><span class="badge-status-dot disponible"></span> Disponible</span>
                        <span class="legend-item"><span class="badge-status-dot reservada"></span> Reservada</span>
                        <span class="legend-item"><span class="badge-status-dot ocupada"></span> Ocupada</span>
                    </div>
                </div>
            </div>

            <!-- Columna Derecha: Pedidos Abiertos y Actividad Lounge -->
            <div class="dashboard-col">
                <div class="glass-panel">
                    <div class="panel-header">
                        <h3 class="panel-title">
                            <span class="neon-dot-small neon-purple"></span>
                            Pedidos Lounge en Curso ($${totalSales.toFixed(2)})
                        </h3>
                        ${hasPermission(currentUser.role, 'orders') ? `
                            <button class="btn btn-sm btn-primary-neon" id="btn-quick-new-order">+ Nuevo Pedido</button>
                        ` : ''}
                    </div>

                    <div class="dashboard-orders-list">
                        ${orders.length === 0 ? `
                            <div class="empty-state-sm">
                                <p>No hay comandas activas en este instante.</p>
                            </div>
                        ` : orders.slice(0, 4).map(o => {
                            const subtotal = o.items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
                            return `
                                <div class="dashboard-order-row">
                                    <div class="order-table-tag">
                                        <strong>${sanitizeHTML(o.tableName)}</strong>
                                        <small class="text-muted">${sanitizeHTML(o.waiter)}</small>
                                    </div>
                                    <div class="order-items-snippet">
                                        <span>${o.items.length} ítems: ${sanitizeHTML(o.items.map(i => i.name).slice(0, 2).join(', '))}${o.items.length > 2 ? '...' : ''}</span>
                                    </div>
                                    <div class="order-total-tag">
                                        <span class="badge badge-cyan">$${subtotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Vista de Mesas del Night Lounge
 */
function renderTablesView(filterZone = 'all', filterStatus = 'all') {
    const tables = TableService.getAll();
    const zones = ['Barra Central', 'Salón Principal', 'Terraza Lounge', 'Zona VIP'];

    const filtered = tables.filter(t => {
        const matchZone = filterZone === 'all' || t.zone === filterZone;
        const matchStatus = filterStatus === 'all' || t.status === filterStatus;
        return matchZone && matchStatus;
    });

    return `
        <div class="view-header">
            <div>
                <h1 class="page-title glow-title">Gestión de Mesas y Ambientes</h1>
                <p class="page-subtitle">Supervisa la ocupación, cambia estados y gestiona el flujo del Lounge nocturno.</p>
            </div>
        </div>

        <!-- BARRA DE FILTROS -->
        <div class="filter-bar glass-panel">
            <div class="filter-group">
                <label>Zona / Ambiente:</label>
                <div class="filter-pills" id="zone-pills">
                    <button class="pill-btn ${filterZone === 'all' ? 'active' : ''}" data-filter-zone="all">Todas</button>
                    ${zones.map(z => `
                        <button class="pill-btn ${filterZone === z ? 'active' : ''}" data-filter-zone="${z}">${z}</button>
                    `).join('')}
                </div>
            </div>

            <div class="filter-group">
                <label>Estado:</label>
                <div class="filter-pills" id="status-pills">
                    <button class="pill-btn ${filterStatus === 'all' ? 'active' : ''}" data-filter-status="all">Todos</button>
                    <button class="pill-btn text-green ${filterStatus === 'disponible' ? 'active' : ''}" data-filter-status="disponible">Disponibles</button>
                    <button class="pill-btn text-cyan ${filterStatus === 'reservada' ? 'active' : ''}" data-filter-status="reservada">Reservadas</button>
                    <button class="pill-btn text-magenta ${filterStatus === 'ocupada' ? 'active' : ''}" data-filter-status="ocupada">Ocupadas</button>
                </div>
            </div>
        </div>

        <!-- GRID DE MESAS -->
        <div class="tables-grid">
            ${filtered.length === 0 ? `
                <div class="empty-state glass-panel">
                    <p>No se encontraron mesas con los filtros seleccionados.</p>
                </div>
            ` : filtered.map(t => {
                const statusLabels = { disponible: 'Disponible', reservada: 'Reservada', ocupada: 'Ocupada' };
                return `
                    <div class="table-card status-${t.status}" data-table-id="${t.id}">
                        <div class="table-card-top">
                            <span class="table-badge-zone">${sanitizeHTML(t.zone)}</span>
                            <span class="table-status-tag ${t.status}">${statusLabels[t.status]}</span>
                        </div>
                        <div class="table-card-body">
                            <div class="table-number-glow">${t.number}</div>
                            <h3 class="table-title">${sanitizeHTML(t.name)}</h3>
                            <div class="table-meta">
                                <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> Cap: <strong>${t.capacity} pax</strong></span>
                                <span>Consumo mín: <strong>$${t.minConsumption}</strong></span>
                            </div>
                        </div>
                        <div class="table-card-footer">
                            <button class="btn btn-sm btn-ghost btn-table-actions" data-table-id="${t.id}">
                                Administrar Mesa &rarr;
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Vista de Reservas
 */
function renderReservationsView() {
    const reservations = ReservationService.getAll();
    const tables = TableService.getAll();

    return `
        <div class="view-header">
            <div>
                <h1 class="page-title glow-title">Reservas Lounge</h1>
                <p class="page-subtitle">Asigna mesas exclusivas, gestiona confirmaciones y recibe a los invitados.</p>
            </div>
            <div>
                <button class="btn btn-primary-neon" id="btn-open-new-reservation-modal">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Nueva Reserva VIP
                </button>
            </div>
        </div>

        <!-- LISTA DE RESERVAS -->
        <div class="glass-panel">
            <div class="panel-header">
                <h3 class="panel-title">Registro General de Reservas</h3>
                <span class="badge badge-cyan">${reservations.length} Totales</span>
            </div>

            <div class="table-responsive">
                <table class="lounge-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Mesa</th>
                            <th>Titular / Cliente</th>
                            <th>Teléfono</th>
                            <th>Fecha & Hora</th>
                            <th>Personas</th>
                            <th>Notas Especiales</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reservations.length === 0 ? `
                            <tr>
                                <td colspan="9" class="text-center py-4">No hay reservas registradas en este momento.</td>
                            </tr>
                        ` : reservations.map(r => {
                            const statusColor = r.status === 'confirmada' ? 'cyan' : (r.status === 'sentada' ? 'green' : 'magenta');
                            return `
                                <tr>
                                    <td><strong class="text-purple">${sanitizeHTML(r.id)}</strong></td>
                                    <td><span class="badge badge-outline">${sanitizeHTML(r.tableName)}</span></td>
                                    <td><strong>${sanitizeHTML(r.customerName)}</strong></td>
                                    <td>${sanitizeHTML(r.customerPhone)}</td>
                                    <td>${sanitizeHTML(r.date)} • <span class="text-cyan">${sanitizeHTML(r.time)}</span></td>
                                    <td><span class="badge badge-cyan">${r.guests} pax</span></td>
                                    <td><small class="text-muted">${sanitizeHTML(r.notes || 'Sin observaciones')}</small></td>
                                    <td><span class="badge badge-${statusColor}">${sanitizeHTML(r.status)}</span></td>
                                    <td>
                                        <div class="action-buttons-cell">
                                            ${r.status === 'confirmada' ? `
                                                <button class="btn btn-xs btn-outline-green btn-seat-reservation" data-res-id="${r.id}" title="Ubicar / Sentar Clientes en Mesa">Sentar</button>
                                                <button class="btn btn-xs btn-outline-magenta btn-cancel-reservation" data-res-id="${r.id}" title="Cancelar Reserva">Cancelar</button>
                                            ` : `
                                                <span class="text-muted text-xs">Completada</span>
                                            `}
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Vista de Pedidos / Comandas y Carta
 */
function renderOrdersView() {
    const orders = OrderService.getOpen();
    const menu = MenuService.getAll();
    const tables = TableService.getAll();

    return `
        <div class="view-header">
            <div>
                <h1 class="page-title glow-title">Comandas & Pedidos Activos</h1>
                <p class="page-subtitle">Abre comandas por mesa, agrega coctelería y platillos gourmet con envío directo a cocina y bar.</p>
            </div>
            <div>
                <button class="btn btn-primary-neon" id="btn-open-create-order-modal">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Crear Nuevo Pedido
                </button>
            </div>
        </div>

        <div class="orders-cards-grid">
            ${orders.length === 0 ? `
                <div class="empty-state glass-panel full-width">
                    <p>No hay pedidos abiertos en este momento. Haz clic en "Crear Nuevo Pedido" para abrir una comanda.</p>
                </div>
            ` : orders.map(o => {
                const total = o.items.reduce((s, i) => s + (i.price * i.quantity), 0);
                return `
                    <div class="glass-panel order-live-card">
                        <div class="order-live-header">
                            <div>
                                <span class="order-live-id">${o.id}</span>
                                <h3 class="order-live-table">${sanitizeHTML(o.tableName)}</h3>
                                <small class="text-muted">Atendido por: ${sanitizeHTML(o.waiter)}</small>
                            </div>
                            <div class="text-right">
                                <span class="order-total-highlight">$${total.toFixed(2)}</span>
                                <span class="badge badge-green">Abierto</span>
                            </div>
                        </div>

                        <div class="order-items-table-wrap">
                            <table class="order-mini-table">
                                <thead>
                                    <tr>
                                        <th>Cant</th>
                                        <th>Ítem</th>
                                        <th>Estación</th>
                                        <th>Estado</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${o.items.map(item => `
                                        <tr>
                                            <td><strong>${item.quantity}x</strong></td>
                                            <td>
                                                ${sanitizeHTML(item.name)}
                                                ${item.notes ? `<div class="item-notes-text">"${sanitizeHTML(item.notes)}"</div>` : ''}
                                            </td>
                                            <td><span class="badge badge-${item.station === 'bar' ? 'purple' : 'magenta'}">${item.station.toUpperCase()}</span></td>
                                            <td><span class="badge badge-status-pill ${item.status}">${sanitizeHTML(item.status.replace('_', ' '))}</span></td>
                                            <td>$${(item.price * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        <div class="order-live-actions">
                            <button class="btn btn-sm btn-outline-cyan btn-add-more-items" data-order-id="${o.id}">
                                + Agregar Ítems
                            </button>
                            <button class="btn btn-sm btn-outline-green btn-close-order" data-order-id="${o.id}">
                                Liquidar & Cobrar ($${total.toFixed(2)})
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Vista de Cocina y Bar (KDS - Kitchen Display System Nocturno)
 */
function renderKitchenView(stationFilter = 'all') {
    const orders = OrderService.getOpen();

    // Extraer todos los ítems relevantes
    const itemsList = [];
    orders.forEach(ord => {
        ord.items.forEach(it => {
            if (stationFilter === 'all' || it.station === stationFilter) {
                // Mostrar los pendientes y en preparación (y opcionalmente los listos recientemente)
                itemsList.push({
                    ...it,
                    orderId: ord.id,
                    tableName: ord.tableName,
                    waiter: ord.waiter,
                    orderTime: ord.createdAt
                });
            }
        });
    });

    const pendingItems = itemsList.filter(i => i.status === 'pendiente');
    const inPrepItems = itemsList.filter(i => i.status === 'en_preparacion');
    const readyItems = itemsList.filter(i => i.status === 'listo');

    return `
        <div class="view-header">
            <div>
                <h1 class="page-title glow-title">Comandera de Cocina & Bar Lounge</h1>
                <p class="page-subtitle">Cola de preparación en tiempo real para mixología y cocina caliente.</p>
            </div>
            <div class="filter-pills" id="station-filter-pills">
                <button class="pill-btn ${stationFilter === 'all' ? 'active' : ''}" data-station="all">Todas las Estaciones</button>
                <button class="pill-btn ${stationFilter === 'bar' ? 'active' : ''}" data-station="bar">🍸 Solo Bar / Mixología</button>
                <button class="pill-btn ${stationFilter === 'cocina' ? 'active' : ''}" data-station="cocina">🔥 Solo Cocina Gourmet</button>
            </div>
        </div>

        <!-- KANBAN BOARDS -->
        <div class="kds-kanban-board">
            <!-- COLUMNA 1: PENDIENTES -->
            <div class="kanban-column">
                <div class="kanban-col-header col-pending">
                    <span class="neon-dot-small neon-magenta"></span>
                    <h3>Por Preparar</h3>
                    <span class="badge badge-magenta">${pendingItems.length}</span>
                </div>
                <div class="kanban-cards-container">
                    ${pendingItems.length === 0 ? `
                        <div class="kanban-empty">Sin órdenes pendientes</div>
                    ` : pendingItems.map(item => `
                        <div class="kds-ticket-card station-${item.station}">
                            <div class="ticket-header">
                                <span class="ticket-table">${sanitizeHTML(item.tableName)}</span>
                                <span class="badge badge-${item.station === 'bar' ? 'purple' : 'cyan'}">${item.station.toUpperCase()}</span>
                            </div>
                            <div class="ticket-item-title">
                                <strong>${item.quantity}x</strong> ${sanitizeHTML(item.name)}
                            </div>
                            ${item.notes ? `<div class="ticket-notes">⚠️ ${sanitizeHTML(item.notes)}</div>` : ''}
                            <div class="ticket-footer">
                                <small class="text-muted">Pedido: ${item.orderId}</small>
                                <button class="btn btn-xs btn-primary-neon btn-start-prep" data-order-id="${item.orderId}" data-item-id="${item.itemId}">
                                    Iniciar Prep &rarr;
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- COLUMNA 2: EN PREPARACIÓN -->
            <div class="kanban-column">
                <div class="kanban-col-header col-prep">
                    <span class="neon-dot-small neon-purple"></span>
                    <h3>En Preparación</h3>
                    <span class="badge badge-purple">${inPrepItems.length}</span>
                </div>
                <div class="kanban-cards-container">
                    ${inPrepItems.length === 0 ? `
                        <div class="kanban-empty">Ningún ítem en preparación activa</div>
                    ` : inPrepItems.map(item => `
                        <div class="kds-ticket-card in-prep station-${item.station}">
                            <div class="ticket-header">
                                <span class="ticket-table">${sanitizeHTML(item.tableName)}</span>
                                <span class="badge badge-purple">PREPARANDO</span>
                            </div>
                            <div class="ticket-item-title">
                                <strong>${item.quantity}x</strong> ${sanitizeHTML(item.name)}
                            </div>
                            ${item.notes ? `<div class="ticket-notes">⚠️ ${sanitizeHTML(item.notes)}</div>` : ''}
                            <div class="ticket-footer">
                                <small class="text-muted">Pedido: ${item.orderId}</small>
                                <button class="btn btn-xs btn-outline-green btn-finish-prep" data-order-id="${item.orderId}" data-item-id="${item.itemId}">
                                    ✓ Marcar Listo
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- COLUMNA 3: LISTO (ENVIADO A DESPACHO) -->
            <div class="kanban-column">
                <div class="kanban-col-header col-ready">
                    <span class="neon-dot-small neon-green"></span>
                    <h3>Listos en Barra / Pasa</h3>
                    <span class="badge badge-green">${readyItems.length}</span>
                </div>
                <div class="kanban-cards-container">
                    ${readyItems.length === 0 ? `
                        <div class="kanban-empty">Sin platos listos esperando runner</div>
                    ` : readyItems.map(item => `
                        <div class="kds-ticket-card ready-to-run">
                            <div class="ticket-header">
                                <span class="ticket-table text-green">${sanitizeHTML(item.tableName)}</span>
                                <span class="badge badge-green">LISTO</span>
                            </div>
                            <div class="ticket-item-title">
                                <strong>${item.quantity}x</strong> ${sanitizeHTML(item.name)}
                            </div>
                            <div class="ticket-footer">
                                <span class="ready-badge-sub">Esperando Runner / Despacho</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * Vista de Despachos (Entrega a Mesas)
 */
function renderDispatchView() {
    const orders = OrderService.getOpen();

    // Extraer platos o tragos listos o en ruta
    const dispatchItems = [];
    orders.forEach(ord => {
        ord.items.forEach(it => {
            if (it.status === 'listo' || it.status === 'en_ruta') {
                dispatchItems.push({
                    ...it,
                    orderId: ord.id,
                    tableName: ord.tableName,
                    waiter: ord.waiter
                });
            }
        });
    });

    return `
        <div class="view-header">
            <div>
                <h1 class="page-title glow-title">Despachos & Runners a Mesa</h1>
                <p class="page-subtitle">Monitoreo y confirmación de entrega de cócteles y platillos a las mesas del Lounge.</p>
            </div>
        </div>

        <div class="glass-panel">
            <div class="panel-header">
                <h3 class="panel-title">
                    <span class="neon-dot-small neon-cyan"></span>
                    Cola de Despachos Activa
                </h3>
                <span class="badge badge-cyan">${dispatchItems.length} En Cola</span>
            </div>

            ${dispatchItems.length === 0 ? `
                <div class="empty-state py-5">
                    <p>🎉 Todo está al día. No hay despachos pendientes por llevar a las mesas.</p>
                </div>
            ` : `
                <div class="dispatch-grid">
                    ${dispatchItems.map(it => `
                        <div class="dispatch-card ${it.status === 'en_ruta' ? 'en-ruta' : 'en-pasa'}">
                            <div class="dispatch-card-header">
                                <h3 class="dispatch-table-title">${sanitizeHTML(it.tableName)}</h3>
                                <span class="badge ${it.status === 'en_ruta' ? 'badge-magenta' : 'badge-green'}">
                                    ${it.status === 'en_ruta' ? '🚀 EN RUTA' : '🍸 LISTO EN BARRA'}
                                </span>
                            </div>
                            <div class="dispatch-body">
                                <div class="dispatch-item-name">
                                    <span class="dispatch-qty">${it.quantity}x</span>
                                    <span>${sanitizeHTML(it.name)}</span>
                                </div>
                                ${it.notes ? `<div class="ticket-notes">Notas: ${sanitizeHTML(it.notes)}</div>` : ''}
                                <div class="dispatch-waiter">Camarero/a: <strong>${sanitizeHTML(it.waiter)}</strong></div>
                            </div>
                            <div class="dispatch-card-actions">
                                ${it.status === 'listo' ? `
                                    <button class="btn btn-sm btn-primary-neon btn-dispatch-route" data-order-id="${it.orderId}" data-item-id="${it.itemId}">
                                        🚀 Tomar & Llevar a Mesa
                                    </button>
                                ` : `
                                    <button class="btn btn-sm btn-outline-green btn-dispatch-delivered" data-order-id="${it.orderId}" data-item-id="${it.itemId}">
                                        ✓ Confirmar Entregado en Mesa
                                    </button>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

/**
 * Vista de Usuarios y Auditoría (Solo para Administrador)
 */
function renderUsersView(currentUser) {
    const users = listUsers();
    const auditLogs = getStorage(STORAGE_KEYS.AUDIT_LOG, []);

    return `
        <div class="view-header">
            <div>
                <h1 class="page-title glow-title">Gestión de Personal & Seguridad</h1>
                <p class="page-subtitle">Administra cuentas, roles con hashing SHA-256 y audita las operaciones del sistema.</p>
            </div>
            ${currentUser.role === 'admin' ? `
                <div class="admin-danger-actions">
                    <button class="btn btn-outline-magenta" id="btn-reset-demo-data">
                        ⚠️ Resetear Datos Demo
                    </button>
                    <button class="btn btn-primary-neon" id="btn-open-create-user-modal">
                        + Registrar Personal
                    </button>
                </div>
            ` : ''}
        </div>

        <div class="dashboard-sections-grid">
            <!-- LISTA DE USUARIOS -->
            <div class="dashboard-col">
                <div class="glass-panel">
                    <div class="panel-header">
                        <h3 class="panel-title">Equipo de Trabajo Autorizado</h3>
                        <span class="badge badge-cyan">${users.length} Miembros</span>
                    </div>
                    <div class="users-list-wrap">
                        ${users.map(u => `
                            <div class="user-row-card">
                                <div class="user-avatar-badge">${u.avatar || '👤'}</div>
                                <div class="user-info">
                                    <strong>${sanitizeHTML(u.name)}</strong>
                                    <span class="text-muted">@${sanitizeHTML(u.username)}</span>
                                </div>
                                <div>
                                    <span class="badge badge-role-${u.role}">${sanitizeHTML(u.role.toUpperCase())}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- REGISTRO DE AUDITORÍA -->
            <div class="dashboard-col">
                <div class="glass-panel">
                    <div class="panel-header">
                        <h3 class="panel-title">Log de Seguridad & Auditoría</h3>
                        <span class="badge badge-purple">${auditLogs.length} Registros</span>
                    </div>
                    <div class="audit-logs-container">
                        ${auditLogs.length === 0 ? `
                            <p class="text-muted text-center py-4">No hay registros de auditoría aún.</p>
                        ` : auditLogs.slice(0, 15).map(log => `
                            <div class="audit-entry">
                                <div class="audit-time">${new Date(log.timestamp).toLocaleTimeString()}</div>
                                <div class="audit-action">${sanitizeHTML(log.action)}</div>
                                <div class="audit-desc">${sanitizeHTML(log.details)}</div>
                                <div class="audit-user">@${sanitizeHTML(log.username)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}


// Exportación global para BusinessModules
const BusinessModules = {
    INITIAL_TABLES,
    INITIAL_MENU,
    INITIAL_RESERVATIONS,
    INITIAL_ORDERS,
    initializeDatabase,
    resetAllDemoData,
    TableService,
    MenuService,
    ReservationService,
    OrderService,
    renderDashboardView,
    renderTablesView,
    renderReservationsView,
    renderOrdersView,
    renderKitchenView,
    renderDispatchView,
    renderUsersView
};

window.BusinessModules = BusinessModules;
})();
