# Personal Finance Application

A production-ready, full-stack personal finance management system designed for scalability and maintainability.
Built with **Django REST Framework** and **React**.

## Architecture

### Backend (Django)
- **Modular Apps**: `core` (Auth), `finance` (Expenses), `debts` (Loans), `emis` (Installments).
- **Security**: JWT Authentication (`simplejwt`), Row-level permissions (User isolation).
- **Database**: SQLite (default) / PostgreSQL ready.
- **API**: RESTful architecture with nested serializers for rich data presentation.

### Frontend (React)
- **Tech Stack**: Vite, React Router 6, Axios, Recharts, Lucide React.
- **Design**: Component-driven, CSS Variables for theming, Dark Mode default.
- **UX**: Single Page Application (SPA) with responsive glassmorphism layout.

## Features

### 1. Expense Tracking
- Create custom Categories and Items.
- Log daily expenses.
- Filter and visualize data.

### 2. Debt Management
- Track money Borrowed and Lent.
- Mark debts as Settled (moves to Closed Deal history).
- View specific month-wise history.

### 3. EMI Tracker
- Create EMIs with "Total Months" and "Start Date".
- **Auto-generation**: System automatically creates installment schedules.
- Track progress via visual bars.
- Mark individual installments as Paid.

### 4. Visual Reports
- daily Trend (Line Chart)
- Monthly Comparison (Bar Chart)
- Category Distribution (Pie Chart)

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 16+

### Backend Setup
1. Open a terminal in the root directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Navigate to backend:
   ```bash
   cd backend
   ```
4. Apply migrations:
   ```bash
   python manage.py migrate
   ```
5. Run server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Open a new terminal.
2. Navigate to frontend:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

## API Endpoints
- **Auth**: `/api/auth/register/`, `/api/auth/login/`
- **Dashboard Data**: `/api/expenses/reports/`, `/api/debts/summary/`
- **Resources**: `/api/categories/`, `/api/items/`, `/api/expenses/`, `/api/debts/`, `/api/emis/`
