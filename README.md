# 💰 Finance Tracker – Full Stack Backend-Focused Application

A **complete finance management system** built with a strong emphasis on **backend engineering, system design, and real-world features**.  
The frontend is intentionally minimal and clean, designed only to **demonstrate backend functionality clearly**.

> ⚠️ This project is evaluated primarily on **backend design, logic, and robustness**, not UI complexity.

---

## 📌 Problem Statement

Managing personal finances requires:
- Tracking income & expenses
- Categorizing transactions
- Monitoring budgets
- Supporting multiple currencies
- Storing transaction proofs (receipts)
- Secure authentication

This project solves all of the above with a **scalable, production-style backend architecture**.

---

## 🚀 Features (Complete)

### 🔐 Authentication & Security
- User registration & login (JWT-based)
- **Google OAuth 2.0 login**
- Secure protected routes using middleware
- Password hashing using bcrypt
- Token-based authorization for all APIs

---

### 👤 User Profile
- View user profile details
- Update name & email
- **Set preferred currency (INR / USD / EUR)**
- Preferred currency persists across sessions
- Used automatically in transactions & dashboard

---

### 💸 Transactions Management
- Add **income & expense** transactions
- Each transaction includes:
  - Category
  - Amount
  - Currency
  - Date
  - Description
- Delete transactions securely
- Strict validation & edge case handling
- Decimal precision preserved

---

### 📂 Categories
- Income & Expense categories
- User-specific categories
- **Default categories seeding**
- Safe deletion handling
- Category ownership enforced

---

### 📎 Receipt Upload System
- Upload receipts for transactions
- Stored on server using Multer
- Linked to individual transactions
- Secure file handling
- Receipts viewable via URL

---

### 🎯 Budgeting System
- Set monthly budgets per expense category
- Automatic **budget overrun detection**
- Budget resets monthly
- Prevents invalid budget creation
- Supports updates (upsert logic)

---

### 📧 Notification System
- **Email notifications** when budget exceeds limit
- Uses Nodemailer with Gmail App Password
- Triggered automatically on expense creation
- Prevents duplicate alerts for same period

---

### 🌍 Multi-Currency Support
- Supported currencies:
  - INR
  - USD
  - EUR
- Each transaction stores its own currency
- **Dashboard automatically converts values**
- Conversion handled server-side
- Accurate aggregation across mixed currencies

---

### 📊 Dashboard & Reporting
- Total Income
- Total Expense
- Savings calculation
- Monthly income vs expense report
- Category-wise breakdown
- All values shown in **user’s preferred currency**
- Real-time updates after transactions

---

## 🛠️ Tech Stack

### Backend
- **Node.js**
- **Express.js**
- **PostgreSQL**
- **Sequelize ORM**
- **JWT Authentication**
- **Passport.js (Google OAuth)**
- **Multer (File Uploads)**
- **Nodemailer (Email Notifications)**

### Frontend (Minimal Demo)
- HTML
- CSS
- Vanilla JavaScript
- Fetch API

> Frontend exists only to demonstrate backend functionality clearly.

---

## 🧱 Project Architecture

