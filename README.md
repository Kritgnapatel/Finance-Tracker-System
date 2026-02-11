# 💰 Finance Tracker  
### Backend-Focused Full Stack Application (Production-Oriented)

A **production-style personal finance management system** built with a **strong backend-first approach**.  
The project focuses on **clean architecture, secure authentication, data integrity, scalability, and real-world use cases**.

> 🎯 **Evaluation Focus:**  
> This project is designed to be evaluated primarily on **backend engineering quality**, not UI complexity.  
> The frontend is intentionally minimal and exists only to **demonstrate API functionality**.

---

## 📌 Problem Statement

Personal finance management is not just about tracking expenses. A real-world solution must handle:

- Secure user authentication
- Income & expense tracking
- Category-based budgeting
- Multi-currency transactions
- File uploads (receipts)
- Automated alerts & notifications
- Accurate financial aggregation

Most beginner projects stop at CRUD.  
This project goes further by implementing **real-world backend systems** such as:
- Budget overrun detection
- Email notifications
- Currency normalization
- Secure file handling
- Ownership-based data access

---

## 🚀 Key Features

### 🔐 Authentication & Security
- User registration & login using **JWT**
- **Google OAuth 2.0** authentication (Passport.js)
- Password hashing using **bcrypt**
- Protected routes using middleware
- Token-based authorization for every API
- Ownership validation for all user resources

---

### 👤 User Profile Management
- View & update profile details
- Update name and email
- Set **preferred currency**:
  - INR
  - USD
  - EUR
- Preferred currency persists across sessions
- Automatically applied across dashboard & reports

---

### 💸 Transactions Management
- Add **income and expense** transactions
- Each transaction supports:
  - Amount (decimal-safe)
  - Category
  - Currency
  - Date
  - Description
- Secure deletion with ownership checks
- Strong validation & edge-case handling
- Precision-safe calculations (no rounding bugs)

---

### 📂 Category System
- Separate income & expense categories
- **User-specific categories**
- Default category seeding for new users
- Safe deletion with dependency checks
- Prevents cross-user category access

---

### 📎 Receipt Upload System
- Upload transaction receipts
- Server-side storage using **Multer**
- Receipts linked to transactions
- Secure file naming & access
- Receipt retrieval via protected URLs

---

### 🎯 Budgeting System
- Monthly budgets per expense category
- **Automatic budget overrun detection**
- Monthly reset logic
- Budget upsert (create/update safely)
- Prevents invalid or duplicate budgets

---

### 📧 Notification System
- Email alerts when budget exceeds limit
- Implemented using **Nodemailer**
- Gmail App Password authentication
- Triggered automatically on expense creation
- Duplicate alerts prevented per month/category

---

### 🌍 Multi-Currency Support
- Supported currencies:
  - INR
  - USD
  - EUR
- Each transaction stores its original currency
- **Server-side currency normalization**
- Dashboard shows all values in preferred currency
- Accurate aggregation across mixed currencies

---

### 📊 Dashboard & Reporting
- Total income
- Total expenses
- Net savings calculation
- Monthly income vs expense summary
- Category-wise expense breakdown
- Real-time recalculation after every transaction
- Currency-normalized reporting

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- JWT Authentication
- Passport.js (Google OAuth)
- Multer (File uploads)
- Nodemailer (Email notifications)

### Frontend (Minimal Demo)
- HTML
- CSS
- Vanilla JavaScript
- Fetch API

> ⚠️ Frontend intentionally kept minimal to highlight backend engineering.

---

## 🧪 Data Integrity & Validation
- Input validation on all APIs
- Authorization checks for every resource
- Decimal-safe monetary calculations
- Referential integrity enforced
- Secure file upload handling
- Graceful error responses

---

## 🔐 Security Practices
- Password hashing (bcrypt)
- JWT-based stateless auth
- OAuth token validation
- Route-level authorization
- Secure file handling
- Environment variable configuration

---

## 📈 Scalability & Extensibility
Designed to be easily extended with:
- Additional currencies
- Advanced analytics
- Monthly reports (PDF)
- Admin dashboards
- Microservices migration

---

## 🎯 Why This Project Stands Out
- Not a CRUD-only app
- Real-world backend features
- Strong system design
- Production-style logic
- Interview-ready project

This project demonstrates **backend engineering maturity**, not just framework usage.

---

## 👨‍💻 Author
**Kritgna Patel**  
Backend-focused developer  
B.Tech | IIIT Pune

---

