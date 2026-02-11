# 💰 Finance Tracker  
### Backend-Focused Full Stack Application (Production-Oriented)

A **production-style personal finance management system** built with a strong **backend-first engineering approach**.

This project emphasizes:

- Clean architecture  
- Secure authentication  
- Data integrity  
- Scalability  
- Real-world backend logic  

> 🎯 **Evaluation Focus**  
> This project is designed to be evaluated primarily on **backend engineering quality**, not UI complexity.  
> The frontend is intentionally minimal and exists only to demonstrate API functionality clearly.

---

# 📌 Problem Statement

Modern personal finance management requires more than basic CRUD operations.  
A real-world backend system must handle:

- Secure user authentication  
- Income & expense tracking  
- Category-based budgeting  
- Multi-currency transactions  
- File uploads (receipts)  
- Automated notifications  
- Accurate financial aggregation  

Most beginner projects stop at CRUD.  
This project goes further by implementing **real backend-grade features**, including:

- Budget overrun detection  
- Email notification triggers  
- Currency normalization  
- Secure file storage  
- Ownership-based access control  

---

# 🚀 Key Features

## 🔐 Authentication & Security

- User registration & login using **JWT**
- Google OAuth 2.0 authentication (Passport.js)
- Password hashing using **bcrypt**
- Protected routes via middleware
- Stateless token-based authorization
- Strict ownership validation for all resources

---

## 👤 User Profile Management

- View & update profile details
- Update name and email
- Set preferred currency:
  - INR
  - USD
  - EUR
- Preferred currency persists across sessions
- Automatically applied across dashboard & reports

---

## 💸 Transactions Management

- Add income & expense transactions
- Each transaction supports:
  - Amount (decimal-safe precision)
  - Category
  - Currency
  - Date
  - Description
- Secure deletion with ownership checks
- Strong validation & edge-case handling
- Precision-safe financial calculations

---

## 📂 Category System

- Separate income & expense categories
- User-specific categories
- Default category seeding for new users
- Safe deletion with dependency checks
- Prevents cross-user category access

---

## 📎 Receipt Upload System

- Upload transaction receipts
- Server-side storage using Multer
- Receipts linked to transactions
- Secure file naming strategy
- Receipt access via protected URLs

---

## 🎯 Budgeting System

- Monthly budgets per expense category
- Automatic budget overrun detection
- Monthly reset logic
- Budget upsert (create/update safely)
- Prevents duplicate budgets

---

## 📧 Notification System

- Email alerts when budget exceeds limit
- Implemented using Nodemailer
- Gmail App Password authentication
- Automatically triggered on expense creation
- Duplicate alerts prevented per month/category

---

---

## 📧 Email Notification – Deployment & Infrastructure Note

The budget exceed notification system is fully implemented and operational in the **local development environment**, demonstrating complete backend email workflow integration.

---

### ✅ Local Development

When running locally:

- Email alerts trigger automatically on budget breach  
- Notifications are sent to the authenticated user  
- Nodemailer handles secure SMTP communication  
- Duplicate alerts are prevented per category/month  
- Credentials are managed via environment variables  

This validates proper SMTP integration, event-driven logic, and clean separation between business logic and provider configuration.

---

### ⚠️ Deployment Constraints (Render – Free Tier)

On **Render (Free Plan)**, outbound SMTP traffic is restricted due to infrastructure-level limitations:

- Direct SMTP providers (e.g., Gmail via Nodemailer) may be blocked  
- Outbound mail ports can be disabled  

As a result, live email delivery may not function in the hosted demo.

An alternative provider (**Resend**) was integrated; however, the free tier imposes strict sending and verification limits.

---

### 🧠 Engineering Perspective

This is an **infrastructure constraint**, not an implementation issue.

The architecture supports:

- Multiple email providers  
- Environment-based provider switching  
- Provider abstraction from business logic  

With services like SendGrid, AWS SES, or Resend (Pro), the system works without code changes.

---

### 📌 Evaluator Note

✔ Fully implemented  
✔ Fully functional locally  
✔ Production-ready architecture  

Deployment behavior depends solely on hosting provider SMTP policies.

---

## 🌍 Multi-Currency Support

- Supported currencies:
  - INR
  - USD
  - EUR
- Each transaction stores its original currency
- Server-side currency normalization
- Dashboard displays values in user's preferred currency
- Accurate aggregation across mixed currencies

---

## 📊 Dashboard & Reporting

- Total income
- Total expenses
- Net savings calculation
- Monthly income vs expense summary
- Category-wise breakdown
- Real-time recalculation
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

## 🏃‍♂️ Run Locally
- npm install
- npm start 
- create .env in root directory and add :
  - PORT=5000
  - DB_NAME=your_database_name
  - DB_USER=your_database_user
  - DB_PASSWORD=your_database_password
  - DB_HOST=localhost
  - JWT_SECRET=your_jwt_secret
  - JWT_EXPIRES_IN=1d
  - ALERT_EMAIL=your_email_address
  - ALERT_EMAIL_PASSWORD=your_email_password
  - GOOGLE_CLIENT_ID=your_google_client_id
  - GOOGLE_CLIENT_SECRET=your_google_client_secret
  - GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
  - EMAIL_SERVICE=gmail
  - EMAIL_USER=your_email_address
  - EMAIL_PASS=your_email_app_password
  - FRONTEND_URL=http://localhost:5000
  - EMAIL_PROVIDER=resend
  - RESEND_API_KEY=re_key_yours
  - EMAIL_FROM=onboarding@resend.dev
  - EMAIL_TEST_RECEIVER=your_email

- server will run on http://localhost:5000

---


## 👨‍💻 Author
**Kritgna Patel**  
Backend-focused developer  
B.Tech | IIIT Pune

---

