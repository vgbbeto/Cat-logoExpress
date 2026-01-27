# 🛒 Catálogo WhatsApp

Este es un sistema de catálogo digital e-commerce integrado con flujos de trabajo de WhatsApp, desarrollado con un stack moderno y escalable. Permite la gestión completa de productos, categorías, marcas y un sistema robusto de pedidos con estados en tiempo real.

## 🚀 Tecnologías Utilizadas

El proyecto utiliza las siguientes tecnologías:

* [cite_start]**Frontend:** [SvelteKit](https://kit.svelte.dev/) (Framework principal)[cite: 7, 9].
* [cite_start]**Estilos:** [Tailwind CSS](https://tailwindcss.com/) y [PostCSS](https://postcss.org/)[cite: 6, 8].
* [cite_start]**Base de Datos y Autenticación:** [Supabase](https://supabase.com/)[cite: 17472].
* [cite_start]**Herramienta de Construcción:** [Vite](https://vitejs.dev/)[cite: 8].
* [cite_start]**Despliegue:** [Vercel](https://vercel.com/)[cite: 8].
* [cite_start]**Iconografía:** [Lucide Svelte](https://lucide.dev/) (inferido por Icon.js).

## 📦 Estructura del Proyecto

La arquitectura sigue el patrón de rutas de SvelteKit, dividida en secciones lógicas:

* [cite_start]**`/routes/(admin)`**: Panel administrativo para la gestión de categorías, marcas, productos, mensajes y configuración del sistema[cite: 42, 44, 50, 60, 65].
* [cite_start]**`/routes/(auth)`**: Módulo de autenticación (Login/Logout)[cite: 74, 17473].
* [cite_start]**`/routes/(tienda)`**: Interfaz pública del catálogo donde los clientes pueden navegar y añadir productos al carrito[cite: 76, 78].
* [cite_start]**`/routes/api`**: Endpoints del backend para procesar lógica compleja de pedidos, subida de archivos y reportes[cite: 82, 95, 17471].

## ✨ Funcionalidades Principales

### 🛠️ Administración
* [cite_start]**Dashboard:** Visualización de métricas clave del negocio[cite: 48].
* [cite_start]**Gestión de Inventario:** CRUD completo de productos, categorías y marcas[cite: 44, 50, 65].
* [cite_start]**Reportes:** Generación de resúmenes de pedidos y rendimiento de productos[cite: 73, 17471].

### 📝 Gestión de Pedidos (API)
El sistema cuenta con un flujo de estados avanzado para los pedidos:
* [cite_start]Confirmación y cancelación de pedidos[cite: 102].
* [cite_start]Validación de pagos y subida de comprobantes[cite: 17470].
* [cite_start]Historial de cambios de estado[cite: 17470].
* [cite_start]Generación de mensajes automáticos para WhatsApp[cite: 17470].
* [cite_start]Seguimiento de envíos y recepción[cite: 17470].

### 🛒 Tienda Online
* [cite_start]Carrito de compras persistente[cite: 78].
* [cite_start]Seguimiento de "Mis Pedidos" para el cliente final[cite: 79].

## 🛠️ Instalación y Configuración

Sigue estos pasos para ejecutar el proyecto localmente:

1.  **Clonar el repositorio:**
    ```bash
    git clone 
    cd 
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz (basándote en `.env.example` si existe) y añade tus credenciales de Supabase:
    ```env
    PUBLIC_SUPABASE_URL=tu_url_aqui
    PUBLIC_SUPABASE_ANON_KEY=tu_llave_aqui
    ```

4.  **Ejecutar en modo desarrollo:**
    ```bash
    npm run dev
    ```

## 🚀 Despliegue

[cite_start]El proyecto está optimizado para **Vercel**[cite: 8, 17471]. Para desplegar:

1. Conecta tu repositorio a Vercel.
2. Configura las variables de entorno en el panel de Vercel.
3. [cite_start]El comando de build detectará automáticamente `svelte.config.js` y usará el adaptador correspondiente[cite: 7].

---
Desarrollado por [web.simplx@gmail.com] - 2026
