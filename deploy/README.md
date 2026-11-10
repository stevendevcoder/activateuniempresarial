# Despliegue en 3 máquinas virtuales (Vagrant + VirtualBox)

Cada capa de la aplicación corre en su propia VM, con su propio sistema operativo, y se comunican por una red privada:

```
            Navegador (anfitrión)
       http://192.168.56.30  ó  http://localhost:8080
                     │
                     ▼
 ┌────────────────────────────────────┐
 │ frontend · CentOS Stream 9         │  Nginx :80
 │ 192.168.56.30                      │  - sirve el build de Angular
 │                                    │  - reenvía /api/* al backend
 └──────────────────┬─────────────────┘
                    │ HTTP :3000
                    ▼
 ┌────────────────────────────────────┐
 │ backend · Ubuntu 22.04             │  Node.js 22 + Express (systemd)
 │ 192.168.56.20                      │  servicio: activate-backend
 └──────────────────┬─────────────────┘
                    │ PostgreSQL :5432
                    ▼
 ┌────────────────────────────────────┐
 │ db · Debian 12                     │  PostgreSQL 15
 │ 192.168.56.10                      │  base pausas_activas, esquema users
 └────────────────────────────────────┘
```

El navegador solo habla con el frontend. Nginx hace de *reverse proxy* hacia el backend, así no hay problemas de CORS y la IP del backend no queda escrita en el código de Angular.

## Archivos

| Archivo | Qué hace |
|---|---|
| `Vagrantfile` | Define las 3 VMs: box, IP, memoria y scripts de aprovisionamiento embebidos |
| `provision/*.sh` | Scripts de referencia separados para DB, backend y frontend; el `Vagrantfile` actual usa sus versiones embebidas |
| `nginx/nginx.conf` | Configuración de referencia de Nginx; el `Vagrantfile` genera la configuración durante el aprovisionamiento |

## Requisitos (en el computador anfitrión)

1. **VirtualBox 7.x** — <https://www.virtualbox.org/wiki/Downloads>
2. **Vagrant 2.4.2 o superior** — <https://developer.hashicorp.com/vagrant/install> (las versiones viejas no reconocen VirtualBox 7.1)
3. Virtualización activada en la BIOS (VT-x / AMD-V).
4. Unos **5 GB de RAM libres** (1 GB db + 1.5 GB backend + 2 GB frontend) y ~10 GB de disco.
5. Internet la primera vez (descarga de boxes y paquetes npm).

En Windows, si VirtualBox va muy lento o se queda en "Booting VM...", suele ser Hyper-V. Desactívalo con PowerShell como administrador y reinicia:

```powershell
bcdedit /set hypervisorlaunchtype off
```

(Para volver a usar WSL2/Docker después: `bcdedit /set hypervisorlaunchtype auto`.)

## Puesta en marcha

```bash
git clone <repo> && cd activateuniempresarial
git checkout feature/videos-recuperacion-push

cd deploy
# Opcional pero recomendado: descargar las boxes antes (son ~500 MB-1 GB cada una)
vagrant box add debian/bookworm64 --provider virtualbox
vagrant box add ubuntu/jammy64 --provider virtualbox
vagrant box add generic/centos9s --provider virtualbox

vagrant up          # levanta db -> backend -> frontend, en ese orden (15-25 min la primera vez)
vagrant status
```

Abre **http://localhost:8080** (o http://192.168.56.30) e ingresa con:

- Administrador: `admin@pausas.com` / `admin123`
- Trabajador: `trabajador@pausas.com` / `demo123`

> Las notificaciones push del navegador solo funcionan en `localhost:8080`: los navegadores exigen HTTPS o `localhost` para los service workers.

### Levantar una sola VM

```bash
vagrant up db                 # solo la base de datos
vagrant up db backend         # base de datos + API
```

El backend espera a que la BD responda; el frontend se publica aunque el backend no esté arriba (solo muestra un aviso).

## Comandos útiles

| Acción | Comando |
|---|---|
| Entrar a una VM | `vagrant ssh db` · `vagrant ssh backend` · `vagrant ssh frontend` |
| Redesplegar después de cambiar código | `vagrant provision backend` · `vagrant provision frontend` |
| Apagar sin borrar | `vagrant halt` |
| Volver a encender (ya aprovisionadas, ~2 min) | `vagrant up` |
| Borrar todo y empezar de cero | `vagrant destroy -f` y luego `vagrant up` |

Dentro de cada VM:

```bash
# db
sudo systemctl status postgresql
sudo -u postgres psql -d pausas_activas -c "\dt users.*"

# backend
sudo systemctl status activate-backend
sudo journalctl -u activate-backend -f          # logs en vivo
curl http://localhost:3000/api/health
PGPASSWORD=pausas_admin psql -h 192.168.56.10 -U pausas_admin -d pausas_activas -c "select count(*) from users.\"user\""

# frontend
sudo systemctl status nginx
curl http://localhost/api/health                 # pasa por Nginx hasta el backend
sudo tail -f /var/log/nginx/access.log
```

## Problemas frecuentes

| Síntoma | Causa / solución |
|---|---|
| `$'\r': command not found` al aprovisionar | El `.sh` quedó con saltos de línea de Windows. El repo tiene `.gitattributes` para evitarlo; si pasa, vuelve a clonar o ejecuta `git add --renormalize . && git checkout -- deploy` |
| `VBoxManage: error: ... host-only` / IP no permitida | VirtualBox solo permite por defecto 192.168.56.0/21. No cambies el rango de IPs |
| Frontend: `npm` termina con `Killed` | Falta RAM para compilar Angular. Cierra programas o sube `vb.memory` del frontend a 3072 |
| `502 Bad Gateway` en el navegador | El backend está caído: `vagrant ssh backend` → `sudo journalctl -u activate-backend -n 50` |
| Backend: `ECONNREFUSED 192.168.56.10:5432` | La VM db está apagada: `vagrant up db` |
| La página carga pero el login falla | Prueba `curl http://192.168.56.20:3000/api/health` desde el anfitrión para saber si el problema es Nginx o la API |

## Datos

La VM de base de datos arranca con los datos de prueba de `db/02_seed.sql`. Si quieren mostrar datos que tengan en local:

```bash
# En el computador con los datos (PostgreSQL local en el puerto 5433)
pg_dump -h localhost -p 5433 -U pausas_admin -d pausas_activas --data-only -n users > db/datos.sql
# Luego, en la VM db (la carpeta del repo está en /vagrant)
PGPASSWORD=pausas_admin psql -h 127.0.0.1 -U pausas_admin -d pausas_activas -f /vagrant/db/datos.sql
```

(Si choca con los datos del seed, primero vacía las tablas o haz `vagrant destroy -f db` y omite el seed.)
