# E-Commerce Modular Monolith

A full-stack e-commerce application built with **NestJS** (backend) and **Next.js 14** (frontend), organized as an **Nx** monorepo. Asynchronous communication between modules is driven by **RabbitMQ** events.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS 10, TypeORM, PostgreSQL 16 |
| Messaging | RabbitMQ 3.13 (`@golevelup/nestjs-rabbitmq`) |
| Frontend | Next.js 14 App Router, TailwindCSS, Zustand |
| Monorepo | Nx 19 |
| Infrastructure | Docker Compose |

---

## Architecture

```
ecommerce-modular-monolyth/
├── apps/
│   ├── backend/                   # NestJS — modular monolith
│   │   └── src/
│   │       ├── infrastructure/
│   │       │   └── rabbitmq/      # RabbitMQConnectionModule (@Global)
│   │       ├── common/            # Guards, decorators, filters
│   │       └── modules/
│   │           ├── auth/          # JWT auth, register/login
│   │           ├── users/         # User entity, RBAC
│   │           ├── catalog/       # Products + Categories
│   │           ├── orders/        # Orders, cart flow
│   │           ├── payments/      # Payment processing (simulated / Stripe)
│   │           ├── notifications/ # RabbitMQ consumers
│   │           └── reviews/       # Product reviews
│   └── frontend/                  # Next.js 14
│       ├── app/                   # App Router (pages)
│       ├── components/            # Navbar, ProductCard
│       ├── store/                 # Zustand (cart, auth)
│       └── lib/api.ts             # Axios client
└── libs/
    └── shared/types/              # RabbitMQ event contracts
```

### Modular pattern

Each module is **self-contained**: it owns its TypeORM entities, services, controllers and DTOs. *Synchronous* communication happens via service imports (e.g. `OrdersModule` imports `CatalogModule` to read stock). *Asynchronous* communication goes through RabbitMQ.

```
                        ┌─────────────────────────────────────────────────────┐
                        │              NestJS App (port 3001)                 │
                        │                                                     │
  HTTP  ──────────────► │  Auth ──► Users                                     │
                        │                                                     │
                        │  Catalog (Products + Categories)                    │
                        │       ▲                                             │
                        │  Orders ──publish──► ecommerce exchange             │
                        │       │                     │                       │
                        │  Payments ──publish──►      │                       │
                        │                             ▼                       │
                        │                    Notifications ◄──subscribe──┘   │
                        │                                                     │
                        │  Reviews                                            │
                        └─────────────────────────────────────────────────────┘
```

---

## RabbitMQ Events

Exchange: `ecommerce` (type `topic`)

| Routing key | Published by | Consumed by | Description |
|---|---|---|---|
| `user.registered` | `AuthService` | `NotificationsService` | Welcome email |
| `order.created` | `OrdersService` | `NotificationsService` | Order confirmation |
| `order.cancelled` | `OrdersService` | `NotificationsService` | Cancellation notice |
| `payment.completed` | `PaymentsService` | `NotificationsService` | Payment receipt |
| `payment.failed` | `PaymentsService` | `NotificationsService` | Payment failure alert |

---

## Backend Modules

### Auth
- `POST /api/auth/register` — Register (publishes `user.registered`)
- `POST /api/auth/login` — Login, returns `accessToken` + `refreshToken`
- `POST /api/auth/logout` — Invalidates the refresh token

### Catalog
- `GET /api/products` — List (supports `search` and `categoryId` filters)
- `GET /api/products/:id` — Product detail
- `POST /api/products` — Create *(ADMIN)*
- `PUT /api/products/:id` — Update *(ADMIN)*
- `DELETE /api/products/:id` — Archive *(ADMIN)*
- `GET /api/categories` — List categories
- `POST /api/categories` — Create category *(ADMIN)*

### Orders
- `POST /api/orders` — Place an order (decrements stock + publishes `order.created`)
- `GET /api/orders/my` — My orders
- `PATCH /api/orders/my/:id/cancel` — Cancel (restores stock + publishes `order.cancelled`)
- `GET /api/orders` — All orders *(ADMIN)*
- `PATCH /api/orders/:id/status` — Update status *(ADMIN)*

### Payments
- `POST /api/payments/initiate` — Initiate a payment for an order
- `POST /api/payments/:id/process` — Process payment (simulated, publishes `payment.completed` or `payment.failed`)

### Reviews
- `GET /api/reviews/product/:productId` — Reviews + average rating
- `POST /api/reviews` — Submit a review (one per user/product)

---

## Getting Started

### Prerequisites
- Node.js ≥ 20
- Docker Desktop

### 1. Environment variables

```bash
cp .env.example apps/backend/.env
```

`apps/backend/.env`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=ecommerce
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

JWT_SECRET=change-in-production
JWT_REFRESH_SECRET=change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

RABBITMQ_URL=amqp://admin:admin@localhost:5672

PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

`apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 2. Start infrastructure

```bash
docker-compose up -d
```

| Service | URL |
|---|---|
| PostgreSQL | `localhost:5433` |
| RabbitMQ AMQP | `localhost:5672` |
| RabbitMQ Management UI | http://localhost:15672 (admin / admin) |

### 3. Install dependencies

```bash
npm install
```

### 4. Start the backend

```bash
cd apps/backend
npx ts-node -P tsconfig.json src/main.ts
```

- API: http://localhost:3001/api
- Swagger: http://localhost:3001/api/docs

> TypeORM runs in `synchronize: true` mode in development — tables are created automatically on first start.

### 5. Start the frontend

```bash
cd apps/frontend
npx next dev
```

- Frontend: http://localhost:3000

---

## Frontend Pages

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing page |
| `/products` | Public | Catalog with search and category filter |
| `/products/:id` | Public | Product detail + reviews |
| `/login` | Public | Sign in |
| `/register` | Public | Sign up |
| `/cart` | Public | Cart (Zustand, persisted in localStorage) |
| `/checkout` | Authenticated | Order placement + payment |
| `/orders` | Authenticated | Order history |
| `/admin/products` | ADMIN | Product management |
| `/admin/orders` | ADMIN | Order management |

---

## Data Model

```
User (1) ──────────── (N) Order (1) ──── (N) OrderItem (N) ──── (1) Product
                                                                      │
Category (1) ──── (N) Product                                         │
                                                                      │
User (1) ──────────────────────────────────────────── (N) Review ────(1) Product

Payment ──── orderId (reference)
```

### Order statuses

`PENDING` → `CONFIRMED` → `PAID` → `SHIPPED` → `DELIVERED`  
*(cancellation allowed from `PENDING` or `CONFIRMED`)*

---

## Security

- **JWT**: 15-minute access token, 7-day refresh token (hashed in DB)
- **RBAC**: `USER` and `ADMIN` roles enforced via `@Roles()` guard
- **Public routes**: `@Public()` decorator bypasses the global JWT guard
- **Validation**: `class-validator` on all DTOs with `whitelist: true`
- **Passwords**: hashed with `bcryptjs` (10 salt rounds)

---

## Production Checklist

### Stripe integration

Replace the simulation in `payments.service.ts`:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const intent = await stripe.paymentIntents.create({
  amount: Math.round(payment.amount * 100),
  currency: 'eur',
});
payment.stripePaymentIntentId = intent.id;
```

### Email notifications

Wire a mail provider in each `@RabbitSubscribe` handler in `notifications.service.ts`:

```typescript
// nodemailer, SendGrid, AWS SES, Resend...
await this.mailerService.sendMail({
  to: user.email,
  subject: 'Order confirmation',
  template: 'order-confirmation',
  context: { orderId, totalAmount },
});
```

### Environment

- Set `NODE_ENV=production` to disable TypeORM `synchronize` (use migrations instead)
- Use strong, randomly generated values for `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Restrict `FRONTEND_URL` CORS to your actual domain
