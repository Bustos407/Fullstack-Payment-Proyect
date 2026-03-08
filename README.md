# FullStack Payment Checkout

Single Page Application that simulates a small store where a user can pick a product, enter card and delivery data and pay using the **Wompi Sandbox API**.  
The frontend is a React SPA, the backend is a NestJS API, and data is stored in **AWS DynamoDB**.

## Tech stack

- **Frontend**: React 18, TypeScript, Vite, Redux Toolkit
- **Backend**: NestJS, TypeScript
- **Database**: AWS DynamoDB

## Project layout

```text
├── backend/          # NestJS REST API
├── frontend/        # React SPA + Redux
└── README.md
```

## Domain model

```text
products (DynamoDB table)
├── id (PK, Number)
├── name
├── description
├── price (String)
└── stock (Number)

payments (DynamoDB table)
├── id (PK, String UUID)
├── productId
├── units
├── totalAmount
├── status (PENDING | APPROVED | REJECTED)
├── customerName
├── customerEmail
├── deliveryAddress
├── wompiTransactionId (nullable)
└── createdAt
```

## API

Base URL (local): `http://localhost:3000/api`

| Method | Route              | Description                                                |
|--------|--------------------|------------------------------------------------------------|
| GET    | `/products`        | Returns products with available stock                     |
| POST   | `/payments`        | Creates a payment using Wompi Sandbox (card + tokens)     |
| GET    | `/payments/:id`    | Returns a payment by its UUID                             |

### Docs

- **Swagger UI**: `http://localhost:3000/api/docs`
- **Postman collection**: [`postman_collection.json`](./postman_collection.json)

## Running the project locally

### 1. Create DynamoDB tables (AWS)

Create two tables in your AWS account (Console or CLI):

**Products table** (`wompi-products` by default):

```bash
aws dynamodb create-table \
  --table-name wompi-products \
  --attribute-definitions AttributeName=id,AttributeType=N \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

**Payments table** (`wompi-payments` by default):

```bash
aws dynamodb create-table \
  --table-name wompi-payments \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

Ensure your AWS credentials are configured (`aws configure` or environment variables `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).

### 2. Backend (NestJS)

```bash
cd backend
npm install
cp .env.example .env   # if needed, adjust variables
npm run start:dev
```

The API will be available at `http://localhost:3000/api`.

**Backend environment variables** (`backend/.env`):

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

On first run, the backend seeds the products table with two default products if it is empty.

### 3. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

The SPA will be available at `http://localhost:5173`.

## Application flow (frontend)

1. **Products**  
   The user sees the list of products with price and stock and chooses one and the number of units.

2. **Card and delivery modal**  
   A modal asks for:
   - Cardholder name  
   - Card number (with brand detection and basic formatting)  
   - Expiration and CVV (with a small "Show/Hide" toggle for CVV while testing)  
   - Delivery name, email and address  
   - Wompi terms and personal–data authorizations (using the Sandbox merchant endpoints)

3. **Payment summary (backdrop)**  
   A backdrop overlays the page and shows:
   - Product amount  
   - Base fee  
   - Delivery fee  
   - Total amount  
   The user can go **back to details** or click **Payment**.

4. **Payment processing**  
   - Frontend tokenizes the card with Wompi (`/tokens/cards`).  
   - Backend creates a local `Payment` in `PENDING` in DynamoDB.  
   - Backend calls Wompi to create the transaction and polls until a final status.  
   - If approved, stock is reserved; in any failure the payment is marked as `REJECTED`.

5. **Result screen**  
   The user sees whether the payment was **approved** or **rejected**, the total amount and the transaction ID.  
   From there they can go back to the products screen (the list is reloaded so stock is up to date).

The checkout state is stored in Redux and a safe subset is persisted in `localStorage` (card data is **never** persisted).

## Sandbox configuration (Wompi)

This project only calls the **Wompi Sandbox API**: `https://api-sandbox.co.uat.wompi.dev/v1`.

Default Sandbox keys from the challenge are wired through `.env` files and can be replaced if needed.

**Frontend** (`frontend/.env`):

```env
VITE_WOMPI_PUBLIC_KEY=pub_stagtest_...
VITE_WOMPI_BASE_URL=https://api-sandbox.co.uat.wompi.dev/v1
```

Test card examples (Sandbox):

- Approved: `4242 4242 4242 4242`
- Declined: `4111 1111 1111 1111`

Use any future expiration date and a 3–4 digit CVV.

## Deploying to AWS (for reviewers / technical test)

So that evaluators can open a URL and test the app, deploy **backend** and **frontend** in the same AWS account (DynamoDB and tables already created).

### 1. Backend (Elastic Beanstalk)

1. In AWS Console go to **Elastic Beanstalk → Create application**.
2. **Platform**: Node.js; **Application code**: Upload your code (zip the `backend` folder after `npm install` and `npm run build`, or use a pipeline).
3. In the environment, go to **Configuration → Software → Environment properties** and add:
   - `WOMPI_PRIVATE_KEY` = (tu clave privada Wompi Sandbox)
   - `WOMPI_INTEGRITY_SECRET` = (tu integrity secret)
   - `WOMPI_BASE_URL` = `https://api-sandbox.co.uat.wompi.dev/v1`
   - `DYNAMODB_REGION` = `us-east-2`
   - `DYNAMO_PRODUCTS_TABLE` = `wompi-products`
   - `DYNAMO_PAYMENTS_TABLE` = `wompi-payments`
4. **Configuration → Security**: set the **IAM instance profile** to a role that has DynamoDB access. Create a role with this policy (replace region/account if needed):

```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:UpdateItem",
    "dynamodb:Scan",
    "dynamodb:Query",
    "dynamodb:BatchGetItem"
  ],
  "Resource": [
    "arn:aws:dynamodb:us-east-2:*:table/wompi-products",
    "arn:aws:dynamodb:us-east-2:*:table/wompi-payments"
  ]
}
```

5. Deploy and note the environment URL, e.g. `https://wompi-api.us-east-2.elasticbeanstalk.com`. The API base for the frontend is that URL **without** `/api` (e.g. `https://wompi-api.us-east-2.elasticbeanstalk.com`), because the app will call `/api/products` and `/api/payments` relative to that base.

### 2. Frontend (S3 + static hosting)

1. Build the frontend **pointing to your backend URL**:
   ```bash
   cd frontend
   npm install
   # Replace with your real Elastic Beanstalk URL (no trailing slash):
   set VITE_API_URL=https://TU-ENVIRONMENT.us-east-2.elasticbeanstalk.com
   npm run build
   ```
   (On Linux/Mac use `export VITE_API_URL=...`.)

2. Create an **S3 bucket** (e.g. `wompi-checkout-front`), enable **Static website hosting** (index: `index.html`, error: `index.html` for SPA).
3. Upload the contents of `frontend/dist` to the bucket (all files in the root of the bucket).
4. Set the bucket policy so the contents are public (for static hosting), or use **CloudFront** in front of S3 and use the CloudFront URL.
5. The URL to share with reviewers is either:
   - **S3 website URL**: `http://bucket-name.s3-website.region.amazonaws.com`, or  
   - **CloudFront URL**: `https://xxxxx.cloudfront.net` if you added a distribution.

### 3. What to send to evaluators

- **Frontend URL**: the S3 website URL or CloudFront URL (so they open the app in the browser).
- **Backend API (optional)**: the Elastic Beanstalk URL + `/api/docs` for Swagger, e.g. `https://wompi-api.us-east-2.elasticbeanstalk.com/api/docs`.
- **Test cards (Sandbox)**: Approved `4242 4242 4242 4242`, Declined `4111 1111 1111 1111`; any future expiry and 3–4 digit CVV.

## Testing

### Backend

```bash
cd backend
npm test        # unit tests
npm run test:cov
```

Main areas covered:

- Product domain (`ProductDomain`) and stock rules  
- Product service (`ProductsService`): find, reserve stock, seeding  
- Payment service (`PaymentsService`): creating payments, Wompi calls, status updates  
- Controllers for products and payments

### Frontend

```bash
cd frontend
npm test        # unit tests
npm run test:cov
```

Main areas covered:

- Redux slice (`checkoutSlice`), including persistence rules (no card data in `localStorage`).  
- Main page (`ProductPage`): product loading, unit changes, button behaviour.  
- App shell (`App`): basic rendering and wiring.

## Architecture (short version)

- **Backend**
  - Inspired by hexagonal / ports and adapters:
    - **Domain**: pure entities and business rules (stock reservation, payment status).
    - **Application**: services and DTOs; payment flow orchestrates Wompi and stock updates.
    - **Infrastructure**: DynamoDB repositories, Wompi HTTP client implementation.
    - **Presentation**: NestJS controllers exposing a small REST API.
  - Global validation with `ValidationPipe` and JSON logging for HTTP requests.

- **Frontend**
  - React SPA with Redux Toolkit following a simple Flux‑like data flow.
  - Mobile‑first layout using CSS flexbox, with a single-page experience and modals/backdrops instead of routes.

## Security notes

- Backend uses **Helmet** to add common security headers.  
- `ValidationPipe` with `whitelist` and `forbidNonWhitelisted` protects DTOs from unexpected fields.  
- Card data is kept only in memory on the frontend and never written to `localStorage` or the database.  
- In production, the recommendation is to put both the API and the SPA behind HTTPS (e.g. CloudFront / ALB + API Gateway or similar).

## Useful links

- Wompi docs – quick start: https://docs.wompi.co/docs/colombia/inicio-rapido/  
- Wompi docs – environments and keys: https://docs.wompi.co/docs/colombia/ambientes-y-llaves/  
- AWS DynamoDB: https://docs.aws.amazon.com/dynamodb/  
- Flexbox reference: https://css-tricks.com/snippets/css/a-guide-to-flexbox/
