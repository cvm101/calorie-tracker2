# Calorie Tracker

A Next.js 16 + Supabase calorie tracking app with USDA food search, daily logging, charts, and history views.

## Overview
- Email/password auth via Supabase; unauthenticated users are redirected to `/login`.
- Dashboard shows today's calories vs goal (donut chart) and today's meal list.
- Food search calls USDA FoodData Central; lets you log foods in servings or grams.
- History view lets you pick a date to review logged foods and totals.
- Settings lets you set a daily calorie goal.

## Stack
- Next.js 16 (App Router), React 19, TypeScript
- Supabase Auth + Postgres
- Recharts for the donut chart, React Calendar for history picker
- Tailwind CSS (v4/postcss plugin)

## Prerequisites
- Node.js 18+ and npm
- Supabase project with email/password auth enabled
- USDA FoodData Central API key

## Setup
1. Clone and install:
   ```bash
   npm install
   ```
2. Create `.env.local` in the repo root:
   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_USDA_API_KEY=your_usda_api_key
   ```
3. Start dev server:
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000. Root redirects to `/login`.

## Scripts
- `npm run dev` - next dev server
- `npm run build` - production build
- `npm run start` - start built app
- `npm run lint` - eslint

## Project Structure (key files)
- `app/page.tsx` - redirects to login
- `app/login/page.tsx` - auth form using Supabase
- `app/dashboard/page.tsx` - donut chart + add food + today's logs
- `app/history/page.tsx` - date picker + daily summary
- `app/settings/page.tsx` - daily goal edit/upsert
- `components/FoodSearch.tsx` - USDA search + log food
- `components/DailyLogsList.tsx` - today's meals with delete
- `utils/supabase.js` - Supabase client (requires env vars)
- `utils/foodApi.js` / `components/CalorieChart.tsx` - placeholders currently empty

## Data Model (Supabase tables)
Create these tables (IDs can be UUID):

```sql
-- Users handled by Supabase auth.users
create table public.user_settings (
  id uuid primary key references auth.users (id) on delete cascade,
  daily_calorie_goal integer not null default 2000,
  updated_at timestamp with time zone default now()
);

create table public.food_dictionary (
  id text primary key,
  food_name text not null,
  calories_per_100g numeric not null
);

create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  food_id text references public.food_dictionary (id) on delete set null,
  date date not null,
  quantity_g numeric not null,
  calories_consumed numeric not null,
  created_at timestamp with time zone default now()
);

create index on public.daily_logs (user_id, date);
```

## How it works
- Auth: Supabase email/password in `app/login/page.tsx`; session checked before dashboard/history/settings.
- Dashboard: fetches today's goal from `user_settings`, today's calories from `daily_logs`, renders donut (Recharts) and stats.
- Add food: `FoodSearch` calls USDA search API with `NEXT_PUBLIC_USDA_API_KEY`, maps results, lets you log servings/grams, writes to `food_dictionary` and today's `daily_logs`, then refreshes dashboard.
- Today's list: `DailyLogsList` shows today's `daily_logs` with joined `food_dictionary` names; supports delete.
- History: calendar picks a date, fetches that day's `daily_logs` and totals.
- Settings: upsert `daily_calorie_goal` for the current user.

## Troubleshooting
- **Missing env vars**: `utils/supabase.js` will throw if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset.
- **USDA API**: empty results or 403 usually mean an invalid/over-quota API key; verify `NEXT_PUBLIC_USDA_API_KEY`.
- **Auth redirect loop**: ensure you are logged in; Supabase session must exist for dashboard/history/settings.
- **Empty placeholders**: `utils/foodApi.js` and `components/CalorieChart.tsx` are empty; add implementations or remove imports before production.

## Deployment
- Vercel works out of the box: set the three env vars in project settings and link your Supabase project.
- Any Node host: run `npm run build` then `npm run start` with the same env vars configured.

## Testing
- No automated tests yet. Add component tests (e.g., Vitest/Testing Library) and Supabase-integration coverage before production.
