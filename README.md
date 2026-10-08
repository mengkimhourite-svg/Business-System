# Smart Business System

> **A full-stack business management platform for sales, inventory, POS, purchases, customers, suppliers, payments, reporting, and business operations.**

Smart Business System is a centralized business management platform designed to help businesses manage daily operations, including **products, inventory, sales, POS, purchases, customers, suppliers, expenses, payments, reports, users, roles, permissions, branches, and business settings**.

---

## Overview

The system uses a modern full-stack architecture:

```text
┌──────────────────────┐
│    React Frontend    │
│    User Interface    │
└──────────┬───────────┘
           │
           │ REST API
           ▼
┌──────────────────────┐
│    Laravel Backend   │
│    Business Logic    │
└──────────┬───────────┘
           │
           │ Database
           ▼
┌──────────────────────┐
│     PostgreSQL       │
│     Data Storage     │
└──────────────────────┘
```

---

## Key Features

| Module                    | Features                                                  |
| ------------------------- | --------------------------------------------------------- |
| Authentication            | Login, logout, password management, protected access      |
| Users                     | User management and user preferences                      |
| Role-Based Access Control | Roles, permissions, and access control                    |
| Business                  | Business and branch management                            |
| Dashboard                 | KPIs, statistics, and business overview                   |
| Products                  | Products, categories, and brands                          |
| Inventory                 | Stock management and inventory movements                  |
| POS                       | Cart, checkout, sales, and payments                       |
| Sales                     | Sales transactions and history                            |
| Orders                    | Order management and tracking                             |
| Purchases                 | Purchases and purchase items                              |
| Suppliers                 | Supplier management                                       |
| Customers                 | Customer management                                       |
| Expenses                  | Business expense management                               |
| Payments                  | Payment records and tracking                              |
| KHQR Payments             | Payment creation, receipt upload, approval, and rejection |
| Reports                   | Business reports and analytics                            |
| Currency                  | Currency and exchange-rate management                     |
| Languages                 | Khmer and English                                         |
| Settings                  | System and user preferences                               |
| UI Customization          | Themes and dashboard customization                        |
| Data Tools                | Search, filtering, sorting, and pagination                |
| Logging                   | Activity and request logging                              |
| Notifications             | Notification support                                      |
| Testing                   | Backend automated tests                                   |

---

# System Architecture

```text
                       SMART BUSINESS SYSTEM
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
             ┌─────────────┐        ┌─────────────┐
             │    React    │        │   Laravel   │
             │  Frontend   │───────▶│   Backend   │
             └─────────────┘        └──────┬──────┘
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │ PostgreSQL  │
                                    │  Database   │
                                    └─────────────┘
```

## Request Flow

```text
User
 │
 ▼
React Frontend
 │
 │ REST API Request
 ▼
Laravel Backend
 │
 ├── Authentication
 ├── Authorization
 ├── Business Logic
 ├── Validation
 ├── Products
 ├── Inventory
 ├── Sales / POS
 ├── Orders
 ├── Purchases
 ├── Customers
 ├── Suppliers
 ├── Expenses
 ├── Payments
 └── Reports
 │
 ▼
PostgreSQL Database
 │
 ▼
Laravel JSON Response
 │
 ▼
React Frontend
 │
 ▼
User
```

---

# Backend API

The Laravel backend provides REST API endpoints under:

```text
/api/v1
```

## API Documentation

```text
http://localhost:8000/docs/api
```

## Health Check

```text
http://localhost:8000/api/v1/health
```

The backend provides APIs for:

* Authentication
* Dashboard
* Products
* Categories
* Brands
* Inventory
* Orders
* POS
* Purchases
* Customers
* Suppliers
* Expenses
* Payments
* KHQR payments
* Users
* Roles
* Permissions
* Settings
* Reports
* Notifications
* Search

---

# Authentication Flow

```text
User
 │
 ▼
Login Form
 │
 ▼
React Frontend
 │
 │ POST /api/v1/auth/login
 ▼
Laravel Backend
 │
 ├── Validate credentials
 ├── Find user
 ├── Verify password
 └── Generate authentication token
 │
 ▼
PostgreSQL
 │
 ▼
Laravel Response
 │
 ├── User
 └── Token
 │
 ▼
React Frontend
```

---

# POS Flow

```text
Select Product
       │
       ▼
   Add to Cart
       │
       ▼
 Calculate Total
       │
       ▼
    Checkout
       │
       ▼
 Record Payment
       │
       ▼
   Create Sale
       │
       ▼
Update Inventory
```

---

# Purchase Flow

```text
Supplier
   │
   ▼
Create Purchase
   │
   ▼
Add Purchase Items
   │
   ▼
Confirm Purchase
   │
   ▼
Update Inventory
```

---

# Technology Stack

## Frontend

| Technology       | Purpose                    |
| ---------------- | -------------------------- |
| React.js         | User interface             |
| JavaScript / JSX | Frontend development       |
| Vite             | Development and build tool |
| CSS              | UI styling                 |
| React Context    | Application state          |
| REST API         | Backend communication      |

## Backend

| Technology      | Purpose              |
| --------------- | -------------------- |
| PHP             | Backend language     |
| Laravel         | Backend framework    |
| Laravel Sanctum | API authentication   |
| Eloquent ORM    | Database interaction |
| PHPUnit         | Backend testing      |
| Scramble        | API documentation    |

## Database

| Technology         | Purpose                            |
| ------------------ | ---------------------------------- |
| PostgreSQL         | Relational database                |
| Laravel Migrations | Database schema management         |
| Eloquent ORM       | Database queries and relationships |
| Database Seeders   | Initial and demo data              |

## Development Environment

| Technology     | Purpose                        |
| -------------- | ------------------------------ |
| Docker         | Containerized development      |
| Docker Compose | Multi-container orchestration  |
| Laravel Sail   | Laravel Docker environment     |
| Composer       | PHP dependency management      |
| npm            | Frontend dependency management |

---

# Project Structure

```text
Business-System/
│
├── backend/
│   ├── app/
│   │   ├── Console/
│   │   ├── Exceptions/
│   │   ├── Http/
│   │   ├── Models/
│   │   ├── Providers/
│   │   ├── Services/
│   │   └── Support/
│   │
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   │
│   ├── routes/
│   ├── storage/
│   ├── tests/
│   ├── artisan
│   ├── composer.json
│   ├── compose.yaml
│   └── phpunit.xml
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── config/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── i18n/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
│
├── image/
├── .gitignore
└── README.md
```

---

# Installation

## Prerequisites

Make sure the following software is installed:

* Git
* Docker Desktop
* Node.js
* npm

For manual backend development, you may also use:

* PHP
* Composer

---

# 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Business-System
```

---

# 2. Backend Environment

Go to the backend directory:

```bash
cd backend
```

Install PHP dependencies if needed:

```bash
composer install
```

Create the environment file:

```bash
cp .env.example .env
```

Generate the Laravel application key:

```bash
php artisan key:generate
```

Configure PostgreSQL in `.env`:

```env
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=sbs
DB_USERNAME=sail
DB_PASSWORD=password

FORWARD_DB_PORT=5433
```

> Inside the Docker network, Laravel connects to PostgreSQL using `postgres:5432`. From the host machine, PostgreSQL is exposed through `localhost:5433`.

---

# 3. Run Backend with Docker

Start the Smart Business Docker environment:

```bash
docker compose -p smart-business up -d
```

Check the containers:

```bash
docker compose -p smart-business ps
```

The backend runs at:

```text
http://localhost:8000
```

The PostgreSQL database is available inside Docker at:

```text
postgres:5432
```

PostgreSQL can be accessed from the host at:

```text
localhost:5433
```

---

# 4. Database Setup

Run migrations inside the Laravel container:

```bash
docker compose -p smart-business exec laravel.test php artisan migrate
```

Seed permissions:

```bash
docker compose -p smart-business exec laravel.test php artisan db:seed --class=PermissionSeeder
```

Seed business data:

```bash
docker compose -p smart-business exec laravel.test php artisan db:seed --class=BusinessSeeder
```

---

# 5. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create the frontend environment file:

```bash
cp .env.example .env
```

Configure the Laravel API:

```env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:8000/api/v1
```

Start the frontend:

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

---

# Run the System

## Step 1 - Start Docker Desktop

Start Docker Desktop and make sure the Docker Engine is running.

## Step 2 - Start Backend and PostgreSQL

From the backend directory:

```bash
docker compose -p smart-business up -d
```

Check the service status:

```bash
docker compose -p smart-business ps
```

Expected services:

```text
laravel.test
postgres
```

## Step 3 - Start Frontend

From the frontend directory:

```bash
npm run dev
```

## Application URLs

```text
Frontend:
http://localhost:5173

Backend:
http://localhost:8000

Backend Health:
http://localhost:8000/api/v1/health

API Documentation:
http://localhost:8000/docs/api

PostgreSQL Host Access:
localhost:5433
```

---

# Stop Smart Business

To stop only the Smart Business Docker services:

```bash
docker compose -p smart-business stop
```

To remove the Smart Business containers and network:

```bash
docker compose -p smart-business down
```

These commands target the `smart-business` Compose project and do not intentionally stop unrelated Docker Compose projects.

---

# Testing

## Backend Tests

Run Laravel tests inside the container:

```bash
docker compose -p smart-business exec laravel.test php artisan test
```

Check Laravel routes:

```bash
docker compose -p smart-business exec laravel.test php artisan route:list
```

Check the PHP syntax of the API routes file:

```bash
docker compose -p smart-business exec laravel.test php -l routes/api.php
```

## Health Check

Verify that the backend health endpoint is available:

```text
http://localhost:8000/api/v1/health
```

---

# Languages

The system supports:

* Khmer
* English

Language files:

```text
frontend/src/i18n/
├── en.js
└── km.js
```

---

# Project Goals

The Smart Business System aims to:

* Centralize business operations.
* Simplify business management.
* Manage products and inventory.
* Manage sales and purchases.
* Manage customers and suppliers.
* Track expenses and payments.
* Support POS operations.
* Generate business reports.
* Control users, roles, and permissions.
* Support multiple branches.
* Support multiple currencies.
* Support Khmer and English.
* Provide a scalable REST API.
* Use PostgreSQL for reliable relational data storage.
* Provide a containerized local development environment.

---

# Project Highlights

```text
┌────────────────────────────────────────────┐
│           SMART BUSINESS SYSTEM            │
├────────────────────────────────────────────┤
│                                            │
│  Sales and POS                             │
│  Products and Inventory                    │
│  Orders and Purchases                      │
│  Customers and Suppliers                   │
│  Expenses and Payments                     │
│  Bakong KHQR Payments                      │
│  Reports and Dashboard                     │
│  Authentication and RBAC                   │
│  Business and Branches                     │
│  Multi-Currency                            │
│  Khmer and English                         │
│  PostgreSQL                                │
│  Docker                                    │
│  REST API                                  │
│                                            │
└────────────────────────────────────────────┘
```

---

# License

This project is developed for educational and project purposes.

---

# Project Information

| Item                        | Details                               |
| --------------------------- | ------------------------------------- |
| **Project Name**            | Smart Business System                 |
| **Type**                    | Full-Stack Business Management System |
| **Architecture**            | React + Laravel + PostgreSQL + Docker |
| **Frontend**                | React + Vite                          |
| **Backend**                 | Laravel REST API                      |
| **Database**                | PostgreSQL                            |
| **Authentication**          | Laravel Sanctum                       |
| **API Documentation**       | Scramble                              |
| **Development Environment** | Docker Compose / Laravel Sail         |
