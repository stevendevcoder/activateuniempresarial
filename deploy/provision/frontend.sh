#!/usr/bin/env bash
# VM de frontend (CentOS Stream 9): compila Angular y lo sirve con Nginx.
# Nginx también reenvía /api a la VM del backend, así el navegador solo habla con esta VM.
# Volver a ejecutarlo (vagrant provision frontend) redespliega el código nuevo.
set -euo pipefail

BUILD_DIR=/opt/activate/frontend
WEB_ROOT=/usr/share/nginx/html

echo "==> [frontend] Instalando Node.js 20, Nginx y utilidades"
if ! command -v node >/dev/null; then
  dnf -y -q module enable nodejs:20
  dnf -y -q install nodejs npm
fi
dnf -y -q install nginx rsync policycoreutils-python-utils
node -v

echo "==> [frontend] Copiando código (sin node_modules ni builds del anfitrión)"
mkdir -p "${BUILD_DIR}"
rsync -a --delete \
  --exclude node_modules --exclude dist --exclude .angular \
  /vagrant/frontend/ "${BUILD_DIR}/"

cd "${BUILD_DIR}"
echo "==> [frontend] Instalando dependencias y compilando (tarda unos minutos)"
npm ci --no-audit --no-fund || npm install --no-audit --no-fund
NODE_OPTIONS=--max-old-space-size=1536 NG_CLI_ANALYTICS=false \
  npx ng build --configuration production

echo "==> [frontend] Publicando en ${WEB_ROOT}"
rsync -a --delete dist/activate/browser/ "${WEB_ROOT}/"
restorecon -R "${WEB_ROOT}" || true

echo "==> [frontend] Configurando Nginx (proxy /api -> ${BACKEND_URL})"
sed "s#__BACKEND_URL__#${BACKEND_URL}#g" /vagrant/deploy/nginx/nginx.conf > /etc/nginx/nginx.conf
nginx -t

# SELinux bloquea por defecto que Nginx abra conexiones hacia otra máquina
if command -v getenforce >/dev/null && [ "$(getenforce)" != "Disabled" ]; then
  setsebool -P httpd_can_network_connect 1
fi

if systemctl is-active --quiet firewalld; then
  firewall-cmd --quiet --permanent --add-service=http
  firewall-cmd --quiet --reload
fi

systemctl enable nginx
systemctl restart nginx

echo "==> [frontend] Comprobando el proxy hacia el backend"
curl -fs http://localhost/api/health && echo || echo "Aviso: el backend (${BACKEND_URL}) todavía no responde; el frontend sí quedó publicado"
echo "==> [frontend] Listo: http://192.168.56.10  o  http://localhost:8080"
