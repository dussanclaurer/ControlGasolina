# Control Social de Combustible ⛽

Aplicación web progresiva (PWA) diseñada para la fiscalización, registro y control de venta de combustible en surtidores. El sistema permite registrar transacciones en campo incluso sin conexión a internet y consolida los datos para que supervisores y entidades reguladoras puedan auditar la distribución de combustible en Bolivia.

## 🚀 Características Principales

*   **Offline-First:** Sistema diseñado para operar ininterrumpidamente en áreas con baja o nula cobertura de red. Las ventas realizadas sin conexión se guardan en IndexedDB y se sincronizan automáticamente en segundo plano (`background sync`) una vez que el dispositivo recupera la conexión.
*   **Reglas de Negocio Estrictas:** Bloquea ventas múltiples al mismo vehículo (combinación de Carnet de Identidad y Número de Chasis) en un mismo día dentro de un mismo surtidor.
*   **Validación Geográfica (GPS):** Captura automáticamente la latitud y longitud del dispositivo del operario al momento de cada venta, permitiendo auditorías de ubicación para prevenir fraudes.
*   **Roles y Permisos:**
    *   `OPERARIO`: Interfaz simplificada y rápida enfocada en el registro continuo de ventas.
    *   `SUPERVISOR`: Acceso a paneles administrativos, KPIs en tiempo real (recaudación y litros), historial completo con exportación CSV, y gestión CRUD de usuarios y surtidores.
*   **PWA Instalable:** Experiencia de aplicación nativa tanto en Android como iOS con íconos propios, modo *standalone* y diseño *mobile-first*.

## 🛠️ Stack Tecnológico

*   **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS v4, Lucide React (Íconos).
*   **Backend & API:** Server Actions de Next.js.
*   **Autenticación:** Auth.js (NextAuth v5) con estrategia JWT y encriptación *bcryptjs*.
*   **Base de Datos:** PostgreSQL.
*   **ORM:** Prisma v6.
*   **PWA:** `@ducanh2912/next-pwa`.

## ⚙️ Configuración y Despliegue

### Requisitos Previos
*   Node.js v20+
*   `pnpm` (Recomendado para la instalación de dependencias)
*   PostgreSQL configurado y en ejecución

### Variables de Entorno (`.env`)
Debes crear un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# URL de conexión a tu base de datos PostgreSQL
DATABASE_URL="postgresql://usuario:password@localhost:5432/control_gasolina?schema=public"

# Secreto para encriptar los JWT de Auth.js
# Genera uno con: npx auth secret
AUTH_SECRET="tu-secreto-super-seguro"
```

### Comandos de Instalación

1. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

2. **Migrar la base de datos:**
   ```bash
   npx prisma db push
   # O alternativamente: npx prisma migrate dev
   ```

3. **Poblar la base de datos (Seed):**
   ```bash
   pnpm db:seed
   ```
   *Nota: Esto creará los usuarios por defecto (ej. supervisor@control.bo) y surtidores de prueba.*

4. **Ejecutar en entorno de desarrollo:**
   ```bash
   pnpm dev
   ```

5. **Compilar para producción:**
   ```bash
   pnpm build
   pnpm start
   ```

## 📱 Uso de la PWA
Para instalar la aplicación en un dispositivo móvil:
1. Abre la aplicación en Chrome (Android) o Safari (iOS).
2. Selecciona "Añadir a la pantalla de inicio" (Add to Home Screen).
3. La aplicación se instalará localmente y podrá abrirse en modo de pantalla completa sin la barra del navegador.
