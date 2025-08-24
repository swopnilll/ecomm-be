# ecomm-api

This is a e-commerce API built with Node.js, Express, and TypeScript. It uses MongoDB as the database and is configured to run with Docker Compose for local database.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20 or higher.
- **Docker** and **Docker Compose**: For running the MongoDB database.

---

## Getting Started

Follow these steps to set up and run the project on your local machine.

### 1. Clone the repository

```bash
git clone <repository_url>
cd ecomm-api
```

### 2.2. Install dependencies

```bash
npm install
```

### 3. Set up the environment

- Create a file named .env.development in the root of the project and add the following content:

```bash
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://admin:password@localhost:27017/ecommerce?authSource=admin
JWT_SECRET=4fe9251f3843a19d75e2496e36f4b5f096740c0343a5aef3c014e6aec87668cc
REFRESH_TOKEN_SECRET=fb406356eb0530b0a8df50304781d5f0d1d95d29de6ce731e66b6567fb54f79392ef1ebde347691e6318f32f4a92b37cf478646c72f50b5648d46d504a1b7cc2
ACCESS_TOKEN_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SuperSecret123
```

### 4. Run the database with Docker

- Start the MongoDB database container using Docker Compose.

```bash
docker compose up -d
```

### 5. Run The App

```bash
npm run dev
```

### 6. Runs the database seeders

```bash
npm run seed:dev
```

## Project Documentation

- **Database Design**: [Database Design notes](notes/dbDesign/initial-idea.md)
- **API Design**: [API Design notes](notes/apiDesign/notes.md)
