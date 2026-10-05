# Smart Business System

> **A full-stack business management platform with AI-powered business assistance and analytics.**

Smart Business System is a centralized business management platform designed to help businesses manage their daily operations, including **products, inventory, sales, POS, purchases, customers, suppliers, expenses, payments, reports, users, roles, branches, and AI-powered business insights**.

---

## Overview

The system combines three main technologies:

```text
┌──────────────────────┐
│   React Frontend     │
│   User Interface     │
└──────────┬───────────┘
           │
           │ REST API
           ▼
┌──────────────────────┐
│   Laravel Backend    │
│   Business Logic     │
└──────────┬───────────┘
           │
           │ AI API
           ▼
┌──────────────────────┐
│   Python FastAPI     │
│   AI & Analytics     │
└──────────────────────┘
```

---

## Key Features

| Module                    | Features                                             |
| ------------------------- | ---------------------------------------------------- |
| Authentication            | Login, logout, password management, protected access |
| Users                     | User management and user preferences                 |
| Role-Based Access Control | Roles, permissions, access control                   |
| Business                  | Business and branch management                       |
| Dashboard                 | KPIs, statistics, business overview                  |
| Products                  | Products, categories, brands                         |
| Inventory                 | Stock management and inventory movements             |
| POS                       | Cart, checkout, sales and payments                   |
| Sales                     | Sales transactions and history                       |
| Orders                    | Order management and tracking                        |
| Purchases                 | Purchases and purchase items                         |
| Suppliers                 | Supplier management                                  |
| Customers                 | Customer management                                  |
| Expenses                  | Business expense management                          |
| Payments                  | Payment records and tracking                         |
| Reports                   | Business reports and analytics                       |
| AI Assistant              | AI chat and business assistance                      |
| AI Insights               | AI-powered business insights                         |
| Currency                  | Currency and exchange-rate management                |
| Languages                 | Khmer and English                                    |
| Settings                  | System and user preferences                          |
| UI Customization          | Themes and dashboard customization                   |
| Data Tools                | Search, filter, sort and pagination                  |
| Logging                   | Activity and request logging                         |
| Notifications             | Notification support                                 |
| Testing                   | Backend and AI automated tests                       |

---

# System Architecture

```text
                         SMART BUSINESS SYSTEM
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
      │   React     │      │   Laravel   │      │   Python    │
      │  Frontend   │─────▶│   Backend   │─────▶│   FastAPI   │
      └─────────────┘      └──────┬──────┘      └──────┬──────┘
                                  │                    │
                                  ▼                    ▼
                           ┌─────────────┐      ┌─────────────┐
                           │  Database   │      │ AI Provider │
                           └─────────────┘      └─────────────┘
```

## Request Flow

```text
User
 │
 ▼
React Frontend
 │
 ▼
Laravel REST API
 │
 ├── Authentication
 ├── Business Logic
 ├── Products
 ├── Inventory
 ├── Sales / POS
 ├── Purchases
 ├── Customers
 ├── Suppliers
 ├── Expenses
 └── Reports
 │
 └──────────────▶ Python AI Service
                         │
                         ├── Analytics
                         ├── Statistics
                         └── AI Provider
```

---

# AI Architecture

The AI functionality is separated into a dedicated Python FastAPI service.

```text
┌──────────────────────┐
│    React Frontend    │
│                      │
│  AI Assistant        │
│  AI Insights         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   Laravel Backend    │
│                      │
│  AiController        │
│  AiService           │
│  AiInsightsAdapter   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   Python FastAPI     │
│                      │
│  AI Router           │
│  Analytics           │
│  Statistics          │
│  AI Provider         │
└──────────────────────┘
```

## AI Capabilities

* AI Business Assistant
* Business Analytics
* AI Business Insights
* Statistical Analysis
* AI Provider Integration
* Business Performance Insights

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

## AI

| Technology | Purpose                |
| ---------- | ---------------------- |
| Python     | AI service             |
| FastAPI    | AI REST API            |
| Analytics  | Business analysis      |
| Statistics | Statistical processing |
| Pytest     | AI service testing     |

## Database

* Relational database
* Laravel migrations
* Eloquent ORM
* Database seeders

---

# Project Structure

```text
Smart_Business_System/
│
├── ai/
│   ├── app/
│   │   ├── routers/
│   │   │   └── ai.py
│   │   ├── schemas/
│   │   │   ├── common.py
│   │   │   └── requests.py
│   │   ├── services/
│   │   │   ├── analytics.py
│   │   │   └── provider.py
│   │   ├── utils/
│   │   │   └── stats.py
│   │   ├── config.py
│   │   └── main.py
│   │
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_api.py
│   │
│   └── requirements.txt
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
│   ├── config/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   ├── tests/
│   ├── artisan
│   ├── composer.json
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
├── docs/
│   └── SMART_BUSINESS_SYSTEM_FEATURES.md
│
├── .env.example
├── .gitignore
└── README.md
```

---

# Installation

## Prerequisites

Make sure you have installed:

* PHP
* Composer
* Node.js
* npm
* Python
* Database Server
* Git

---

## 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Smart_Business_System
```

---

## 2. Backend Setup

```bash
cd backend
```

Install dependencies:

```bash
composer install
```

Create environment file:

```bash
cp .env.example .env
```

Generate application key:

```bash
php artisan key:generate
```

Configure your database inside `.env`.

Run migrations:

```bash
php artisan migrate
```

Seed demo data:

```bash
php artisan db:seed
```

Start Laravel:

```bash
php artisan serve
```

Backend:

```text
http://127.0.0.1:8000
```

---

## 3. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start Vite:

```bash
npm run dev
```

Frontend:

```text
http://127.0.0.1:5173
```

---

## 4. AI Service Setup

Open another terminal:

```bash
cd ai
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

AI Service:

```text
http://127.0.0.1:8001
```

---

# Run All Services

The system requires three services:

## Terminal 1 — Laravel

```bash
cd backend
php artisan serve
```

## Terminal 2 — React

```bash
cd frontend
npm run dev
```

## Terminal 3 — Python AI

```bash
cd ai
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

## Complete Flow

```text
                    ┌─────────────────┐
                    │  React Frontend │
                    │   :5173         │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Laravel Backend │
                    │   :8000         │
                    └───────┬─────────┘
                            │
                            ▼
                    ┌─────────────────┐
                    │  Python FastAPI │
                    │   :8001         │
                    └─────────────────┘
```

---

# Testing

## Laravel

```bash
cd backend
php artisan test
```

Or:

```bash
vendor/bin/phpunit
```

## Python AI

```bash
cd ai
pytest
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

# Documentation

Detailed project feature documentation is available in:

```text
docs/SMART_BUSINESS_SYSTEM_FEATURES.md
```

The documentation covers:

* System features
* Business modules
* AI features
* Authentication
* Role-Based Access Control
* POS
* Inventory
* Reports
* System settings
* Testing

---

# Project Goals

The Smart Business System aims to:

* Centralize business operations
* Simplify business management
* Manage products and inventory
* Manage sales and purchases
* Manage customers and suppliers
* Track expenses and payments
* Generate business reports
* Control users and permissions
* Support multiple branches
* Support multiple currencies
* Support Khmer and English
* Provide AI business assistance
* Provide AI-powered business insights

---

# Project Highlights

```text
┌────────────────────────────────────────────┐
│           SMART BUSINESS SYSTEM             │
├────────────────────────────────────────────┤
│                                            │
│  Sales and POS                             │
│  Inventory                                 │
│  Purchases                                 │
│  Customers and Suppliers                   │
│  Expenses and Payments                     │
│  Reports and Dashboard                     │
│  Authentication and RBAC                   │
│  Business and Branches                     │
│  Multi-Currency                            │
│  Khmer and English                         │
│  AI Assistant                              │
│  AI Business Insights                     │
│                                            │
└────────────────────────────────────────────┘
```

---

# License

This project is developed for educational and project purposes.

---

# Project Information

**Project Name:** Smart Business System

**Type:** Full-Stack Business Management System

**Architecture:** React + Laravel + Python FastAPI + Database

**AI:** AI Assistant + Business Analytics + AI Insights
