# CistoDom MVP

Managed marketplace MVP for home cleaning in Serbia, starting with a Beograd pilot. The app is web-first and built so it can later become a PWA.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite for local development via `DATABASE_URL`
- Zod validation
- React Hook Form in the booking wizard
- Credentials auth with hashed passwords
- Role-based access control
- Vitest unit tests

## Setup

```bash
npm install
npm run prisma:generate
npm run db:init
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`.

## Environment

Create `.env` from `.env.example`:

```bash
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-a-long-random-secret"
```

For PostgreSQL later, point `DATABASE_URL` to PostgreSQL and update the Prisma datasource provider.

## Demo Accounts

- Admin: `admin@cistodom.local` / `Admin123!`
- Customer: `milica@demo.local` / `Korisnik123!`
- Cleaner: `jelena@clean.local` / `Cistac123!`

## Useful Commands

```bash
npm run dev
npm run build
npm run test
npm run db:init
npm run prisma:seed
```

## What Is Included

- Public landing page in Serbian Latin
- Booking wizard with active Beograd zones, disabled Novi Sad, disabled deep cleaning, live pricing, login/register step, and recurring preference
- Customer dashboard with booking details, scoped messages, cancellation, reviews, incidents, and recurrence preference
- Cleaner dashboard with verification status, editable zones and availability, assigned bookings, job actions, messages, and payout estimate
- Admin dashboard with KPIs, booking management, cleaner management, customer management, incident management, manual payment state, admin notes, and audit trail
- Seed data for admins, customers, cleaners, bookings, reviews, incidents, notes, notifications, service types, add-ons, and coverage zones
- Pricing, payment abstraction, notification service, audit service, booking status helper, and access-control helper

## MVP Limitations

- Payments are manual only; no real payment gateway is integrated.
- Messaging is refresh-based and booking-scoped only.
- Recurring bookings store preference only; automatic recurring billing/scheduling is not implemented.
- No SMS, email, file upload, routing, AI matching, or payout integration.
- Cleaner phone numbers are not exposed to customers.
- Cleaner profiles are not public marketplace listings.

## Recommended Production Steps

- Integrate a real payment gateway with payment webhooks.
- Add SMS/email notifications.
- Add legal documents, cancellation policy, and consent flows.
- Add insurance and damage-resolution workflow.
- Complete GDPR/ZZPL review for Serbia.
- Move to production PostgreSQL.
- Add structured monitoring, logging, and alerting.
- Add background jobs for notifications and recurring booking operations.
- Add Playwright smoke tests once deployment/runtime environment is fixed.
