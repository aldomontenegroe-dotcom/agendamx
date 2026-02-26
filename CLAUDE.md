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
│       ├── middleware/auth.js     JWT verification (req.user = {userId, businessId, role})
│       ├── controllers/
│       │   ├── authController.js          Register, login, me
│       │   ├── servicesController.js      CRUD services
│       │   ├── appointmentsController.js  List, create, updateStatus, availability, book
│       │   ├── businessesController.js    getPublic, getMe, updateMe
│       │   ├── businessHoursController.js list, update (7-day bulk)
│       │   ├── clientsController.js       list (search), getOne, update
│       │   ├── statsController.js         dashboard KPIs, revenue analytics
│       │   ├── templatesController.js     list, apply
│       │   └── whatsappController.js      webhook verify + receive
│       ├── routes/               auth, services, appointments, businesses,
│       │                         businessHours, clients, stats, templates, whatsapp
│       ├── services/whatsappService.js   Meta WhatsApp Cloud API
│       └── jobs/reminders.js     Cron: 24h + 2h reminders + follow-ups
│
├── web-admin/        React 19 + Vite 7 SPA (admin panel)
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               Root: screen state (picker/auth/dashboard)
│       ├── utils/api.js          Shared apiFetch() with Bearer token
│       └── pages/
│           ├── TemplatePicker.jsx   Onboarding step 1
│           ├── AuthPage.jsx        Login/Register (2-step)
│           ├── Dashboard.jsx       Shell with sidebar nav + DashboardHome
│           ├── ServicesPage.jsx    CRUD services management
│           ├── AppointmentsPage.jsx Full appointments view with create
│           ├── ClientsPage.jsx     Client list + detail + edit
│           ├── SettingsPage.jsx    Business info + hours editor
│           └── RevenuePage.jsx     Revenue analytics with bar chart
│
├── web-public/       React 19 + Vite 7 SPA (public booking)
│   └── src/
│       ├── App.jsx               Slug parser from URL path
│       └── pages/BookingPage.jsx 4-step booking flow (real API)
```

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL (pg), bcryptjs, jsonwebtoken, node-cron, axios
- **Frontend**: React 19, Vite 7, inline styles (no component library, no router)
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
- Frontend builds: `web-admin/dist/` and `web-public/dist/`

## API Endpoints

### Auth
- `POST /api/auth/register` - Register business + owner
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user profile (auth)

### Services
- `GET /api/services/` - List business services (auth)
- `POST /api/services/` - Create service (owner)
- `PUT /api/services/:id` - Update service (owner)
- `DELETE /api/services/:id` - Soft-delete (owner)
- `GET /api/services/public/:slug` - Public listing

### Appointments
- `GET /api/appointments?date=&status=` - List appointments (auth)
- `POST /api/appointments/` - Admin create (owner)
- `PATCH /api/appointments/:id/status` - Update status (owner)
- `GET /api/appointments/public/:slug/availability` - Available slots (public)
- `POST /api/appointments/public/:slug/book` - Client booking (public)

### Businesses
- `GET /api/businesses/public/:slug` - Public business info
- `GET /api/businesses/me` - Business details (auth)
- `PUT /api/businesses/me` - Update business (owner)

### Business Hours
- `GET /api/business-hours` - List 7-day schedule (auth)
- `PUT /api/business-hours` - Bulk update all 7 days (owner)

### Clients
- `GET /api/clients?search=` - List/search clients (auth)
- `GET /api/clients/:id` - Client detail + history (auth)
- `PUT /api/clients/:id` - Update client (auth)

### Stats
- `GET /api/stats/dashboard` - Today's KPIs (auth)
- `GET /api/stats/revenue?from=&to=` - Revenue analytics (auth)

### Templates
- `GET /api/templates/` - List all (public)
- `POST /api/templates/apply` - Apply to business (auth)

### WhatsApp
- `GET /api/whatsapp/webhook` - Meta verification
- `POST /api/whatsapp/webhook` - Incoming messages

## Dev Commands

```bash
# Local dev
cd backend && npm run dev      # nodemon on port 4000
cd web-admin && npm run dev    # vite dev server port 3000
cd web-public && npm run dev   # vite dev server port 3001

# Build
cd web-admin && npx vite build   # outputs to dist/
cd web-public && npx vite build  # outputs to dist/

# Production
ssh root@143.110.144.104 "deploy-agendamx"
ssh root@143.110.144.104 "pm2 logs agendamx-api --lines 30 --nostream"
```

## Style Conventions

- Frontend: Inline styles, no CSS classes (except index.css for globals/animations)
- Dark theme: #08080F bg, #13131A cards, #FF5C3A primary, #00E5A0 accent, #7070A0 muted
- Fonts: Syne (headings), DM Sans (body)
- Backend: CommonJS (require/module.exports), async/await controllers
- No TypeScript, no PropTypes, no router library
- State-based navigation in Dashboard.jsx (activeNav)
- Shared API utility: `web-admin/src/utils/api.js` (apiFetch with Bearer token)
