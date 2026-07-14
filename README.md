# Basketeer

Collaborative shopping app for students who want to combine orders, reach minimum basket thresholds, and reduce delivery friction across platforms like BigBasket, Blinkit, Amazon, and similar services.

## Overview

Basketeer lets a user create a shared basket, invite others to add items, track the combined order value in real time, and close the basket when the threshold is reached. It is built as a React + Supabase application with authentication, live basket updates, item management, and edge functions for product scraping and threshold notifications.

## Features

- Create or join active shared baskets
- Set platform, order threshold, and expiry time
- Add product links or manually enter item details
- Track current basket total against the target threshold
- Receive threshold notifications through Supabase Edge Functions
- Use Supabase Auth, database tables, and realtime subscriptions

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| UI | shadcn/ui, Tailwind CSS, lucide-react |
| Backend | Supabase Auth, Postgres, Realtime, Edge Functions |
| Data Access | `@supabase/supabase-js` |

## Project Structure

```text
basketeer/
|-- src/
|   |-- components/
|   |-- integrations/supabase/
|   |-- pages/
|   `-- main.tsx
|-- supabase/
|   |-- functions/
|   `-- migrations/
|-- package.json
`-- README.md
```

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Fill `.env` with your Supabase project values:

```env
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_SUPABASE_URL=https://your-project.supabase.co
```

## Scripts

```bash
npm run dev       # local development
npm run build     # production build
npm run lint      # lint project files
npm run preview   # preview production build
```

## Notes

- Real `.env` files are intentionally ignored and should not be committed.
- Supabase migrations and edge functions are included under `supabase/`.
- Product scraping may fail for websites with bot protection or dynamic rendering; manual item entry remains the fallback.

## Roadmap

- Add basket invite links
- Add notification preferences
- Add platform-specific product parsers
- Add tests for basket and item workflows
