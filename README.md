# AgendaMX 📅

Plataforma SaaS de agendamiento de citas para micro-negocios mexicanos con WhatsApp nativo.

## Stack

- **Backend:** Node.js + Express + PostgreSQL
- **Web Admin:** React + Vite + Tailwind v4
- **Web Público:** React + Vite (página de reservas para clientes)
- **Mobile:** React Native + Expo *(próximamente)*
- **Mensajería:** WhatsApp Business Cloud API (Meta)
- **Deploy:** DigitalOcean (backend) + Vercel (frontends)

## Estructura

```
agendamx/
├── backend/          API REST + cron de recordatorios
│   └── src/
│       ├── config/   DB, schema SQL, templates de industria
│       ├── controllers/
│       ├── jobs/     Cron de recordatorios WhatsApp
│       ├── middleware/
│       ├── routes/
│       └── services/ WhatsApp service
├── web-admin/        Panel del dueño del negocio
├── web-public/       Página de reservas (cliente final)
├── mobile/           App React Native (próximamente)
└── docs/             Guías de setup y configuración
```

## Setup local

### Backend
```bash
cd backend
cp .env.example .env    # Configura tus variables
npm install
npm run dev
```

### Web Admin
```bash
cd web-admin
npm install
npm run dev             # http://localhost:5173
```

### Web Público
```bash
cd web-public
npm install
npm run dev             # http://localhost:5174
```

## Variables de entorno (backend)

```env
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/agendamx
JWT_SECRET=tu_secret_muy_largo_aqui
JWT_EXPIRES_IN=7d
WHATSAPP_TOKEN=tu_token_de_meta
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=tu_verify_token
CORS_ORIGINS=http://localhost:5173,https://admin.agendamx.net
```

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro nuevo negocio |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Perfil actual |
| GET | `/api/templates` | Lista de templates |
| POST | `/api/templates/apply` | Aplicar template al negocio |
| GET | `/api/services` | Servicios del negocio |
| POST | `/api/services` | Crear servicio |
| GET | `/api/services/public/:slug` | Servicios públicos |
| GET | `/api/appointments` | Citas del negocio |
| POST | `/api/appointments` | Crear cita (admin) |
| GET | `/api/appointments/public/:slug/availability` | Disponibilidad |
| POST | `/api/appointments/public/:slug/book` | Reservar cita |
| GET | `/api/whatsapp/webhook` | Verificación webhook Meta |
| POST | `/api/whatsapp/webhook` | Mensajes entrantes |

## Templates disponibles

12 plantillas preconfiguradas con servicios, precios y horarios típicos:

✂️ Barbería · 💅 Salón de Belleza · 🐾 Veterinaria · 🧖 Spa & Masajes  
🦷 Dentista · 🧠 Psicólogo · 🥗 Nutriólogo · 📸 Fotógrafo  
🎨 Tatuador · 🧘 Yoga/Fitness · 📚 Tutor · 🩺 Médico

## Roadmap

- [x] Auth (JWT)
- [x] Templates de industria (12 giros)
- [x] CRUD servicios
- [x] Sistema de citas (admin + público)
- [x] WhatsApp confirmaciones + recordatorios + webhook
- [x] UI completa (picker + auth + dashboard + booking)
- [ ] App móvil React Native
- [ ] Pagos (Stripe / Conekta)
- [ ] Facturación CFDI 4.0
