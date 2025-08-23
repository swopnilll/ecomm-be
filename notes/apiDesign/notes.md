# API Design

Base URL: `/api/v1/[resource]`  
Protocol: **REST** (chosen over GraphQL for simplicity)

---

## 1. Authentication & Authorization (`/api/v1/auth`)

| Method | Endpoint               | Description                  | Access    |
|--------|-------------------------|------------------------------|-----------|
| POST   | `/auth/register`        | Customer registration        | Public    |
| POST   | `/auth/login`           | All users login              | Public    |
| POST   | `/auth/logout`          | Logout                       | Customer / Employee / Admin |
| POST   | `/auth/refresh`         | Refresh JWT token            | Customer / Employee / Admin |
| POST   | `/auth/forgot-password` | Request password reset       | Public    |
| POST   | `/auth/reset-password`  | Reset password with token    | Public    |
| GET    | `/auth/me`              | Get current user info        | Customer / Employee / Admin |

---

## 2. User Management (`/api/v1/users`)

### Admin Only
| Method | Endpoint              | Description         | Access |
|--------|------------------------|---------------------|--------|
| GET    | `/users`               | List all users (with filtering) | Admin |
| GET    | `/users/:id`           | Get user by ID      | Admin |
| POST   | `/users/employees`     | Register employee   | Admin |
| PATCH  | `/users/:id/block`     | Block user          | Admin |
| PATCH  | `/users/:id/unblock`   | Unblock user        | Admin |
| DELETE | `/users/:id`           | Soft delete user    | Admin |

### Self Management
| Method | Endpoint              | Description          | Access |
|--------|------------------------|----------------------|--------|
| PATCH  | `/users/profile`       | Update own profile   | Customer / Employee / Admin |
| PATCH  | `/users/password`      | Change own password  | Customer / Employee / Admin |

---

## 3. Product Management (`/api/v1/products`)

### Public (Customers)
| Method | Endpoint                  | Description         | Access   |
|--------|----------------------------|---------------------|----------|
| GET    | `/products`                | List published products (with search, filters, pagination) | Public |
| GET    | `/products/:id`            | Get product by ID (published only) | Public |

### Employee/Admin
| Method | Endpoint                  | Description          | Access   |
|--------|----------------------------|----------------------|----------|
| GET    | `/products/all`            | List all products (including drafts) | Employee / Admin |
| POST   | `/products`                | Create product       | Employee / Admin |
| GET    | `/products/:id/full`       | Get product with all details | Employee / Admin |
| PATCH  | `/products/:id`            | Update product       | Employee / Admin |
| DELETE | `/products/:id`            | Soft delete product  | Admin |
| PATCH  | `/products/:id/publish`    | Publish product      | Employee / Admin |
| PATCH  | `/products/:id/unpublish`  | Unpublish product    | Employee / Admin |

### Image Management
| Method | Endpoint                                | Description            | Access   |
|--------|------------------------------------------|------------------------|----------|
| POST   | `/products/:id/images`                   | Upload product images  | Employee / Admin |
| DELETE | `/products/:id/images/:imageId`          | Remove image           | Employee / Admin |

---

## 4. Order Management (`/api/v1/orders`)

### Customer
| Method | Endpoint             | Description           | Access   |
|--------|-----------------------|-----------------------|----------|
| GET    | `/orders`             | Get own orders        | Customer |
| POST   | `/orders`             | Create new order      | Customer |
| GET    | `/orders/:id`         | Get own order details | Customer |

### Employee/Admin
| Method | Endpoint                       | Description           | Access   |
|--------|---------------------------------|-----------------------|----------|
| GET    | `/orders/all`                   | Get all orders (with filtering) | Employee / Admin |
| GET    | `/orders/:id/full`              | Get full order details | Employee / Admin |
| PATCH  | `/orders/:id/confirm-payment`   | Mark order as paid    | Employee / Admin |
| PATCH  | `/orders/:id/confirm-delivery`  | Mark order as delivered | Employee / Admin |
| GET    | `/orders/stats`                 | Order statistics      | Admin |

### Status Tracking
| Method | Endpoint                        | Description            | Access   |
|--------|----------------------------------|------------------------|----------|
| GET    | `/orders/:id/status-history`     | Get order status update history | Customer (own orders) / Employee / Admin |

---

## 5. Dashboard & Analytics (`/api/v1/dashboard`)

| Method | Endpoint                   | Description                  | Access   |
|--------|-----------------------------|------------------------------|----------|
| GET    | `/dashboard/overview`       | Dashboard overview           | Employee / Admin |
| GET    | `/dashboard/recent-orders`  | Recent orders                | Employee / Admin |
| GET    | `/dashboard/low-stock`      | Low stock products           | Employee / Admin |
| GET    | `/dashboard/pending-payments` | Orders pending payment confirmation | Employee / Admin |
