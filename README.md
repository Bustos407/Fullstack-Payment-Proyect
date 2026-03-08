# FullStack Payment Checkout – Prueba Técnica

Aplicación SPA para procesar pagos con tarjeta de crédito, integrada con pasarela de pagos en modo Sandbox.

## Stack

- **Frontend**: React + TypeScript + Vite + Redux Toolkit (SPA mobile-first, responsive)
- **Backend**: NestJS + TypeScript + TypeORM
- **Base de datos**: PostgreSQL

## Estructura del proyecto

```
├── backend/          # API REST NestJS
├── frontend/         # SPA React + Redux
├── docker-compose.yml
└── README.md
```

## Modelo de datos

```
products
├── id (PK)
├── name
├── description
├── price (numeric)
└── stock (int)

payments
├── id (PK, uuid)
├── product_id (FK → products)
├── units
├── totalAmount
├── status (PENDING | APPROVED | REJECTED)
├── customerName
├── customerEmail
├── deliveryAddress
├── wompiTransactionId (nullable)
└── createdAt
```

## API (endpoints)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/products` | Lista productos con stock |
| POST | `/api/payments` | Crea pago (API Wompi Sandbox: cardToken, acceptanceToken, acceptPersonalAuth) |
| GET | `/api/payments/:id` | Obtiene pago por ID |

### Documentación

- **Swagger UI** (local): `http://localhost:3000/api/docs`
- **Postman Collection**: [`postman_collection.json`](./postman_collection.json) — importar en Postman para probar los endpoints.

## Requisitos previos

- Node.js LTS
- Docker (opcional, para PostgreSQL)

## Cómo ejecutar

### 1. Base de datos (PostgreSQL)

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
npm install
npm run start:dev
```

La API queda en `http://localhost:3000/api`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

La app queda en `http://localhost:5173`.

## Flujo de la aplicación

1. **Productos** → Selección de producto y unidades
2. **Tarjeta y entrega** → Datos de tarjeta y dirección
3. **Resumen** → Subtotal + Base fee + Envío = Total
4. **Resultado** → Aprobado o rechazado + ID de transacción
5. **Volver** → Regreso a productos con stock actualizado

El estado se persiste en `localStorage` para recuperar el progreso tras un refresh.
Los datos de tarjeta **no** se almacenan (persistencia segura).

## Integración con pasarela de pagos (Sandbox)

La app usa **solo** la API Wompi Sandbox (`https://api-sandbox.co.uat.wompi.dev/v1`). Las llaves del enunciado vienen por defecto; se pueden sobrescribir con `.env`:

**Backend** (`backend/.env`):

```
WOMPI_PRIVATE_KEY=prv_stagtest_...
WOMPI_INTEGRITY_SECRET=stagtest_integrity_...
WOMPI_BASE_URL=https://api-sandbox.co.uat.wompi.dev/v1
```

**Frontend** (`frontend/.env`):

```
VITE_WOMPI_PUBLIC_KEY=pub_stagtest_...
VITE_WOMPI_BASE_URL=https://api-sandbox.co.uat.wompi.dev/v1
```

## Pruebas unitarias (Jest)

### Backend

```bash
cd backend
npm test
npm run test:cov
```

### Frontend

```bash
cd frontend
npm test
npm run test:cov
```

### Cobertura

Se exige **más del 80%** en pruebas unitarias (Jest) en backend y frontend.

**Backend** (`cd backend && npm run test:cov`):

| Métrica   | Cobertura |
|----------|-----------|
| Statements | 95%+   |
| Branches   | 82%+   |
| Functions  | 87%+   |
| Lines      | 95%+   |

*(Se excluyen de cobertura: `main.ts`, módulos `*.module.ts`, entidades TypeORM e infraestructura del cliente HTTP de la pasarela.)*

**Frontend** (`cd frontend && npm run test:cov`):

| Métrica   | Cobertura |
|----------|-----------|
| Statements | 86%+   |
| Branches   | 59%+   |
| Functions  | 84%+   |
| Lines      | 87%+   |

*(Se excluyen: `main.tsx`, `store.ts`, `api/wompi.ts` por uso de `import.meta` en Jest.)*

## Despliegue

- **App desplegada**: [URL de tu app en AWS] *(pendiente de desplegar)*
- **API desplegada**: [URL de tu API en AWS] *(pendiente de desplegar)*
- **Swagger**: `https://<tu-api-url>/api/docs` *(tras desplegar)*

**Recomendación**: desplegar la API en **AWS ECS/Fargate** o **Lambda** + API Gateway, la SPA en **S3 + CloudFront**, y la base de datos en **RDS (PostgreSQL)** o equivalente. Usar HTTPS en todos los puntos de entrada.

## Seguridad (OWASP / bonus)

- **Headers de seguridad**: el backend usa **Helmet** para establecer cabeceras seguras (X-Content-Type-Options, X-Frame-Options, etc.).
- **HTTPS**: en producción se debe exponer la API y la app tras HTTPS (CloudFront, ALB o similar).
- **Validación**: `ValidationPipe` de NestJS con `whitelist` y `forbidNonWhitelisted` para evitar datos no esperados en los DTOs.

## Arquitectura

- **Backend**: **Hexagonal (Ports & Adapters)** con capas:
  - **Dominio**: entidades y reglas de negocio (p. ej. reserva de stock).
  - **Aplicación**: casos de uso (servicios), DTOs y tipo **Result** para **ROP** (Railway Oriented Programming) en el flujo mock de pagos.
  - **Infraestructura**: TypeORM (repositorios), cliente HTTP de la pasarela (implementa el puerto `IWompiClient`).
  - **Presentación**: controladores REST que desenvuelven el Result y devuelven códigos HTTP adecuados.
- **Frontend**: Redux Toolkit (Flux). Estado de checkout persistido en `localStorage` (sin datos de tarjeta). Constantes de tarifas en `constants/fees.ts` alineadas con el backend.

## Referencias

- [Inicio rápido pasarela](https://docs.wompi.co/docs/colombia/inicio-rapido/)
- [Ambientes y llaves](https://docs.wompi.co/docs/colombia/ambientes-y-llaves/)
- [Guía Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
