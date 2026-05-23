# ElectroHub Backend API

Node.js + Express + MongoDB REST API for the ElectroHub e-commerce platform.

---


## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env
# Then open .env and fill in your values (see Environment Variables below)

# 3. Start the server
node app.js

# Development (auto-restart on save)
npx nodemon app.js
```

Server runs at `http://localhost:5000` by default.

---

## Environment Variables

Create a `.env` file in the backend root:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB — local
MONGO_URI=mongodb://127.0.0.1:27017/electrohub
# MongoDB — Atlas (production)
# MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/electrohub

# JWT — generate a strong secret with:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=replace_this_with_a_long_random_secret

# Stripe — leave blank to run in mock mode
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
BASE_URL=http://localhost:5000

# Email / SMTP — leave blank to skip sending reset emails
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
```

---

## Project Structure

```
backend/
├── app.js                        # Express app entry point
├── db.js                         # MongoDB connection
├── bootstrap.js                  # Seeds products + default accounts
├── package.json
│
├── routes/
│   ├── auth.js                   # /api/auth
│   ├── products.js               # /api/products
│   ├── cart.js                   # /api/cart
│   ├── orders.js                 # /api/orders
│   ├── checkout.js               # /api/checkout
│   └── admin.js                  # /api/admin
│
├── controllers/
│   ├── authController.js
│   ├── productController.js
│   ├── cartController.js
│   ├── orderController.js
│   ├── checkoutController.js
│   └── adminController.js
│
├── models/
│   ├── User.js
│   ├── Product.js
│   ├── Cart.js
│   ├── Order.js
│   └── PendingCheckout.js
│
├── middlewares/
│   ├── authMiddleware.js         # JWT authentication + admin guard
│   ├── errorHandler.js           # 404 + global error handler
│   └── rateLimiter.js            # Per-route rate limiting
│
└── utils/
    └── cartValidation.js         # Server-side price/cart verification
```

---

## Default Seeded Accounts

Created automatically on first run via `bootstrap.js`:

| Role  | Email                | Password  |
|-------|----------------------|-----------|
| Admin | admin@electrohub.com | admin123  |
| User  | demo@electrohub.com  | demo123   |

> **Change these credentials immediately in any production environment.**

---

## Authentication

All protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are returned from `/api/auth/login` and `/api/auth/register`. They expire after **24 hours**.

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint                  | Auth     | Body / Params                                      | Description                        |
|--------|---------------------------|----------|----------------------------------------------------|------------------------------------|
| POST   | `/register`               | —        | `name`, `email`, `password`                        | Register a new user, returns JWT   |
| POST   | `/login`                  | —        | `email`, `password`                                | Login, returns JWT + user info     |
| GET    | `/me`                     | JWT      | —                                                  | Get current user profile           |
| POST   | `/forgot-password`        | —        | `email`                                            | Send password reset email          |
| POST   | `/reset-password`         | —        | `token`, `newPassword`                             | Reset password using token         |
| PUT    | `/change-password`        | JWT      | `currentPassword`, `newPassword`                   | Change password while logged in    |

---

### Products — `/api/products`

| Method | Endpoint   | Auth | Query Params                              | Description                          |
|--------|------------|------|-------------------------------------------|--------------------------------------|
| GET    | `/`        | —    | `q`, `category`, `minPrice`, `maxPrice`   | List products with search & filters  |
| GET    | `/:id`     | —    | —                                         | Get single product by MongoDB `_id`  |

**Query parameter examples:**
```
GET /api/products?q=macbook
GET /api/products?category=Laptops&minPrice=500&maxPrice=2000
GET /api/products?category=Audio
```

---

### Cart — `/api/cart`

All cart routes require a JWT token.

| Method | Endpoint          | Auth | Body                          | Description                        |
|--------|-------------------|------|-------------------------------|------------------------------------|
| GET    | `/`               | JWT  | —                             | Get current user's cart            |
| POST   | `/`               | JWT  | `productId`, `quantity`       | Add item to cart (max qty 10)      |
| PUT    | `/:productId`     | JWT  | `quantity`                    | Update item quantity               |
| DELETE | `/:productId`     | JWT  | —                             | Remove a specific item from cart   |
| DELETE | `/`               | JWT  | —                             | Clear entire cart                  |

---

### Orders — `/api/orders`

All order routes require a JWT token.

| Method | Endpoint       | Auth | Body / Params        | Description                                      |
|--------|----------------|------|----------------------|--------------------------------------------------|
| POST   | `/`            | JWT  | `shippingAddress`    | Place order from current cart (cart is cleared)  |
| GET    | `/`            | JWT  | —                    | Get all orders for the logged-in user            |
| DELETE | `/:orderId`    | JWT  | —                    | Cancel an order (only if Pending or Paid)        |

**Order status lifecycle:**
```
Pending → Paid → Completed
                         ↘ Cancelled (only from Pending or Paid)
```
Cancellation is blocked if status is `Shipped`, `Delivered`, or already `Cancelled`.

---

### Checkout — `/api/checkout`

| Method | Endpoint             | Auth | Body                  | Description                                      |
|--------|----------------------|------|-----------------------|--------------------------------------------------|
| GET    | `/config`            | —    | —                     | Returns Stripe mode and publishable key          |
| POST   | `/create-session`    | JWT  | `orderId`             | Create a Stripe Checkout session for an order    |
| POST   | `/complete-session`  | JWT  | `sessionId`           | Confirm payment and mark order as Paid           |
| GET    | `/success`           | —    | —                     | Stripe redirect on successful payment            |
| GET    | `/failed`            | —    | —                     | Stripe redirect on cancelled payment             |

**Checkout flow:**
```
1. POST /api/orders           → creates order with status "Pending"
2. POST /api/checkout/create-session  → creates Stripe session, returns { url, sessionId }
3. Redirect user to Stripe URL
4. Stripe redirects to /checkout-success or /checkout-failed
5. POST /api/checkout/complete-session → confirms payment, order becomes "Paid"
```

**Mock mode** (no Stripe keys): the app runs without Stripe. Skip steps 2–5 and orders can be manually marked Paid via the admin panel.

---

### Admin — `/api/admin`

All admin routes require a JWT token **and** `isAdmin: true` on the user account.

#### Products

| Method | Endpoint          | Body                                               | Description              |
|--------|-------------------|----------------------------------------------------|--------------------------|
| POST   | `/products`       | `title`, `category`, `price`, `img`, `description`, `specs?` | Create a product |
| PUT    | `/products/:id`   | Any product fields (all optional)                  | Update a product         |
| DELETE | `/products/:id`   | —                                                  | Delete a product         |

#### Orders

| Method | Endpoint               | Body       | Description                  |
|--------|------------------------|------------|------------------------------|
| GET    | `/orders`              | —          | Get all orders (all users)   |
| PUT    | `/orders/:id/status`   | `status`   | Update order status          |

Valid status values for admin update: `Pending`, `Paid`, `Completed`

#### Users

| Method | Endpoint       | Description           |
|--------|----------------|-----------------------|
| GET    | `/users`       | Get all users         |
| DELETE | `/users/:id`   | Delete a user         |

---

## Rate Limiting

| Route group      | Limit                     |
|------------------|---------------------------|
| `/api/auth/*`    | 20 requests / 15 minutes  |
| All other `/api` | 100 requests / 15 minutes |

Exceeding the limit returns:
```json
{ "error": "Too many requests from this IP, please try again after 15 minutes." }
```

---

## Security

- **Helmet** — sets secure HTTP headers
- **bcryptjs** — passwords hashed with salt rounds of 10, never stored as plaintext
- **JWT** — stateless auth, tokens expire in 24h
- **express-validator** — all inputs validated and sanitized before hitting the database
- **Mongoose ORM** — parameterized queries prevent NoSQL injection
- **Server-side pricing** — order totals are always calculated from the database, never trusted from the client
- **Rate limiting** — brute-force protection on auth and all API routes

---

## Error Response Format

All errors return JSON in this shape:

```json
{ "error": "Human-readable message here" }
```

Validation errors return:

```json
{
  "errors": [
    { "field": "email", "message": "Please enter a valid email" }
  ]
}
```

Unknown API routes return `404`:
```json
{ "error": "API route not found" }
```
