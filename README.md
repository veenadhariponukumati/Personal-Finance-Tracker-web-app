# Personal Finance Tracker MVP

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** NextAuth v5
- **Validation:** Zod

## Setup Instructions

### 1. Prerequisites
- Docker & Docker Compose
- Node.js & npm

### 2. Environment Variables
Create a `.env` file in the root directory and add the following:
```env
DATABASE_URL="postgresql://finance:finance123@localhost:5432/finance_tracker?schema=public"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Setup
Start the PostgreSQL database using Docker Compose:
```bash
docker-compose up -d
```

Apply Prisma migrations and generate client:
```bash
npx prisma migrate dev --name init
```

Seed the database with default categories:
```bash
npx prisma db seed
```

### 4. Running the App
Install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure
- `src/app`: App Router pages and layouts.
- `src/lib`: Shared libraries (Prisma client, NextAuth config).
- `src/schemas`: Zod validation schemas.
- `prisma`: Database schema and seed script.
- `docker-compose.yml`: Local PostgreSQL setup.

## Features
- Sign up / log in with email/password (NextAuth)
- Dashboard overview (In progress)
- Transaction management (In progress)
- Category filtering (In progress)
