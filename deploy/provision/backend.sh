#!/usr/bin/env bash
# VM de backend (Ubuntu 22.04): instala Node.js, copia la API desde /vagrant/backend,
# genera el .env apuntando a la VM de base de datos y la deja corriendo con systemd.
# Volver a ejecutarlo (vagrant provision backend) redespliega el código nuevo.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

APP_DIR=/opt/activate/backend
APP_USER=activate

echo "==> [backend] Instalando Node.js 22 y utilidades"
apt-get update -qq
apt-get install -y -qq curl ca-certificates rsync postgresql-client
if ! command -v node >/dev/null || ! node -v | grep -q '^v22'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi
node -v

id -u "${APP_USER}" >/dev/null 2>&1 || useradd --system --create-home --home-dir /opt/activate --shell /usr/sbin/nologin "${APP_USER}"

echo "==> [backend] Copiando código (sin node_modules ni .env del anfitrión)"
mkdir -p "${APP_DIR}"
rsync -a --delete \
  --exclude node_modules --exclude dist --exclude uploads --exclude .env \
  /vagrant/backend/ "${APP_DIR}/"

cd "${APP_DIR}"
echo "==> [backend] Instalando dependencias"
npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# El .env se genera una sola vez para conservar el secreto JWT y las claves push entre redespliegues
if [ ! -f .env ]; then
  echo "==> [backend] Generando .env"
  JWT_SECRET=$(openssl rand -hex 48)
  VAPID_JSON=$(npx --yes web-push generate-vapid-keys --json)
  VAPID_PUBLIC_KEY=$(node -e "console.log(JSON.parse(process.argv[1]).publicKey)" "${VAPID_JSON}")
  VAPID_PRIVATE_KEY=$(node -e "console.log(JSON.parse(process.argv[1]).privateKey)" "${VAPID_JSON}")
  cat > .env <<ENV
PORT=3000
NODE_ENV=production
DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=1h
BCRYPT_ROUNDS=12
CORS_ORIGIN=*
TRUST_PROXY=1
MEDIA_UPLOAD_DIR=./uploads
MEDIA_MAX_FILE_SIZE_MB=200
APP_TIMEZONE=America/Bogota
SCHEDULER_ENABLED=true
CONSENT_REQUIRED=false
FRONTEND_URL=${FRONTEND_URL}
SMTP_HOST=
VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}
VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}
VAPID_SUBJECT=mailto:admin@pausas.com
ENV
  chmod 600 .env
fi

mkdir -p uploads
chown -R "${APP_USER}:${APP_USER}" /opt/activate

echo "==> [backend] Esperando a la base de datos en ${DB_HOST}:5432"
for _ in $(seq 1 30); do
  pg_isready -h "${DB_HOST}" -p 5432 -q && break
  sleep 2
done
pg_isready -h "${DB_HOST}" -p 5432

echo "==> [backend] Registrando el servicio systemd"
# Se ejecuta con tsx: el build de tsc deja imports ESM sin extensión que Node no resuelve
cat > /etc/systemd/system/activate-backend.service <<UNIT
[Unit]
Description=ACTIVATE Pausas Saludables - API
After=network-online.target
Wants=network-online.target

[Service]
User=${APP_USER}
WorkingDirectory=${APP_DIR}
ExecStart=${APP_DIR}/node_modules/.bin/tsx src/index.ts
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable activate-backend
systemctl restart activate-backend

echo "==> [backend] Comprobando /api/health"
for _ in $(seq 1 30); do
  curl -fs http://localhost:3000/api/health && echo && exit 0
  sleep 2
done
echo "La API no respondió. Revisa: sudo journalctl -u activate-backend -n 50" >&2
exit 1
