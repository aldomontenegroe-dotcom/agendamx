# AgendaMX

Appointment booking system for Mexican businesses. WhatsApp-native, with online booking, automatic reminders, and an admin panel.

## Architecture

```
agendamx/
├── backend/          Node.js + Express API (port 4000)
│   └── src/
│       ├── index.js              Entry point, Express setup
│       ├── config/
│       │   ├── db.js             PostgreSQL pool (uses DATABASE_URL)
│       │   ├── schema.sql        DB schema (7 tables)
│       │   └── templates.js      13 business templates
│       ├── middleware/auth.js     JWT verification
│       ├── controllers/          authController, servicesController,
│       │                         appointmentsController, templatesController,
│       │                         whatsappController
│       ├── routes/               auth, services, appointments, templates, whatsapp
│       ├── services/whatsappService.js   Meta WhatsApp Cloud API
│       └── jobs/reminders.js     Cron: 24h + 2h reminders + follow-ups
│
├── web-admin/        React 19 + Vite 7 SPA
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               Root: screen state (picker/auth/dashboard)
│       └── pages/
│           ├── TemplatePicker.jsx   Onboarding step 1
│           ├── AuthPage.jsx        Login/Register (2-step)
│           └── Dashboard.jsx       Admin panel (mock data)
```

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL (pg), bcryptjs, jsonwebtoken, node-cron, axios
- **Frontend**: React 19, Vite 7, inline styles (no component library)
- **Infra**: VPS at 143.110.144.104, PM2 (process: agendamx-api), Nginx reverse proxy
- **APIs**: WhatsApp Cloud API (Meta)

## Database

PostgreSQL on production. 7 tables: businesses, users, services, clients, appointments, blocked_times, business_hours.

- Connection: `DATABASE_URL` env var (NOT individual DB_HOST/DB_PORT vars)
- Production DB user: `agendamx`, DB name: `agendamx`
- Tables owned by `postgres`, permissions granted to `agendamx`

## Deployment

- Repo: github.com/aldomontenegroe-dotcom/agendamx
- Branch: main
- Deploy command on VPS: `deploy-agendamx` (git pull + backend install + frontend build + pm2 restart)
- App path on VPS: `/var/www/agendamx`
- PM2 process: `agendamx-api`
- Frontend build output: `web-admin/dist/`

## API Endpoints

### Auth (no auth required for login/register)
- `POST /api/auth/register` - Register business + owner
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user profile (auth required)

### Services (auth required)
- `GET /api/services/` - List business services
- `POST /api/services/` - Create service (owner)
- `PUT /api/services/:id` - Update service (owner)
- `DELETE /api/services/:id` - Soft-delete (owner)
- `GET /api/services/public/:slug` - Public listing (no auth)

### Appointments (auth required except public)
- `GET /api/appointments/` - List appointments
- `POST /api/appointments/` - Admin create
- `PATCH /api/appointments/:id/status` - Update status (owner)
- `GET /api/appointments/public/:slug/availability` - Available slots (no auth)
- `POST /api/appointments/public/:slug/book` - Client booking (no auth)

### Templates
- `GET /api/templates/` - List all (no auth)
- `POST /api/templates/apply` - Apply to business (auth required)

### WhatsApp
- `GET /api/whatsapp/webhook` - Meta verification
- `POST /api/whatsapp/webhook` - Incoming messages

## Known Issues (as of 2026-02-26)

### Critical
1. **Route ordering** in `routes/appointments.js` - public routes after `:id` routes, Express matches wrong
2. **Missing DB columns** - templates try to insert `icon`, `is_popular` (services) and `seo_category`, `welcome_message`, `template_id`, `accent_color` (businesses) which don't exist in schema
3. **SQL function in WHERE** - `whatsappController.js:45` calls JS function inside SQL query
4. **Race condition** - Double booking possible (no transaction lock in create/book)

### High
5. **useEffect loop** - `App.jsx` useEffect depends on `[screen]`, re-fetches /me on every screen change
6. **Hard navigation** - AuthPage uses `window.location.href` instead of state, bypasses App.jsx flow
7. **Dashboard is all mock data** - No real API calls, hardcoded appointments/stats
8. **Dashboard buttons disconnected** - Confirm/Cancel/New appointment buttons have no handlers

### Medium
9. **Hardcoded timezone** - Uses `America/Mexico_City` instead of business.timezone
10. **Hardcoded domain** - `agendamx.net` in WhatsApp messages
11. **No frontend validation** - Password length, phone format not validated client-side
12. **TemplatePicker duplicate CSS** - Several duplicate `color` properties in inline styles
13. **No responsive design** - Dashboard breaks on mobile

## Dev Commands

```bash
# Local dev
cd backend && npm run dev      # nodemon on port 4000
cd web-admin && npm run dev    # vite dev server

# Build
cd web-admin && npm run build  # outputs to dist/

# Production
ssh root@143.110.144.104 "deploy-agendamx"
ssh root@143.110.144.104 "pm2 logs agendamx-api --lines 30 --nostream"
```

## Style Conventions

- Frontend: Inline styles, no CSS classes (except index.css for globals/animations)
- Colors: Auth pages use amber (#fbbf24), Dashboard uses red-orange (#FF5C3A)
- Backend: CommonJS (require/module.exports), async/await controllers
- No TypeScript, no PropTypes
- Commits in English, code comments in Spanish
