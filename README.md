# Personal Finance Tracker MVP

A production-quality personal finance web app built with Next.js — track income and expenses with a clean dashboard, charts, filters, and AI-powered insights.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** NextAuth v5 (Credentials provider, JWT sessions)
- **Validation:** Zod
- **Charts:** Recharts
- **AI:** OpenAI GPT-4o-mini
- **Testing:** Vitest (unit + component) + Playwright (E2E)
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
- ✅ **AI Spending Insights** — on-demand AI analysis of spending patterns
- ✅ **Ask Finances** — natural-language chat about your finances

## Setup Instructions

### 1. Prerequisites
- Docker & Docker Compose
- Node.js 18+ & npm

### 2. Environment Variables
Create a `.env` file in the root directory (copy from `.env.example`):
```env
DATABASE_URL="postgresql://finance:finance123@localhost:5432/finance_tracker?schema=public"
AUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-your-openai-key-here"
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string for Docker |
| `AUTH_SECRET` | ✅ Yes | Random 32+ char string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | ✅ Yes | Must match the app URL |
| `OPENAI_API_KEY` | ❌ No (AI degrades gracefully) | From [platform.openai.com](https://platform.openai.com/api-keys) |

**AI features work without an API key** — the UI shows a friendly fallback message instead of crashing. Without `OPENAI_API_KEY`, the API routes return 503 and both components display "AI is not available right now."

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

**Unit + Component tests (Vitest):**
```bash
npm test
```

**E2E tests (Playwright — requires dev server running on port 3000):**
```bash
npx playwright install chromium
npm run test:e2e
```

**Run all tests:**
```bash
npm test          # unit tests (122+ tests)
npm run test:e2e  # E2E tests (7+ tests across 3 suites)
```

## AI Financial Copilot Features

### Overview
The app includes two AI-powered features that help users understand their spending. Both are **user-initiated only** — no automatic AI calls happen on page load.

### Architecture & Guardrails

```
User Action → Client Component → API Route → Intent Detection → Analytics Engine → Context Builder → OpenAI → Response
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Client UI | React (`"use client"`) | Renders chat, insight card, handles user interaction |
| API Routes | Next.js App Router | Auth, validation, rate limiting, proxies to AI service |
| Intent Detection | Keyword-based (no LLM) | Classifies user questions into known intents |
| Analytics Engine | Pure Prisma queries | Returns aggregated data only — never raw transactions |
| Context Builder | ~30 lines of functions | Packages only metrics (totals, averages, deltas) |
| LLM | OpenAI GPT-4o-mini | Generates natural-language responses |
| Validation | Zod | Validates every LLM response, retries once on failure |
| Audit | Prisma `AiInteraction` | Logs every AI call (intent, tokens, latency, validity) |

### Security Guardrails
1. **AI never calculates** — all numbers come from deterministic Prisma queries
2. **AI never sees raw data** — context builder sends only aggregated metrics
3. **AI never generates SQL** — no database access, no tool execution
4. **AI never accesses other users' data** — all queries scoped to `userId` from session
5. **Input validated with Zod** — message length capped at 500 chars
6. **Auth required for every API call** — 401 if no valid session
7. **Rate limited** — 5 requests per minute per user (429 with retry-after)

### Rate Limiting
- **5 requests per minute** per user (per endpoint)
- Rate limiter is in-memory (`src/lib/rate-limit.ts`) — suitable for single-server deployment
- On 429, UI shows an amber warning with the exact retry time
- Headers: `Retry-After` sent on 429 responses

### Fallback Behavior
If the AI service is unavailable (no API key, network error, timeout):
- The **insight card** displays: "AI insights are not available right now. This usually means no API key is configured. You can continue using all other features normally."
- The **chat** displays: "AI chat is not available right now. This usually means no API key is configured. You can continue using all other features normally."
- All other app features (transactions, dashboard, charts, filters) work normally without an API key.

### Components

#### AI Spending Insights Card
- Located on the dashboard, to the right of the chart
- Click **"Generate Insight"** to get an AI summary of your spending patterns
- States: idle, loading, success, error, rate-limited, unavailable
- Dismissible via ✕ button
- Shows "Generate another insight" link after first result

#### Ask Finances Chat
- Full-width chat component below the chart on the dashboard
- Type a question like "How much did I spend on food?" and click **Ask**
- User messages appear in blue bubbles, AI responses in gray
- States: empty (with example prompt), loading, response, error, rate-limited
- Input validates client-side (non-empty, max 500 chars)

## Project Structure
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/         # Login page
│   │   └── register/      # Registration page
│   ├── (dashboard)/
│   │   ├── dashboard/     # Dashboard with summary + chart + AI components
│   │   ├── layout.tsx     # Auth-guarded layout + nav bar
│   │   └── transactions/  # List, filters, new/edit forms
│   ├── api/
│   │   ├── auth/          # NextAuth API route
│   │   └── copilot/       # Ask + Insights API routes
│   └── page.tsx           # Root redirect → /dashboard
├── components/
│   ├── dashboard/         # MonthlyChart, NavBar, AiInsightCard, AskFinances
│   ├── forms/             # TransactionForm (create/edit)
│   └── ui/                # Reusable: Loading, EmptyState, ErrorBanner, SuccessToast
├── ai/
│   ├── types.ts           # TypeScript types
│   ├── prompts.ts         # System prompts
│   ├── copilot.ts         # Main orchestrator
│   ├── context.ts         # Analytics context builder
│   ├── intent-detector.ts # Keyword-based intent detection
│   ├── openai.ts          # OpenAI client wrapper
│   └── validate.ts        # Zod validation + retry
├── lib/
│   ├── auth.ts            # NextAuth config
│   ├── prisma.ts          # Prisma client singleton
│   ├── rate-limit.ts      # In-memory rate limiter
│   └── audit-log.ts       # AI interaction audit logging
├── schemas/
│   └── transaction.ts     # Zod validation schemas
├── actions/
│   ├── auth.ts            # Register/login server actions
│   ├── transactions.ts    # Transaction CRUD server actions
│   └── dashboard.ts       # Dashboard data queries
tests/
├── unit/
│   ├── schemas.test.ts        # Zod validation tests
│   ├── transactions.test.ts   # Transaction utility tests
│   ├── dashboard.test.ts      # Dashboard logic tests
│   ├── copilot.test.ts        # Copilot orchestration tests
│   ├── intent-detector.test.ts # Intent matching tests
│   ├── ai-validate.test.ts    # Zod validation + retry tests
│   ├── rate-limit.test.ts     # Rate limiting edge cases
│   ├── analytics-engine.test.ts # Analytics engine tests
│   ├── api-copilot.test.ts    # API route integration tests
│   └── ai-ui.test.tsx         # Component UI tests
└── e2e/
    ├── auth.spec.ts           # Auth flow E2E tests
    ├── transactions.spec.ts   # Transaction CRUD E2E tests
    └── ai-dashboard.spec.ts   # AI dashboard component E2E tests
prisma/
├── schema.prisma          # Database schema (includes AiInteraction model)
└── seed.ts                # Category seed script
```

## API Routes

| Route | Method | Purpose | Auth | Rate Limit |
|-------|--------|---------|------|------------|
| `POST /api/copilot/ask` | POST | Answer a question about finances | Required | 5/min/user |
| `GET /api/copilot/insights` | GET | Generate spending insight | Required | 5/min/user |

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
- [x] AI Spending Insights card with Generate Insight button
- [x] Ask Finances chat component with input validation
- [x] Both AI components show loading, success, error, rate-limit, and unavailable states
- [x] No automatic AI calls on page load
- [x] AI features degrade gracefully without an API key
- [x] 122+ unit tests (Vitest) — schemas, transactions, dashboard, AI services, API routes, UI components
- [x] 3 E2E test suites (Playwright) — auth flow, transaction CRUD, AI dashboard components
- [x] Responsive on desktop and mobile