/**
 * ReservaRest - Night Lounge
 * app.js - Controlador Principal, Enrutamiento Dinámico, Modales y Eventos Globales
 * Compatible tanto con carga directa (file://) como servidores web (http://)
 */

(function () {
    'use strict';

    const {
        initializeDatabase,
        renderDashboardView,
        renderTablesView,
        renderReservationsView,
        renderOrdersView,
        renderKitchenView,
        renderDispatchView,
        renderUsersView,
        resetAllDemoData,
        TableService,
        MenuService,
        ReservationService,
        OrderService
    } = window.BusinessModules;

const {
    getCurrentUser,
    login,
    logout,
    hasPermission,
    registerUser,
    ROLE_LABELS
} = window.AuthModule;

const { sanitizeHTML } = window.StorageModule;

/* ==========================================================================
   ESTADO GLOBAL DE LA APLICACIÓN
   ========================================================================== */
const AppState = {
    currentUser: null,
    currentView: 'dashboard',
    activeModal: null,
    tableFilterZone: 'all',
    tableFilterStatus: 'all',
    kitchenStationFilter: 'all',
    newOrderItems: [] // Buffer temporal para la creación de pedidos
};

/* ==========================================================================
   SISTEMA DE NOTIFICACIONES TOAST NEÓN
   ========================================================================== */
function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `lounge-toast toast-${type} animate-slide-in`;
    
    const icons = {
        success: '✨',
        error: '⚠️',
        info: '🍸',
        warning: '⚡'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || '🍸'}</span>
        <span class="toast-text">${sanitizeHTML(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

/* ==========================================================================
   INICIALIZACIÓN DEL SISTEMA
   ========================================================================== */
async function initApp() {
    try {
        console.log('[ReservaRest] Inicializando sistema nocturno...');
        await initializeDatabase();
        AppState.currentUser = await getCurrentUser();

        if (AppState.currentUser) {
            console.log('[ReservaRest] Sesión activa recuperada:', AppState.currentUser.username);
            renderAppLayout();
            navigateTo(AppState.currentView);
        } else {
            console.log('[ReservaRest] Mostrando pantalla de acceso.');
            renderLoginScreen();
        }
    } catch (err) {
        console.error('Error al inicializar la aplicación:', err);
        const appEl = document.getElementById('app');
        if (appEl) {
            appEl.innerHTML = `
                <div style="padding: 2.5rem; color: #f8f9fc; background: #111319; text-align: center; font-family: sans-serif; max-width: 480px; margin: 15vh auto; border-radius: 16px; border: 1px solid rgba(255,42,109,0.3); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <div style="font-size: 2.5rem; margin-bottom: 1rem;">⚠️</div>
                    <h3 style="color: #ff2a6d; margin-bottom: 0.75rem;">Atención al iniciar</h3>
                    <p style="color: #9da6b9; margin-bottom: 1.5rem; font-size: 0.95rem;">${err.message || 'Se produjo un problema al cargar los datos demo.'}</p>
                    <button onclick="localStorage.clear(); location.reload();" style="padding: 0.75rem 1.5rem; background: #ff2a6d; color: #fff; font-weight: 600; border: none; border-radius: 8px; cursor: pointer;">
                        Reiniciar Datos & Recargar
                    </button>
                </div>
            `;
        }
    }
}

// Ejecutar inmediatamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Respaldo de seguridad: si después de 400ms aún se muestra el spinner, fuerza initApp
setTimeout(() => {
    const appEl = document.getElementById('app');
    if (appEl && appEl.querySelector('.initial-app-loader')) {
        console.warn('[ReservaRest] Timeout de loader: forzando renderizado de login...');
        initApp();
    }
}, 400);

/* ==========================================================================
   VISTA DE AUTENTICACIÓN / LOGIN SCREEN
   ========================================================================== */
function renderLoginScreen() {
    const appEl = document.getElementById('app');
    appEl.innerHTML = `
        <div class="login-wrapper">
            <div class="login-backdrop-glow"></div>
            <div class="login-card glass-panel animate-scale-up">
                <div class="login-brand">
                    <div class="brand-logo-icon">🍸</div>
                    <h1 class="brand-title glow-title">ReservaRest</h1>
                    <span class="brand-subtitle">Night Lounge & Exclusive Bar</span>
                </div>

                <form id="login-form" class="login-form">
                    <div class="form-group">
                        <label for="username">Usuario Nocturno</label>
                        <div class="input-with-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            <input type="text" id="username" placeholder="ej: admin, mesero, cocina..." required autocomplete="username">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="password">Clave de Acceso</label>
                        <div class="input-with-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            <input type="password" id="password" placeholder="••••••••" required autocomplete="current-password">
                        </div>
                    </div>

                    <div id="login-error" class="login-error-msg hidden"></div>

                    <button type="submit" class="btn btn-primary-neon btn-block" id="btn-login-submit">
                        Ingresar al Sistema
                    </button>
                </form>

                <!-- ACCESO RÁPIDO PARA DEMO -->
                <div class="demo-credentials-box">
                    <span class="demo-box-title">⚡ Acceso Rápido para Demostración:</span>
                    <div class="demo-quick-buttons">
                        <button class="btn-demo-pill" data-demo-user="admin" data-demo-pass="admin123">
                            👑 Admin
                        </button>
                        <button class="btn-demo-pill" data-demo-user="mesero" data-demo-pass="mesero123">
                            🍸 Mesero
                        </button>
                        <button class="btn-demo-pill" data-demo-user="cocina" data-demo-pass="cocina123">
                            🔥 Cocina/Bar
                        </button>
                        <button class="btn-demo-pill" data-demo-user="despacho" data-demo-pass="despacho123">
                            🚀 Despacho
                        </button>
                    </div>
                </div>

                <div class="login-footer-meta">
                    <small>Cifrado Seguro SHA-256 • Protección de Integridad de Sesión</small>
                </div>
            </div>
        </div>
    `;

    // Eventos de formulario de login
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userInput = document.getElementById('username').value;
        const passInput = document.getElementById('password').value;
        await handleLogin(userInput, passInput);
    });

    // Eventos de botones demo
    document.querySelectorAll('.btn-demo-pill').forEach(btn => {
        btn.addEventListener('click', async () => {
            const user = btn.dataset.demoUser;
            const pass = btn.dataset.demoPass;
            document.getElementById('username').value = user;
            document.getElementById('password').value = pass;
            await handleLogin(user, pass);
        });
    });
}

async function handleLogin(username, password) {
    const errorEl = document.getElementById('login-error');
    const submitBtn = document.getElementById('btn-login-submit');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Verificando Hash SHA-256...';

    const result = await login(username, password);
    if (result.success) {
        AppState.currentUser = result.user;
        showToast(`Bienvenido a ReservaRest, ${result.user.name}`, 'success');
        renderAppLayout();
        // Si el rol es cocina o despacho, dirigir directamente a su módulo preferido si lo desean, o al dashboard
        navigateTo('dashboard');
    } else {
        errorEl.textContent = result.message;
        errorEl.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.innerText = 'Ingresar al Sistema';
    }
}

/* ==========================================================================
   ESTRUCTURA PRINCIPAL (SHELL: SIDEBAR, TOPBAR, MAIN CONTAINER)
   ========================================================================== */
function renderAppLayout() {
    const appEl = document.getElementById('app');
    const role = AppState.currentUser.role;

    // Menú lateral dinámico según permisos
    const navItems = [
        { id: 'dashboard', label: 'Panel Principal', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>' },
        { id: 'tables', label: 'Mesas & Ambientes', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>' },
        { id: 'reservations', label: 'Reservas VIP', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' },
        { id: 'orders', label: 'Comandas & Pedidos', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>' },
        { id: 'kitchen', label: 'Cocina & Bar (KDS)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path><line x1="6" y1="17" x2="18" y2="17"></line></svg>' },
        { id: 'dispatch', label: 'Despachos & Runners', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>' },
        { id: 'users', label: 'Personal & Seguridad', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>' }
    ];

    const authorizedItems = navItems.filter(item => hasPermission(role, item.id));

    appEl.innerHTML = `
        <div class="app-layout">
            <!-- BACKDROP PARA MÓVIL -->
            <div id="mobile-sidebar-backdrop" class="sidebar-backdrop"></div>

            <!-- SIDEBAR LATERAL DINÁMICO -->
            <aside class="app-sidebar" id="app-sidebar">
                <div class="sidebar-brand">
                    <div class="sidebar-logo">🍸</div>
                    <div class="sidebar-brand-text">
                        <span class="brand-name glow-text">ReservaRest</span>
                        <span class="brand-lounge-tag">Night Lounge</span>
                    </div>
                </div>

                <div class="sidebar-user-pill">
                    <div class="user-avatar">${AppState.currentUser.avatar || '👤'}</div>
                    <div class="user-info-text">
                        <span class="user-name">${sanitizeHTML(AppState.currentUser.name)}</span>
                        <span class="user-role-badge">${ROLE_LABELS[role] || role}</span>
                    </div>
                </div>

                <nav class="sidebar-nav">
                    ${authorizedItems.map(item => `
                        <button class="nav-item ${item.id === AppState.currentView ? 'active' : ''}" data-view="${item.id}">
                            <span class="nav-icon">${item.icon}</span>
                            <span class="nav-label">${item.label}</span>
                            <span class="active-glow-indicator"></span>
                        </button>
                    `).join('')}
                </nav>

                <div class="sidebar-footer">
                    <button class="btn btn-logout btn-block" id="btn-logout">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            <!-- CONTENIDO PRINCIPAL -->
            <div class="main-wrapper">
                <!-- TOPBAR NOCTURNA -->
                <header class="app-topbar">
                    <div class="topbar-left">
                        <button class="btn-mobile-toggle" id="btn-mobile-toggle" aria-label="Abrir Menú">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                        </button>
                        <div class="night-indicator">
                            <span class="neon-pulse-dot"></span>
                            <span class="night-mode-text">Lounge Open • Horario Nocturno</span>
                        </div>
                    </div>

                    <div class="topbar-right">
                        <div class="topbar-role-tag">
                            Rol: <strong>${role.toUpperCase()}</strong>
                        </div>
                    </div>
                </header>

                <!-- VISTA ACTIVA DINÁMICA -->
                <main class="content-area" id="content-area">
                    <!-- Aquí se renderiza la vista activa -->
                </main>
            </div>
        </div>

        <!-- CONTENEDOR MODAL FLOTANTE -->
        <div id="modal-container" class="modal-overlay hidden">
            <div class="modal-box glass-panel animate-scale-up" id="modal-content">
                <!-- Contenido dinámico del modal -->
            </div>
        </div>

        <!-- CONTENEDOR DE TOASTS -->
        <div id="toast-container" class="toast-container"></div>
    `;

    setupGlobalEventListeners();
}

/* ==========================================================================
   ENRUTAMIENTO Y GESTIÓN DE VISTAS
   ========================================================================== */
function navigateTo(viewId) {
    if (!hasPermission(AppState.currentUser.role, viewId)) {
        showToast('No tienes permisos suficientes para acceder a esta sección.', 'error');
        return;
    }

    AppState.currentView = viewId;

    // Actualizar botones de navegación en sidebar
    document.querySelectorAll('.nav-item').forEach(btn => {
        if (btn.dataset.view === viewId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Cerrar sidebar en móvil al navegar
    closeMobileSidebar();

    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    switch (viewId) {
        case 'dashboard':
            contentArea.innerHTML = renderDashboardView(AppState.currentUser);
            bindDashboardEvents();
            break;
        case 'tables':
            contentArea.innerHTML = renderTablesView(AppState.tableFilterZone, AppState.tableFilterStatus);
            bindTablesEvents();
            break;
        case 'reservations':
            contentArea.innerHTML = renderReservationsView();
            bindReservationsEvents();
            break;
        case 'orders':
            contentArea.innerHTML = renderOrdersView();
            bindOrdersEvents();
            break;
        case 'kitchen':
            contentArea.innerHTML = renderKitchenView(AppState.kitchenStationFilter);
            bindKitchenEvents();
            break;
        case 'dispatch':
            contentArea.innerHTML = renderDispatchView();
            bindDispatchEvents();
            break;
        case 'users':
            contentArea.innerHTML = renderUsersView(AppState.currentUser);
            bindUsersEvents();
            break;
        default:
            contentArea.innerHTML = renderDashboardView(AppState.currentUser);
            bindDashboardEvents();
    }
}

/* ==========================================================================
   EVENTOS GLOBALES Y MANIPULACIÓN DEL DOM
   ========================================================================== */
function setupGlobalEventListeners() {
    // Clics en la barra lateral
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            if (view) navigateTo(view);
        });
    });

    // Botón de cerrar sesión
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await logout();
            AppState.currentUser = null;
            renderLoginScreen();
            showToast('Sesión finalizada. ¡Hasta el próximo turno!', 'info');
        });
    }

    // Toggle móvil
    const mobileToggle = document.getElementById('btn-mobile-toggle');
    const backdrop = document.getElementById('mobile-sidebar-backdrop');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileSidebar);
    }
    if (backdrop) {
        backdrop.addEventListener('click', closeMobileSidebar);
    }

    // Cerrar modales con tecla Escape o clic fuera
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && AppState.activeModal) {
            closeModal();
        }
    });

    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                closeModal();
            }
        });
    }
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('mobile-sidebar-backdrop');
    sidebar?.classList.toggle('open');
    backdrop?.classList.toggle('visible');
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('mobile-sidebar-backdrop');
    sidebar?.classList.remove('open');
    backdrop?.classList.remove('visible');
}

/* ==========================================================================
   SISTEMA DE MODALES FLOTANTES
   ========================================================================== */
function openModal(htmlContent) {
    const container = document.getElementById('modal-container');
    const box = document.getElementById('modal-content');
    if (!container || !box) return;

    box.innerHTML = htmlContent;
    container.classList.remove('hidden');
    AppState.activeModal = true;

    // Vincular botón de cerrar
    box.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
}

function closeModal() {
    const container = document.getElementById('modal-container');
    if (container) {
        container.classList.add('hidden');
    }
    AppState.activeModal = false;
}

/* ==========================================================================
   EVENTOS ESPECÍFICOS DE CADA VISTA
   ========================================================================== */

// --- DASHBOARD ---
function bindDashboardEvents() {
    const btnQuickOrder = document.getElementById('btn-quick-new-order');
    if (btnQuickOrder) {
        btnQuickOrder.addEventListener('click', () => openCreateOrderModal());
    }

    // Navegación desde botones inline
    document.querySelectorAll('[data-navigate]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.navigate;
            if (target) navigateTo(target);
        });
    });

    // Clic en mesa mini para administrar
    document.querySelectorAll('.table-mini-card').forEach(card => {
        card.addEventListener('click', () => {
            const tableId = card.dataset.tableId;
            openManageTableModal(tableId);
        });
    });
}

// --- MESAS ---
function bindTablesEvents() {
    // Filtros de zona
    document.querySelectorAll('#zone-pills .pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            AppState.tableFilterZone = btn.dataset.filterZone;
            navigateTo('tables');
        });
    });

    // Filtros de estado
    document.querySelectorAll('#status-pills .pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            AppState.tableFilterStatus = btn.dataset.filterStatus;
            navigateTo('tables');
        });
    });

    // Clic en tarjeta de mesa o botón administrar
    document.querySelectorAll('.btn-table-actions').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tableId = btn.dataset.tableId;
            openManageTableModal(tableId);
        });
    });

    document.querySelectorAll('.table-card').forEach(card => {
        card.addEventListener('click', () => {
            const tableId = card.dataset.tableId;
            openManageTableModal(tableId);
        });
    });
}

// --- RESERVAS ---
function bindReservationsEvents() {
    const btnNewRes = document.getElementById('btn-open-new-reservation-modal');
    if (btnNewRes) {
        btnNewRes.addEventListener('click', () => openNewReservationModal());
    }

    // Sentar reserva
    document.querySelectorAll('.btn-seat-reservation').forEach(btn => {
        btn.addEventListener('click', () => {
            const resId = btn.dataset.resId;
            const res = ReservationService.seatCustomer(resId, AppState.currentUser.username);
            if (res.success) {
                showToast(`Clientes ubicados en mesa. Estado actualizado a Ocupada.`, 'success');
                navigateTo('reservations');
            }
        });
    });

    // Cancelar reserva
    document.querySelectorAll('.btn-cancel-reservation').forEach(btn => {
        btn.addEventListener('click', () => {
            const resId = btn.dataset.resId;
            if (confirm('¿Deseas cancelar esta reserva nocturna?')) {
                ReservationService.cancel(resId, AppState.currentUser.username);
                showToast(`Reserva ${resId} cancelada y mesa liberada.`, 'info');
                navigateTo('reservations');
            }
        });
    });
}

// --- PEDIDOS ---
function bindOrdersEvents() {
    const btnOpenOrder = document.getElementById('btn-open-create-order-modal');
    if (btnOpenOrder) {
        btnOpenOrder.addEventListener('click', () => openCreateOrderModal());
    }

    // Agregar más ítems a un pedido abierto
    document.querySelectorAll('.btn-add-more-items').forEach(btn => {
        btn.addEventListener('click', () => {
            const orderId = btn.dataset.orderId;
            openAddItemsToOrderModal(orderId);
        });
    });

    // Liquidar / cerrar pedido
    document.querySelectorAll('.btn-close-order').forEach(btn => {
        btn.addEventListener('click', () => {
            const orderId = btn.dataset.orderId;
            openCloseOrderModal(orderId);
        });
    });
}

// --- COCINA / BAR ---
function bindKitchenEvents() {
    // Filtros de estación
    document.querySelectorAll('#station-filter-pills .pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            AppState.kitchenStationFilter = btn.dataset.station;
            navigateTo('kitchen');
        });
    });

    // Iniciar preparación
    document.querySelectorAll('.btn-start-prep').forEach(btn => {
        btn.addEventListener('click', () => {
            const { orderId, itemId } = btn.dataset;
            OrderService.updateItemStatus(orderId, itemId, 'en_preparacion', AppState.currentUser.username);
            showToast('Ítem en preparación activa.', 'info');
            navigateTo('kitchen');
        });
    });

    // Marcar Listo
    document.querySelectorAll('.btn-finish-prep').forEach(btn => {
        btn.addEventListener('click', () => {
            const { orderId, itemId } = btn.dataset;
            OrderService.updateItemStatus(orderId, itemId, 'listo', AppState.currentUser.username);
            showToast('¡Ítem listo en barra! Notificando a Despachos.', 'success');
            navigateTo('kitchen');
        });
    });
}

// --- DESPACHOS ---
function bindDispatchEvents() {
    // Llevar a mesa (en ruta)
    document.querySelectorAll('.btn-dispatch-route').forEach(btn => {
        btn.addEventListener('click', () => {
            const { orderId, itemId } = btn.dataset;
            OrderService.updateItemStatus(orderId, itemId, 'en_ruta', AppState.currentUser.username);
            showToast('Runner en camino a la mesa.', 'info');
            navigateTo('dispatch');
        });
    });

    // Confirmar entrega
    document.querySelectorAll('.btn-dispatch-delivered').forEach(btn => {
        btn.addEventListener('click', () => {
            const { orderId, itemId } = btn.dataset;
            OrderService.updateItemStatus(orderId, itemId, 'entregado', AppState.currentUser.username);
            showToast('¡Entrega completada exitosamente en la mesa!', 'success');
            navigateTo('dispatch');
        });
    });
}

// --- USUARIOS ---
function bindUsersEvents() {
    const btnNewUser = document.getElementById('btn-open-create-user-modal');
    if (btnNewUser) {
        btnNewUser.addEventListener('click', () => openCreateUserModal());
    }

    const btnResetDemo = document.getElementById('btn-reset-demo-data');
    if (btnResetDemo) {
        btnResetDemo.addEventListener('click', () => openConfirmResetModal());
    }
}

/* ==========================================================================
   MODALES ESPECÍFICOS DE OPERACIÓN
   ========================================================================== */

/**
 * Modal para administrar estado de una mesa
 */
function openManageTableModal(tableId) {
    const table = TableService.getById(tableId);
    if (!table) return;

    const orders = OrderService.getOpen().filter(o => o.tableId === table.id);
    const reservations = ReservationService.getAll().filter(r => r.tableId === table.id && r.status === 'confirmada');

    const html = `
        <div class="modal-header">
            <div>
                <span class="badge badge-outline">${sanitizeHTML(table.zone)}</span>
                <h2 class="modal-title glow-title">Mesa ${table.number} - ${sanitizeHTML(table.name)}</h2>
            </div>
            <button class="btn-close-modal">&times;</button>
        </div>
        <div class="modal-body">
            <div class="table-info-box">
                <p>Capacidad Máxima: <strong>${table.capacity} personas</strong></p>
                <p>Consumo Mínimo Sugerido: <strong>$${table.minConsumption}</strong></p>
                <p>Estado Actual: <span class="badge badge-${table.status === 'disponible' ? 'green' : (table.status === 'reservada' ? 'cyan' : 'magenta')}">${table.status.toUpperCase()}</span></p>
            </div>

            <h4 class="section-subheading">Cambiar Estado Manualmente</h4>
            <div class="status-change-buttons">
                <button class="btn btn-outline-green ${table.status === 'disponible' ? 'active' : ''}" id="btn-set-disp">
                    Disponible
                </button>
                <button class="btn btn-outline-cyan ${table.status === 'reservada' ? 'active' : ''}" id="btn-set-res">
                    Reservada
                </button>
                <button class="btn btn-outline-magenta ${table.status === 'ocupada' ? 'active' : ''}" id="btn-set-ocup">
                    Ocupada
                </button>
            </div>

            ${orders.length > 0 ? `
                <div class="modal-orders-snippet">
                    <h4 class="section-subheading">Comanda Abierta en esta Mesa:</h4>
                    <p>Total Acumulado: <strong>$${orders[0].items.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2)}</strong> (${orders[0].items.length} ítems)</p>
                </div>
            ` : ''}

            ${reservations.length > 0 ? `
                <div class="modal-orders-snippet">
                    <h4 class="section-subheading">Reserva Próxima:</h4>
                    <p>Cliente: <strong>${sanitizeHTML(reservations[0].customerName)}</strong> a las ${sanitizeHTML(reservations[0].time)}</p>
                </div>
            ` : ''}
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost btn-close-modal">Cerrar</button>
            ${hasPermission(AppState.currentUser.role, 'orders') ? `
                <button class="btn btn-primary-neon" id="btn-modal-open-order-for-table">
                    ${orders.length > 0 ? 'Ver / Agregar Ítems a Comanda' : 'Abrir Comanda para esta Mesa'}
                </button>
            ` : ''}
        </div>
    `;

    openModal(html);

    document.getElementById('btn-set-disp')?.addEventListener('click', () => {
        TableService.updateStatus(table.id, 'disponible', AppState.currentUser.username);
        showToast(`Mesa ${table.number} ahora está disponible.`, 'success');
        closeModal();
        navigateTo(AppState.currentView);
    });

    document.getElementById('btn-set-res')?.addEventListener('click', () => {
        TableService.updateStatus(table.id, 'reservada', AppState.currentUser.username);
        showToast(`Mesa ${table.number} marcada como reservada.`, 'info');
        closeModal();
        navigateTo(AppState.currentView);
    });

    document.getElementById('btn-set-ocup')?.addEventListener('click', () => {
        TableService.updateStatus(table.id, 'ocupada', AppState.currentUser.username);
        showToast(`Mesa ${table.number} marcada como ocupada.`, 'warning');
        closeModal();
        navigateTo(AppState.currentView);
    });

    document.getElementById('btn-modal-open-order-for-table')?.addEventListener('click', () => {
        closeModal();
        if (orders.length > 0) {
            openAddItemsToOrderModal(orders[0].id);
        } else {
            openCreateOrderModal(table.id);
        }
    });
}

/**
 * Modal para registrar una nueva reserva
 */
function openNewReservationModal() {
    const tables = TableService.getAll();
    const todayStr = new Date().toISOString().split('T')[0];

    const html = `
        <div class="modal-header">
            <h2 class="modal-title glow-title">Nueva Reserva Night Lounge</h2>
            <button class="btn-close-modal">&times;</button>
        </div>
        <form id="form-new-reservation">
            <div class="modal-body">
                <div class="form-row">
                    <div class="form-group flex-1">
                        <label for="res-table">Mesa Lounge a Reservar</label>
                        <select id="res-table" class="form-control" required>
                            <option value="">-- Selecciona una Mesa --</option>
                            ${tables.map(t => `
                                <option value="${t.id}" data-cap="${t.capacity}">
                                    ${t.number} - ${sanitizeHTML(t.name)} (${sanitizeHTML(t.zone)} - ${t.capacity} pax) [${t.status}]
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group flex-1">
                        <label for="res-guests">Nº Personas (Pax)</label>
                        <input type="number" id="res-guests" class="form-control" min="1" max="15" value="2" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group flex-1">
                        <label for="res-date">Fecha de la Reserva</label>
                        <input type="date" id="res-date" class="form-control" value="${todayStr}" required>
                    </div>
                    <div class="form-group flex-1">
                        <label for="res-time">Hora de Llegada</label>
                        <input type="time" id="res-time" class="form-control" value="21:00" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group flex-1">
                        <label for="res-customer">Nombre Completo del Titular</label>
                        <input type="text" id="res-customer" class="form-control" placeholder="ej: Valentina Ross" required>
                    </div>
                    <div class="form-group flex-1">
                        <label for="res-phone">Teléfono de Contacto</label>
                        <input type="tel" id="res-phone" class="form-control" placeholder="+57 300 123 4567" required>
                    </div>
                </div>

                <div class="form-group">
                    <label for="res-notes">Observaciones / Peticiones VIP (Opcional)</label>
                    <textarea id="res-notes" class="form-control" rows="2" placeholder="Cumpleaños, vino tinto reserva, cubeta con hielo..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-ghost btn-close-modal">Cancelar</button>
                <button type="submit" class="btn btn-primary-neon">Confirmar & Asignar Reserva</button>
            </div>
        </form>
    `;

    openModal(html);

    const form = document.getElementById('form-new-reservation');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const tableId = document.getElementById('res-table').value;
        const guests = parseInt(document.getElementById('res-guests').value, 10);
        const date = document.getElementById('res-date').value;
        const time = document.getElementById('res-time').value;
        const customerName = document.getElementById('res-customer').value;
        const customerPhone = document.getElementById('res-phone').value;
        const notes = document.getElementById('res-notes').value;

        const result = ReservationService.create({
            tableId,
            guests,
            date,
            time,
            customerName,
            customerPhone,
            notes
        }, AppState.currentUser.username);

        if (result.success) {
            showToast('¡Reserva creada exitosamente y mesa actualizada!', 'success');
            closeModal();
            navigateTo('reservations');
        } else {
            alert(result.message);
        }
    });
}

/**
 * Modal para crear un nuevo pedido / comanda
 */
function openCreateOrderModal(presetTableId = null) {
    const tables = TableService.getAll();
    const menu = MenuService.getAll();
    AppState.newOrderItems = [];

    const html = `
        <div class="modal-header">
            <h2 class="modal-title glow-title">Apertura de Comanda Lounge</h2>
            <button class="btn-close-modal">&times;</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="order-table-select">Selecciona la Mesa</label>
                <select id="order-table-select" class="form-control">
                    ${tables.map(t => `
                        <option value="${t.id}" ${presetTableId === t.id ? 'selected' : ''}>
                            Mesa ${t.number} - ${sanitizeHTML(t.name)} (${sanitizeHTML(t.zone)})
                        </option>
                    `).join('')}
                </select>
            </div>

            <h4 class="section-subheading">Carta & Coctelería de Autor</h4>
            <div class="menu-selection-grid">
                ${menu.map(item => `
                    <div class="menu-item-card">
                        <div class="menu-item-info">
                            <span class="menu-item-icon">${item.icon}</span>
                            <div>
                                <strong>${sanitizeHTML(item.name)}</strong>
                                <div class="text-cyan font-bold">$${item.price.toFixed(2)}</div>
                                <small class="text-muted">${sanitizeHTML(item.category)}</small>
                            </div>
                        </div>
                        <button class="btn btn-xs btn-primary-neon btn-add-menu-item" data-menu-id="${item.id}">
                            + Agregar
                        </button>
                    </div>
                `).join('')}
            </div>

            <h4 class="section-subheading mt-4">Ítems de esta Comanda:</h4>
            <div id="order-items-buffer-container" class="order-buffer-wrap">
                <p class="text-muted text-center py-2">Selecciona ítems del menú superior.</p>
            </div>

            <div class="order-totals-summary">
                <span>Total Estimado:</span>
                <strong id="order-buffer-total" class="text-cyan text-lg">$0.00</strong>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-ghost btn-close-modal">Cancelar</button>
            <button type="button" class="btn btn-primary-neon" id="btn-submit-create-order">
                Enviar Comanda a Cocina y Bar &rarr;
            </button>
        </div>
    `;

    openModal(html);

    // Eventos para agregar ítems al buffer
    document.querySelectorAll('.btn-add-menu-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const menuId = btn.dataset.menuId;
            const menuItem = menu.find(m => m.id === menuId);
            if (!menuItem) return;

            const existing = AppState.newOrderItems.find(i => i.menuId === menuId);
            if (existing) {
                existing.quantity++;
            } else {
                AppState.newOrderItems.push({
                    menuId: menuItem.id,
                    name: menuItem.name,
                    price: menuItem.price,
                    station: menuItem.station,
                    quantity: 1,
                    notes: ''
                });
            }
            renderOrderItemsBuffer();
        });
    });

    // Botón de confirmación y envío de comanda
    document.getElementById('btn-submit-create-order')?.addEventListener('click', () => {
        const tableId = document.getElementById('order-table-select').value;
        if (AppState.newOrderItems.length === 0) {
            alert('Por favor agrega al menos un platillo o cóctel al pedido.');
            return;
        }

        const res = OrderService.create({
            tableId,
            waiter: AppState.currentUser.name,
            items: AppState.newOrderItems
        }, AppState.currentUser.username);

        if (res.success) {
            showToast('¡Comanda enviada a las pantallas de Cocina y Bar!', 'success');
            closeModal();
            navigateTo('orders');
        } else {
            alert(res.message);
        }
    });
}

function renderOrderItemsBuffer() {
    const container = document.getElementById('order-items-buffer-container');
    const totalEl = document.getElementById('order-buffer-total');
    if (!container || !totalEl) return;

    if (AppState.newOrderItems.length === 0) {
        container.innerHTML = `<p class="text-muted text-center py-2">Selecciona ítems del menú superior.</p>`;
        totalEl.textContent = '$0.00';
        return;
    }

    let grandTotal = 0;
    container.innerHTML = AppState.newOrderItems.map((it, idx) => {
        const sub = it.price * it.quantity;
        grandTotal += sub;
        return `
            <div class="order-buffer-item">
                <div class="buffer-item-col">
                    <strong>${sanitizeHTML(it.name)}</strong>
                    <input type="text" class="input-buffer-notes" data-idx="${idx}" placeholder="Notas (ej: sin sal, hielo frappé...)" value="${sanitizeHTML(it.notes)}">
                </div>
                <div class="buffer-qty-controls">
                    <button class="btn-qty btn-minus" data-idx="${idx}">-</button>
                    <span class="qty-number">${it.quantity}</span>
                    <button class="btn-qty btn-plus" data-idx="${idx}">+</button>
                </div>
                <div class="buffer-item-price">$${sub.toFixed(2)}</div>
                <button class="btn-delete-buffer-item" data-idx="${idx}">&times;</button>
            </div>
        `;
    }).join('');

    totalEl.textContent = `$${grandTotal.toFixed(2)}`;

    // Manejadores de cantidad y eliminación
    container.querySelectorAll('.btn-plus').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx, 10);
            AppState.newOrderItems[idx].quantity++;
            renderOrderItemsBuffer();
        });
    });

    container.querySelectorAll('.btn-minus').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx, 10);
            if (AppState.newOrderItems[idx].quantity > 1) {
                AppState.newOrderItems[idx].quantity--;
            } else {
                AppState.newOrderItems.splice(idx, 1);
            }
            renderOrderItemsBuffer();
        });
    });

    container.querySelectorAll('.btn-delete-buffer-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx, 10);
            AppState.newOrderItems.splice(idx, 1);
            renderOrderItemsBuffer();
        });
    });

    container.querySelectorAll('.input-buffer-notes').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = parseInt(input.dataset.idx, 10);
            AppState.newOrderItems[idx].notes = e.target.value;
        });
    });
}

/**
 * Modal para agregar más ítems a un pedido existente
 */
function openAddItemsToOrderModal(orderId) {
    const order = OrderService.getById(orderId);
    if (!order) return;
    const menu = MenuService.getAll();
    AppState.newOrderItems = [];

    const html = `
        <div class="modal-header">
            <h2 class="modal-title glow-title">Agregar Ítems a ${sanitizeHTML(order.tableName)}</h2>
            <button class="btn-close-modal">&times;</button>
        </div>
        <div class="modal-body">
            <p class="text-muted">Pedido #${order.id} abierto actualmente.</p>

            <h4 class="section-subheading">Selecciona Ítems Adicionales</h4>
            <div class="menu-selection-grid">
                ${menu.map(item => `
                    <div class="menu-item-card">
                        <div class="menu-item-info">
                            <span class="menu-item-icon">${item.icon}</span>
                            <div>
                                <strong>${sanitizeHTML(item.name)}</strong>
                                <div class="text-cyan font-bold">$${item.price.toFixed(2)}</div>
                            </div>
                        </div>
                        <button class="btn btn-xs btn-primary-neon btn-add-extra-item" data-menu-id="${item.id}">
                            + Añadir
                        </button>
                    </div>
                `).join('')}
            </div>

            <h4 class="section-subheading mt-4">Nuevos Ítems por Enviar:</h4>
            <div id="order-items-buffer-container" class="order-buffer-wrap">
                <p class="text-muted text-center py-2">Ningún ítem extra seleccionado aún.</p>
            </div>
            <div class="order-totals-summary">
                <span>Total de este envío:</span>
                <strong id="order-buffer-total" class="text-cyan text-lg">$0.00</strong>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-ghost btn-close-modal">Cancelar</button>
            <button type="button" class="btn btn-primary-neon" id="btn-submit-add-more">
                Enviar Nuevos Ítems a Cocina / Bar
            </button>
        </div>
    `;

    openModal(html);

    document.querySelectorAll('.btn-add-extra-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const menuId = btn.dataset.menuId;
            const menuItem = menu.find(m => m.id === menuId);
            if (!menuItem) return;

            const existing = AppState.newOrderItems.find(i => i.menuId === menuId);
            if (existing) {
                existing.quantity++;
            } else {
                AppState.newOrderItems.push({
                    menuId: menuItem.id,
                    name: menuItem.name,
                    price: menuItem.price,
                    station: menuItem.station,
                    quantity: 1,
                    notes: ''
                });
            }
            renderOrderItemsBuffer();
        });
    });

    document.getElementById('btn-submit-add-more')?.addEventListener('click', () => {
        if (AppState.newOrderItems.length === 0) {
            alert('Agrega al menos un ítem nuevo.');
            return;
        }

        // Agregar ítems al pedido existente
        const orders = OrderService.getAll();
        const ord = orders.find(o => o.id === orderId);
        if (ord) {
            AppState.newOrderItems.forEach((it, idx) => {
                ord.items.push({
                    itemId: 'ITEM-' + Date.now() + '-' + idx,
                    menuId: it.menuId,
                    name: it.name,
                    price: it.price,
                    quantity: it.quantity,
                    station: it.station,
                    notes: it.notes,
                    status: 'pendiente'
                });
            });
            // Guardar cambios
            localStorage.setItem('reserva_rest_orders', JSON.stringify(orders));
            showToast('Nuevos ítems despachados a Cocina y Bar.', 'success');
            closeModal();
            navigateTo('orders');
        }
    });
}

/**
 * Modal para cobrar y cerrar comanda
 */
function openCloseOrderModal(orderId) {
    const order = OrderService.getById(orderId);
    if (!order) return;

    const total = order.items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const serviceFee = total * 0.10; // 10% propina sugerida de Lounge
    const grandTotal = total + serviceFee;

    const html = `
        <div class="modal-header">
            <h2 class="modal-title glow-title">Liquidar Cuenta • ${sanitizeHTML(order.tableName)}</h2>
            <button class="btn-close-modal">&times;</button>
        </div>
        <div class="modal-body">
            <div class="billing-summary-box">
                <div class="billing-row">
                    <span>Subtotal Comanda (${order.items.length} productos):</span>
                    <strong>$${total.toFixed(2)}</strong>
                </div>
                <div class="billing-row">
                    <span>Servicio Nocturno Sugerido (10%):</span>
                    <span>$${serviceFee.toFixed(2)}</span>
                </div>
                <div class="billing-divider"></div>
                <div class="billing-row total-highlight">
                    <span>Total a Pagar:</span>
                    <strong class="text-cyan text-xl">$${grandTotal.toFixed(2)}</strong>
                </div>
            </div>

            <div class="form-group mt-3">
                <label>Método de Pago</label>
                <div class="payment-methods-grid">
                    <label class="payment-method-label">
                        <input type="radio" name="paymethod" value="tarjeta" checked>
                        <span>💳 Tarjeta Black / Débito</span>
                    </label>
                    <label class="payment-method-label">
                        <input type="radio" name="paymethod" value="efectivo">
                        <span>💵 Efectivo</span>
                    </label>
                    <label class="payment-method-label">
                        <input type="radio" name="paymethod" value="transferencia">
                        <span>📱 Transferencia VIP</span>
                    </label>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost btn-close-modal">Cancelar</button>
            <button class="btn btn-outline-green" id="btn-confirm-payment">
                ✓ Procesar Pago & Liberar Mesa
            </button>
        </div>
    `;

    openModal(html);

    document.getElementById('btn-confirm-payment')?.addEventListener('click', () => {
        OrderService.closeOrder(order.id, AppState.currentUser.username);
        showToast(`Comanda ${order.id} liquidada con éxito por $${grandTotal.toFixed(2)}. Mesa liberada.`, 'success');
        closeModal();
        navigateTo('orders');
    });
}

/**
 * Modal para registrar nuevo personal (Admin)
 */
function openCreateUserModal() {
    const html = `
        <div class="modal-header">
            <h2 class="modal-title glow-title">Registrar Nuevo Personal</h2>
            <button class="btn-close-modal">&times;</button>
        </div>
        <form id="form-create-user">
            <div class="modal-body">
                <div class="form-group">
                    <label for="new-username">Nombre de Usuario (Login)</label>
                    <input type="text" id="new-username" class="form-control" placeholder="ej: runner_carlos" required minlength="3">
                </div>
                <div class="form-group">
                    <label for="new-name">Nombre y Apellidos</label>
                    <input type="text" id="new-name" class="form-control" placeholder="ej: Carlos Santana" required>
                </div>
                <div class="form-group">
                    <label for="new-role">Rol y Nivel de Acceso</label>
                    <select id="new-role" class="form-control" required>
                        <option value="mesero">🍸 Mesero / Atención Lounge</option>
                        <option value="cocina">🔥 Cocina / Mixólogo de Bar</option>
                        <option value="despacho">🚀 Runner / Despacho a Mesas</option>
                        <option value="admin">👑 Administrador Completo</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="new-pass">Contraseña (Será hasheada con SHA-256)</label>
                    <input type="password" id="new-pass" class="form-control" placeholder="••••••••" required minlength="4">
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-ghost btn-close-modal">Cancelar</button>
                <button type="submit" class="btn btn-primary-neon">Guardar y Hashear Credenciales</button>
            </div>
        </form>
    `;

    openModal(html);

    document.getElementById('form-create-user')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('new-username').value;
        const name = document.getElementById('new-name').value;
        const role = document.getElementById('new-role').value;
        const password = document.getElementById('new-pass').value;

        const res = await registerUser(username, password, name, role);
        if (res.success) {
            showToast(res.message, 'success');
            closeModal();
            navigateTo('users');
        } else {
            alert(res.message);
        }
    });
}

/**
 * Modal de confirmación para resetear datos demo (Admin)
 */
function openConfirmResetModal() {
    const html = `
        <div class="modal-header">
            <h2 class="modal-title glow-title text-magenta">Confirmación de Reseteo Seguro</h2>
            <button class="btn-close-modal">&times;</button>
        </div>
        <div class="modal-body">
            <p>¿Estás seguro de que deseas restablecer todos los datos a la demostración inicial?</p>
            <p class="text-muted text-sm">Se restaurarán las 8 mesas, los 8 platos y cócteles, las reservas iniciales, las comandas activas y los usuarios demo con contraseñas SHA-256.</p>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost btn-close-modal">Cancelar</button>
            <button class="btn btn-outline-magenta" id="btn-execute-reset">
                ⚠️ Sí, Resetear Todo
            </button>
        </div>
    `;

    openModal(html);

    document.getElementById('btn-execute-reset')?.addEventListener('click', async () => {
        try {
            await resetAllDemoData(AppState.currentUser);
            showToast('Todos los datos demo fueron restaurados exitosamente.', 'success');
            closeModal();
            navigateTo('dashboard');
        } catch (err) {
            alert(err.message);
        }
    });
}


    // Exportación global de funciones clave de app
    window.showToast = showToast;
    window.navigateTo = navigateTo;
    window.AppState = AppState;
})();
