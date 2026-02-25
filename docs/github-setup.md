# AgendaMX — Subir a GitHub desde tu Mac
# Tiempo estimado: 10 minutos

## PASO 1 — Crear el repositorio en GitHub

1. Ve a https://github.com/new
2. Repository name: `agendamx`
3. Description: `SaaS de agendamiento de citas para negocios mexicanos con WhatsApp nativo`
4. Visibility: **Private** (por ahora)
5. ⚠️ NO marques "Add a README file" ni ningún otro checkbox
6. Clic en **Create repository**

GitHub te mostrará una página vacía con instrucciones.
Copia la URL que aparece, se ve así:
`https://github.com/TU_USUARIO/agendamx.git`

---

## PASO 2 — Copiar el proyecto de este chat a tu Mac

El código está en esta sesión de Claude. Para pasarlo a tu Mac,
Claude te generará un zip con todos los archivos.

(Ver instrucción en el chat)

---

## PASO 3 — Comandos en tu terminal (Mac)

```bash
# Navega a donde descomprimiste el proyecto
cd ~/Desktop/agendamx    # o donde lo hayas puesto

# Configura tu usuario de git (solo la primera vez)
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"

# Conectar con GitHub (reemplaza TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/agendamx.git

# Subir el código
git push -u origin main
```

GitHub te pedirá tus credenciales la primera vez.
Si tienes autenticación de dos factores (recomendado), necesitas
usar un Personal Access Token en lugar de tu contraseña.

---

## PASO 4 — Personal Access Token (si te pide contraseña)

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Scope: marca **repo** (acceso completo a repositorios)
4. Expiration: 90 days o No expiration
5. Copia el token — solo se muestra una vez
6. Úsalo como "contraseña" cuando git te la pida

---

## PASO 5 — Verificar que quedó bien

```bash
git log --oneline   # Debe mostrar: beada61 feat: initial commit — AgendaMX v0.1
git remote -v       # Debe mostrar la URL de tu repo en GitHub
```

Ve a https://github.com/TU_USUARIO/agendamx
Deberías ver los 52 archivos y el README con toda la documentación.

---

## Flujo de trabajo de ahora en adelante

```bash
# Después de cada sesión de trabajo con Claude:
git add .
git commit -m "feat: descripción de lo que agregaste"
git push

# Para ver qué cambió:
git status
git diff
```

---

## Ramas recomendadas

```
main        → código en producción (siempre funcional)
develop     → desarrollo activo
feature/X   → features nuevos (mobile, pagos, etc.)
```

Para crear y cambiar a una rama:
```bash
git checkout -b develop
git push -u origin develop
```
