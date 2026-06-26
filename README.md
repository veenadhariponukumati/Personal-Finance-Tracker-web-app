# Personal Finance Tracker MVP

A production-quality personal finance web app built with Next.js — track income and expenses with a clean dashboard, charts, and filters.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** NextAuth v5
- **Validation:** Zod
- **Charts:** Recharts
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Infrastructure:** Docker Compose

## Features
- ✅ Sign up / log in with email/password
- ✅ Dashboard with total income, expenses, and balance summary cards
- ✅ Monthly income vs expense bar chart (Recharts)
- ✅ Add, edit, and delete income/expense transactions
- ✅ Assign transactions to categories (Food, Rent, Transport, Shopping, Entertainment, Bills, Salary, Other)
- ✅ Filter transactions by category and month/year
- ✅ Responsive design — desktop table + mobile card layout
- ✅ Loading, empty, error, and success states throughout

## Setup Instructions

### 1. Prerequisites
- Docker & Docker Compose
- Node.js 18+ & npm

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://finance:finance123@localhost:5432/finance_tracker?schema=public"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Setup
Start the PostgreSQL database:
```bash
docker-compose up -d
```

Install dependencies:
```bash
npm install
```

Apply Prisma migrations and seed:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Running the App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 5. Running Tests
**Unit tests (Vitest):**
```bash
npm test
```

**E2E tests (Playwright — requires dev server running on port 3000):**
```bash
npx playwright install chromium
npm run test:e2e
```

## Project Structure
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/         # Login page
│   │   └── register/      # Registration page
│   ├── (dashboard)/
│   │   ├── dashboard/     # Dashboard with summary + chart
│   │   ├── layout.tsx     # Auth-guarded layout + nav bar
│   │   └── transactions/  # List, filters, new/edit forms
│   ├── api/auth/          # NextAuth API route
│   └── page.tsx           # Root redirect → /dashboard
├── components/
│   ├── dashboard/         # MonthlyChart, NavBar
│   ├── forms/             # TransactionForm (create/edit)
│   └── ui/                # Reusable: Loading, EmptyState, ErrorBanner, SuccessToast
├── lib/
│   ├── auth.ts            # NextAuth config
│   └── prisma.ts          # Prisma client singleton
├── schemas/
│   └── transaction.ts     # Zod validation schemas
├── actions/
│   ├── auth.ts            # Register/login server actions
│   ├── transactions.ts    # Transaction CRUD server actions
│   └── dashboard.ts       # Dashboard data queries
tests/
├── unit/
│   ├── schemas.test.ts    # Zod validation tests (15)
│   ├── transactions.test.ts # Transaction utility tests (12)
│   └── dashboard.test.ts  # Dashboard logic tests (8)
└── e2e/
    ├── auth.spec.ts       # Auth flow E2E tests
    └── transactions.spec.ts # Transaction CRUD E2E tests
prisma/
├── schema.prisma          # Database schema
└── seed.ts                # Category seed script
```

## API
This app uses **Next.js Server Actions** for all data mutations (no REST API routes needed for MVP scope).

## Acceptance Criteria Checklist
- [x] App runs locally with Docker Compose
- [x] User can register, log in, and access a protected dashboard
- [x] User can create, edit, delete, and view transactions
- [x] Dashboard totals (income, expenses, balance) are correct per user
- [x] Monthly chart renders income vs expenses correctly
- [x] Filters work by month and category
- [x] Forms validate amount, type, category, date, and description (Zod)
- [x] UI includes loading, empty, success, and error states
- [x] App is responsive on desktop and mobile
- [x] 35 unit tests (Vitest) — schema, transaction utils, dashboard logic
- [x] 2 E2E test suites (Playwright) — auth flow, transaction CRUD