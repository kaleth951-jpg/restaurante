# ReservaRest - Night Lounge & Exclusive Bar 🍸✨

Sistema integral de gestión de reservas, mesas, comandas, KDS de cocina/bar y despachos, diseñado con estética Night Lounge (Dark Mode, efectos neón y glassmorphism).

---

## 🚀 Despliegue en GitHub Pages

Este proyecto está construido 100% con tecnologías web estándar (HTML5, Vanilla CSS3 y JavaScript ES6+), sin necesidad de compilación o backend adicional:

1. Sube este repositorio a tu cuenta de **GitHub**.
2. Ve a la pestaña **Settings** (Configuración) de tu repositorio.
3. En el menú lateral izquierdo, haz clic en **Pages**.
4. En **Build and deployment** -> **Branch**, selecciona la rama `main` (o `master`) y la carpeta `/ (root)`.
5. Haz clic en **Save**. En 1 o 2 minutos tu sistema estará en vivo en:
   `https://<tu-usuario>.github.io/<tu-repositorio>/`

---

## 🔑 Credenciales Demo de Acceso

La pantalla de bienvenida incluye botones de acceso rápido con las siguientes cuentas y roles:

| Rol | Usuario | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **👑 Administrador** | `admin` | `admin123` | Control total: Mesas, Reservas, Comandas, Cocina, Despacho, Usuarios y Reseteo Demo |
| **🍸 Mesero** | `mesero` | `mesero123` | Gestión de mesas, reservas y toma de pedidos |
| **🔥 Cocina & Bar** | `cocina` | `cocina123` | Monitor KDS en tiempo real para preparación de comandas |
| **🚀 Despacho** | `despacho` | `despacho123` | Cola de entregas y runners a mesas |

---

## 🛡️ Características de Seguridad y Rendimiento

* **Persistencia local inmediata**: Todo el flujo de datos se almacena en `localStorage` del navegador.
* **Criptografía SHA-256**: Las contraseñas nunca se guardan en texto plano; se utiliza Web Crypto API nativa con respaldo en JavaScript puro.
* **Protección contra manipulación de sesión (Anti-Tampering)**: La sesión se firma con checksum criptográfico para prevenir elevación de privilegios desde las DevTools.
* **Control de Acceso Basado en Roles (RBAC)**: Enrutador protegido y vistas restringidas según el rol del usuario autenticado.
* **Prevención XSS**: Sanitización de entradas y cadenas dinámicas antes de su renderizado en el DOM.
* **Auditoría de eventos**: Registro automático de las últimas 150 operaciones críticas del sistema.

---

## 📁 Estructura del Proyecto

```text
├── index.html          # Punto de entrada y contenedor SPA
├── css/
│   └── styles.css      # Sistema de diseño Lounge, tokens de color y responsividad
├── js/
│   ├── storage.js      # Persistencia en localStorage, SHA-256 y sanitización XSS
│   ├── auth.js         # Autenticación, RBAC y gestión de sesiones
│   ├── modules.js      # Lógica de negocio, servicios y renderizadores de vistas
│   └── app.js          # Controlador principal, enrutamiento y modales
├── .gitignore          # Exclusión de archivos temporales
└── README.md           # Documentación del proyecto
```
