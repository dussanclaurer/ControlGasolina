# Documento de Contexto y Arquitectura Técnica

## Aplicación de Control Social de Combustible

Este documento reúne las especificaciones funcionales, los requisitos técnicos, las decisiones de arquitectura y la estructura base acordada para el desarrollo del sistema de fiscalización de venta de combustibles en surtidores.

---

## 1. Descripción del Problema y Objetivo General

El proyecto surge ante la necesidad de fiscalizar y controlar la comercialización de combustible (gasolina) en las estaciones de servicio (surtidores) para evitar desvíos o compras excesivas que superen los límites legales permitidos por los entes reguladores.

**Objetivo General:** Desarrollar una aplicación web móvil (PWA) centralizada que permita al personal del grupo de "Control Social" registrar en tiempo real cada transacción de compra y validar instantáneamente si el cliente dispone de cupo libre para abastecerse.

---

## 2. Requerimientos Funcionales

### A. Registro de Operaciones (En Surtidor)

Cada punto de venta (surtidor) contará con un operario que registrará los siguientes datos por cada transacción antes de autorizar el carguío:

- **Datos del Cliente/Vehículo:** Carnet de Identidad (CI), Nombre completo del conductor, Número de Chasis del vehículo.
- **Datos de la Compra:** Cantidad en Bs a cargar (Bs. 6.96 por litro), Fecha y hora automática del sistema, Identificador o nombre del surtidor. El volumen en litros se mostrara en base a la cantidad en Bs y el precio del litro.

### B. Control de Cupos y Bloqueos en Tiempo Real

- El sistema debe tener en cuenta que solo se puede cargar una vez por dia en un surtidor tomando en cuenta el CI y el número de chasis. Si se detecta que ya se ha cargado una vez en un surtidor, se debe bloquear el registro de la venta.
- No existe un limite de cargar en litros por persona, solo se puede cargar una vez por dia en un surtidor tomando en cuenta el CI y el número de chasis.

### C. Visualización de Reportes (Control Social)

- Un panel dedicado para que los miembros supervisores del grupo de Control Social puedan monitorear el flujo de ventas, consultar historiales detallados y verificar qué clientes o vehículos han alcanzado su límite de consumo.

### D. Trazabilidad, Auditoría y Geolocalización (Anti-Fraude)

- **Logs de Auditoría:** El sistema mantendrá un registro estricto de cada transacción aprobada o rechazada, guardando información del operario, la fecha, hora y el dispositivo utilizado.
- **Geolocalización:** Al registrar una venta, la aplicación capturará la ubicación GPS del dispositivo para validar que corresponda con las coordenadas geográficas del surtidor autorizado, previniendo "ventas fantasmas" desde ubicaciones no permitidas.
  - Cada surtidor tendrá coordenadas de geolocalización predefinidas. El sistema rechazará cualquier intento de registro si la ubicación del dispositivo no coincide con las coordenadas del surtidor autorizado.
  - Habra un margen de tolerancia de 100 metros de radio para cada surtidor.

### E. Tolerancia a Fallos de Red (Modo Offline)

- Ante la pérdida de conexión a internet en el surtidor, la aplicación debe poder seguir operando mediante almacenamiento local temporal (`IndexedDB`).
- Los registros realizados en modo offline se encolarán y se sincronizarán automáticamente con el servidor central una vez que se restablezca la conexión, aplicando las validaciones de cupo de forma diferida.

---

## 3. Arquitectura Técnica Seleccionada

Para maximizar la velocidad de desarrollo, simplificar el mantenimiento y garantizar una experiencia de usuario fluida en dispositivos móviles, se ha optado por un enfoque moderno y unificado:

- **usar pnpm** como gestor de paquetes, **NO usar npm o yarn**.
- **Framework Principal:** `Next.js` (utilizando el paradigma de **App Router**).
- **Base de Datos y ORM:** Se utilizará **PostgreSQL** como base de datos relacional para garantizar la integridad y el manejo de transacciones concurrentes (crucial para el control de cupos). La interacción con la base de datos se realizará a través de **Prisma ORM**, permitiendo consultas seguras y fuertemente tipadas.
- **Modelo de Backend:** Monolítico integrado. En lugar de desarrollar una API independiente (Node.js/Express, Python, etc.), la lógica de negocio y la conexión a la base de datos se manejan directamente dentro del servidor de Next.js mediante **Server Actions** (Server Functions). Esto elimina la duplicación de tipos y la complejidad de configurar CORS.
- **Estrategia de Distribución y Despliegue:** **PWA (Progressive Web App)**. La aplicación será accesible mediante una URL web ordinaria, pero estará optimizada para que los operarios puedan instalarla en la pantalla de inicio de sus dispositivos Android/iOS como si fuera una aplicación nativa, evitando el paso por tiendas de aplicaciones (Google Play Store / App Store) y garantizando actualizaciones inmediatas en caliente.
- **UI/UX y Diseño Mobile-First:** La interfaz de usuario será diseñada pensando primero en dispositivos móviles (botones accesibles, lectura rápida). Se utilizará **Tailwind CSS** para los estilos y la librería de componentes **shadcn/ui** para acelerar la construcción de interfaces limpias, accesibles y consistentes (ej. modales, alertas, formularios).

---

## 4. Configuración Base de la PWA

### Dependencia de Automatización

Se implementa `@ducanh2912/next-pwa` para gestionar la autogeneración del Service Worker y el almacenamiento en caché de activos estáticos.

### Archivos de Configuración Esenciales

#### A. `next.config.mjs`
