# ================================================================
# AgendaMX — Setup WhatsApp + Cron en producción (DigitalOcean)
# ================================================================

## 1. Meta WhatsApp Business API — Configuración

### Crear la App en Meta for Developers
1. Ve a https://developers.facebook.com
2. Crear app → Tipo: Business
3. Agregar producto: WhatsApp
4. En WhatsApp > API Setup:
   - Copia tu `Phone Number ID`
   - Copia tu `Access Token` (temporal) o genera uno permanente
5. Configura el número de teléfono de producción

### Variables de entorno (.env en el servidor)
```
WHATSAPP_TOKEN=tu_access_token_permanente
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=pon_aqui_cualquier_string_secreto
```

### Configurar Webhook en Meta
1. En WhatsApp > Configuration > Webhook
2. Callback URL: `https://api.agendamx.net/api/whatsapp/webhook`
3. Verify token: el mismo que pusiste en `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
4. Suscribir a: `messages`

### Plantillas de mensajes (para 24h+ sin respuesta previa)
Meta exige plantillas aprobadas para iniciar conversación.
Crear en WhatsApp > Message Templates:

**Plantilla: appointment_reminder**
```
Hola {{1}}, te recordamos tu cita mañana:
📋 {{2}}
🕐 {{3}}
🏪 {{4}}

Responde SÍ para confirmar o NO para cancelar.
```

**Plantilla: appointment_confirmation**
```
¡Hola {{1}}! Tu cita está confirmada ✅
📋 {{2}} • {{3}} • ${{4}} MXN
Te esperamos en {{5}} 😊
```

---

## 2. Crontab — Recordatorios automáticos

### En el servidor DigitalOcean, configurar crontab:
```bash
crontab -e
```

### Agregar estas líneas:
```cron
# AgendaMX — Recordatorios WhatsApp (cada 15 minutos)
*/15 * * * * /usr/bin/node /var/www/agendamx/backend/src/jobs/reminders.js >> /var/log/agendamx-reminders.log 2>&1

# AgendaMX — Limpiar logs viejos (cada domingo a medianoche)
0 0 * * 0 find /var/log/agendamx-*.log -mtime +30 -delete
```

### Verificar que corre:
```bash
# Probar manualmente
node /var/www/agendamx/backend/src/jobs/reminders.js

# Ver logs en tiempo real
tail -f /var/log/agendamx-reminders.log
```

---

## 3. PM2 — Proceso del servidor

### Instalar PM2
```bash
npm install -g pm2
```

### Iniciar el API
```bash
cd /var/www/agendamx/backend
pm2 start src/index.js --name agendamx-api
pm2 save
pm2 startup  # Para que arranque solo al reiniciar el servidor
```

### Comandos útiles
```bash
pm2 status            # Ver todos los procesos
pm2 logs agendamx-api # Ver logs en tiempo real
pm2 restart agendamx-api
pm2 monit             # Dashboard en terminal
```

---

## 4. Nginx — Reverse proxy

```nginx
server {
    listen 80;
    server_name api.agendamx.net;

    location / {
        proxy_pass         http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header   X-Real-IP $remote_addr;
    }
}
```

```bash
# SSL gratis con Let's Encrypt
certbot --nginx -d api.agendamx.net
```

---

## 5. Flujo completo de una cita

```
Cliente abre link → agendamx.net/barberia-don-carlos
    ↓
Elige servicio → fecha → hora → datos
    ↓
POST /api/appointments/public/barberia-don-carlos/book
    ↓
Backend guarda en PostgreSQL
    ↓
WA automático al cliente → "✅ ¡Cita confirmada! ..."
WA automático al dueño  → "📅 Nueva cita: María García..."
    ↓
Cron cada 15 min revisa:
    → 24h antes: "⏰ Recordatorio, responde SÍ o NO"
    → 1h antes:  "🔔 Tu cita es en 1 hora"
    → 2h después: "⭐ ¿Cómo estuvo tu cita?"
    ↓
Cliente responde "SÍ" → webhook actualiza status → confirmed
Cliente responde "NO" → webhook cancela → dueño recibe aviso
```
