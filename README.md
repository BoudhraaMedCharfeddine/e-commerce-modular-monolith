# E-Commerce Modular Monolith

Application e-commerce complète en **NestJS** (backend) et **Next.js 14** (frontend), structurée en monorepo **Nx**. La communication asynchrone entre modules est pilotée par des événements **RabbitMQ**.

## Stack technique

| Couche | Technologie |
|---|---|
| Backend | NestJS 10, TypeORM, PostgreSQL 16 |
| Messagerie | RabbitMQ 3.13 (`@golevelup/nestjs-rabbitmq`) |
| Frontend | Next.js 14 App Router, TailwindCSS, Zustand |
| Monorepo | Nx 19 |
| Infrastructure | Docker Compose |

---

## Architecture

```
ecommerce-modular-monolyth/
├── apps/
│   ├── backend/                   # NestJS — monolithe modulaire
│   │   └── src/
│   │       ├── infrastructure/
│   │       │   └── rabbitmq/      # RabbitMQConnectionModule (@Global)
│   │       ├── common/            # Guards, décorateurs, filtres
│   │       └── modules/
│   │           ├── auth/          # JWT auth, register/login
│   │           ├── users/         # Entité User, RBAC
│   │           ├── catalog/       # Products + Categories
│   │           ├── orders/        # Commandes, panier
│   │           ├── payments/      # Paiement (simulé / Stripe)
│   │           ├── notifications/ # Consommateurs RabbitMQ
│   │           └── reviews/       # Avis produits
│   └── frontend/                  # Next.js 14
│       ├── app/                   # App Router (pages)
│       ├── components/            # Navbar, ProductCard
│       ├── store/                 # Zustand (cart, auth)
│       └── lib/api.ts             # Client Axios
└── libs/
    └── shared/types/              # Contrats d'événements RabbitMQ
```

### Pattern modulaire

Chaque module est **autonome** : il possède ses propres entités TypeORM, services, contrôleurs et DTOs. La communication *synchrone* se fait via import de service (ex. `OrdersModule` importe `CatalogModule` pour lire le stock). La communication *asynchrone* passe par RabbitMQ.

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

## Événements RabbitMQ

Exchange : `ecommerce` (type `topic`)

| Routing key | Publié par | Consommé par | Description |
|---|---|---|---|
| `user.registered` | `AuthService` | `NotificationsService` | Email de bienvenue |
| `order.created` | `OrdersService` | `NotificationsService` | Confirmation de commande |
| `order.cancelled` | `OrdersService` | `NotificationsService` | Notification d'annulation |
| `payment.completed` | `PaymentsService` | `NotificationsService` | Reçu de paiement |
| `payment.failed` | `PaymentsService` | `NotificationsService` | Alerte d'échec de paiement |

---

## Modules backend

### Auth
- `POST /api/auth/register` — Inscription (publie `user.registered`)
- `POST /api/auth/login` — Connexion, retourne `accessToken` + `refreshToken`
- `POST /api/auth/logout` — Invalide le refresh token

### Catalog
- `GET /api/products` — Liste (filtres `search`, `categoryId`)
- `GET /api/products/:id` — Détail
- `POST /api/products` — Créer *(ADMIN)*
- `PUT /api/products/:id` — Modifier *(ADMIN)*
- `DELETE /api/products/:id` — Archiver *(ADMIN)*
- `GET /api/categories` — Liste des catégories
- `POST /api/categories` — Créer *(ADMIN)*

### Orders
- `POST /api/orders` — Créer une commande (décrément stock + publie `order.created`)
- `GET /api/orders/my` — Mes commandes
- `PATCH /api/orders/my/:id/cancel` — Annuler (réintègre le stock + publie `order.cancelled`)
- `GET /api/orders` — Toutes les commandes *(ADMIN)*
- `PATCH /api/orders/:id/status` — Changer le statut *(ADMIN)*

### Payments
- `POST /api/payments/initiate` — Initier un paiement pour une commande
- `POST /api/payments/:id/process` — Traiter (simulé, publie `payment.completed` ou `payment.failed`)

### Reviews
- `GET /api/reviews/product/:productId` — Avis + note moyenne
- `POST /api/reviews` — Soumettre un avis (1 par utilisateur/produit)

---

## Démarrage

### Prérequis
- Node.js ≥ 20
- Docker Desktop

### 1. Variables d'environnement

```bash
cp .env.example apps/backend/.env
```

Contenu de `apps/backend/.env` :

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

Créer `apps/frontend/.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 2. Infrastructure Docker

```bash
docker-compose up -d
```

| Service | URL |
|---|---|
| PostgreSQL | `localhost:5433` |
| RabbitMQ AMQP | `localhost:5672` |
| RabbitMQ Management UI | http://localhost:15672 (admin / admin) |

### 3. Installer les dépendances

```bash
npm install
```

### 4. Lancer le backend

```bash
cd apps/backend
npx ts-node -P tsconfig.json src/main.ts
```

- API : http://localhost:3001/api
- Swagger : http://localhost:3001/api/docs

> TypeORM est en mode `synchronize: true` en développement — les tables sont créées automatiquement au premier démarrage.

### 5. Lancer le frontend

```bash
cd apps/frontend
npx next dev
```

- Frontend : http://localhost:3000

---

## Frontend — Pages

| Route | Accès | Description |
|---|---|---|
| `/` | Public | Page d'accueil |
| `/products` | Public | Catalogue avec recherche et filtre par catégorie |
| `/products/:id` | Public | Détail produit + avis |
| `/login` | Public | Connexion |
| `/register` | Public | Inscription |
| `/cart` | Public | Panier (Zustand, persisté en localStorage) |
| `/checkout` | Authentifié | Validation de commande + paiement |
| `/orders` | Authentifié | Historique des commandes |
| `/admin/products` | ADMIN | Gestion des produits |
| `/admin/orders` | ADMIN | Gestion des commandes |

---

## Modèle de données

```
User (1) ──────────── (N) Order (1) ──── (N) OrderItem (N) ──── (1) Product
                                                                      │
Category (1) ──── (N) Product                                         │
                                                                      │
User (1) ──────────────────────────────────────────── (N) Review ────(1) Product

Payment ──── orderId (référence)
```

### Statuts de commande

`PENDING` → `CONFIRMED` → `PAID` → `SHIPPED` → `DELIVERED`  
*(annulation possible depuis `PENDING` ou `CONFIRMED`)*

---

## Sécurité

- **JWT** : access token 15 min, refresh token 7 jours (haché en base)
- **RBAC** : rôles `USER` et `ADMIN` via guard `@Roles()`
- **Routes publiques** : décorateur `@Public()` bypass le guard JWT global
- **Validation** : `class-validator` sur tous les DTOs avec `whitelist: true`
- **Mots de passe** : hachés avec `bcryptjs` (salt rounds = 10)

---

## Intégration Stripe (production)

Dans `payments.service.ts`, remplacer la simulation par l'appel Stripe réel :

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const intent = await stripe.paymentIntents.create({
  amount: Math.round(payment.amount * 100),
  currency: 'eur',
});
payment.stripePaymentIntentId = intent.id;
```

---

## Notifications (production)

Dans `notifications.service.ts`, brancher un provider email dans chaque handler `@RabbitSubscribe` :

```typescript
// nodemailer, SendGrid, AWS SES, Resend...
await this.mailerService.sendMail({
  to: user.email,
  subject: 'Confirmation de commande',
  template: 'order-confirmation',
  context: { orderId, totalAmount },
});
```
