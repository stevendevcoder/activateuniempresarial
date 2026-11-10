#!/usr/bin/env bash
# VM de base de datos (Debian 12): instala PostgreSQL, lo abre a la red privada
# y carga el esquema y los datos de prueba de /vagrant/db la primera vez.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "==> [db] Instalando PostgreSQL"
apt-get update -qq
apt-get install -y -qq postgresql postgresql-contrib

PG_VERSION=$(ls /etc/postgresql | sort -V | tail -1)
PG_CONF_DIR="/etc/postgresql/${PG_VERSION}/main"

echo "==> [db] Escuchando en todas las interfaces y permitiendo ${ALLOWED_NET}"
sudo -u postgres psql -qc "ALTER SYSTEM SET listen_addresses = '*';"
HBA_LINE="host    ${DB_NAME}    ${DB_USER}    ${ALLOWED_NET}    scram-sha-256"
grep -qF "${HBA_LINE}" "${PG_CONF_DIR}/pg_hba.conf" || echo "${HBA_LINE}" >> "${PG_CONF_DIR}/pg_hba.conf"
systemctl restart postgresql
systemctl enable postgresql

echo "==> [db] Creando usuario y base de datos"
sudo -u postgres psql -v ON_ERROR_STOP=1 -q <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
SQL
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
fi

# Los scripts se ejecutan como el dueño de la base para que las tablas le pertenezcan
export PGPASSWORD="${DB_PASSWORD}"
PSQL=(psql -h 127.0.0.1 -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q)

if [ "$("${PSQL[@]}" -tAc "SELECT to_regclass('users.role') IS NOT NULL")" = "t" ]; then
  echo "==> [db] El esquema ya existe: no se vuelve a cargar"
else
  echo "==> [db] Cargando esquema y datos de prueba"
  "${PSQL[@]}" -f /vagrant/db/01_schema.sql
  "${PSQL[@]}" -f /vagrant/db/02_seed.sql
fi

echo "==> [db] Listo. Tablas en el esquema users:"
"${PSQL[@]}" -c "\dt users.*"
