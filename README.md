# FullStack Payment Checkout

SPA de checkout para una tienda pequeña. El usuario selecciona un producto, indica unidades, completa datos de tarjeta y entrega, revisa un resumen con tarifas y realiza el pago usando **Wompi Sandbox**. El backend guarda productos y transacciones en **AWS DynamoDB**.

## Stack

- **Frontend:** React 18, TypeScript, Vite, Redux Toolkit
- **Backend:** NestJS, TypeScript
- **Persistencia:** AWS DynamoDB

## Implementacion

- Listado de productos con `name`, `description`, `price` y `stock`.
- Flujo de compra en una sola página:
  - selección de producto y unidades
  - modal con tarjeta y datos de entrega
  - resumen de pago con producto, tarifa base y envío
  - resultado final aprobado o rechazado
- Integración con **Wompi Sandbox**:
  - tokenización de tarjeta desde frontend
  - creación de pago `PENDING` en backend
  - consulta del resultado y actualización de estado
- Reserva de stock cuando el pago es aprobado.
- Seed automático de productos en DynamoDB al iniciar el backend.
- Despliegue preparado para AWS:
  - `buildspec.yml` para CodeBuild
  - script `deploy-ec2.sh` para actualizar una EC2

## Estructura

```text
├── backend/
├── frontend/
├── buildspec.yml
├── deploy-ec2.sh
└── README.md
```

## API

Base URL local: `http://localhost:3000/api`

| Method | Route | Description |
|---|---|---|
| GET | `/products` | Lista productos con stock |
| POST | `/payments` | Crea un pago usando Wompi |
| GET | `/payments/:id` | Consulta una transacción |

Documentación local:

- Swagger UI: `http://localhost:3000/api/docs`
- Postman: [`postman_collection.json`](./postman_collection.json)

## Correr en local

### 1. Crear tablas en DynamoDB

```bash
aws dynamodb create-table \
  --table-name wompi-products \
  --attribute-definitions AttributeName=id,AttributeType=N \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

aws dynamodb create-table \
  --table-name wompi-payments \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

También puedes crearlas desde la consola de AWS. Debes tener credenciales configuradas en local.

### 2. Configurar variables de entorno

**`backend/.env`**

```env
# Wompi Sandbox
WOMPI_PRIVATE_KEY=prv_stagtest_...
WOMPI_INTEGRITY_SECRET=stagtest_integrity_...
WOMPI_BASE_URL=https://api-sandbox.co.uat.wompi.dev/v1

# DynamoDB
DYNAMODB_REGION=us-east-2
DYNAMO_PRODUCTS_TABLE=wompi-products
DYNAMO_PAYMENTS_TABLE=wompi-payments
```

**`frontend/.env`**

```env
VITE_WOMPI_PUBLIC_KEY=pub_stagtest_...
VITE_WOMPI_BASE_URL=https://api-sandbox.co.uat.wompi.dev/v1
```

### 3. Levantar backend

```bash
cd backend
npm install
npm run start:dev
```

Al iniciar, el backend inserta automáticamente los productos faltantes en la tabla `wompi-products`.

### 4. Levantar frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

## Cómo probar en local

### Probar la API

- Productos: `http://localhost:3000/api/products`
- Swagger: `http://localhost:3000/api/docs`

### Probar la aplicación

- Frontend: `http://localhost:5173`
- Selecciona un producto.
- Ingresa unidades.
- Abre el modal de tarjeta.
- Completa tarjeta, entrega y aceptación de términos.
- Confirma el pago en el resumen.

Tarjetas de prueba de Wompi Sandbox:

- Aprobada: `4242 4242 4242 4242`
- Rechazada: `4111 1111 1111 1111`

Usa cualquier fecha futura y CVV de 3 o 4 dígitos.

## Tests

**Backend**

```bash
cd backend
npm test
```

**Frontend**

```bash
cd frontend
npm test
```

## Despliegue

Este repositorio quedó preparado para dos caminos:

- **Elastic Beanstalk + CodePipeline** para backend
- **EC2 + Nginx + PM2** para frontend y backend en la misma instancia

Para EC2 existe el script:

```bash
./deploy-ec2.sh
```

que actualiza repo, compila backend y frontend, reinicia PM2 y Nginx, y publica el `dist` del frontend.

## Notas

- El backend usa `Helmet` y `ValidationPipe`.
- Los datos de tarjeta no se guardan en `localStorage` ni en DynamoDB.
- El precio se almacena como `string` en DynamoDB y el stock como `number`.
- En local y en AWS se usa **Wompi Sandbox**, no producción.
