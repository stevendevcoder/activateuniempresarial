import bcrypt from "bcryptjs";
import { AppDataSource } from "./data-base";
import { Role } from "../modules/roles/repository/role.entity";
import { Permission } from "../modules/roles/repository/permission.entity";
import { User } from "../modules/auth/repository/user.entity";
import { ADMIN_ROLE_NAME, WORKER_ROLE_NAME } from "./permissions";
import envs from "./environment-vars";

const ADMIN_EMAIL = "admin@pausas.com";
const ADMIN_PASSWORD = "admin123";

const PERMISSION_CATALOG: { name: string; module: string; description: string }[] = [
    { name: "users:create", module: "users", description: "Crear usuarios" },
    { name: "users:read", module: "users", description: "Consultar usuarios" },
    { name: "users:update", module: "users", description: "Editar usuarios" },
    { name: "users:delete", module: "users", description: "Inactivar usuarios" },
    { name: "roles:create", module: "roles", description: "Crear roles" },
    { name: "roles:read", module: "roles", description: "Consultar roles" },
    { name: "roles:update", module: "roles", description: "Editar roles" },
    { name: "roles:delete", module: "roles", description: "Eliminar roles" },
    { name: "roles:assign", module: "roles", description: "Asignar permisos a roles" },
    { name: "areas:create", module: "areas", description: "Crear áreas" },
    { name: "areas:read", module: "areas", description: "Consultar áreas" },
    { name: "areas:update", module: "areas", description: "Editar áreas" },
    { name: "areas:delete", module: "areas", description: "Eliminar áreas" },
    { name: "media:create", module: "media", description: "Subir videos" },
    { name: "media:read", module: "media", description: "Consultar y previsualizar videos" },
    { name: "media:update", module: "media", description: "Editar o reemplazar videos" },
    { name: "media:delete", module: "media", description: "Eliminar videos" },
    { name: "routine-types:create", module: "routine-types", description: "Crear tipos de rutina" },
    { name: "routine-types:read", module: "routine-types", description: "Consultar tipos de rutina" },
    { name: "routine-types:update", module: "routine-types", description: "Editar tipos de rutina" },
    { name: "routine-types:delete", module: "routine-types", description: "Eliminar tipos de rutina" },
    { name: "routines:create", module: "routines", description: "Crear rutinas" },
    { name: "routines:read", module: "routines", description: "Consultar rutinas" },
    { name: "routines:update", module: "routines", description: "Editar rutinas" },
    { name: "routines:delete", module: "routines", description: "Eliminar rutinas" },
    { name: "analytics:read", module: "analytics", description: "Consultar analítica y dashboard" },
    { name: "analytics:export", module: "analytics", description: "Exportar informes PDF/Excel" },
    { name: "config:read", module: "config", description: "Consultar configuración global y festivos" },
    { name: "config:update", module: "config", description: "Editar configuración global y festivos" },
    { name: "schedules:create", module: "schedules", description: "Crear cronogramas de pausas" },
    { name: "schedules:read", module: "schedules", description: "Consultar cronogramas y eventos" },
    { name: "schedules:update", module: "schedules", description: "Editar, pausar y reanudar cronogramas" },
    { name: "schedules:delete", module: "schedules", description: "Eliminar cronogramas" },
    { name: "telemetry:create", module: "telemetry", description: "Registrar eventos de cumplimiento" },
    { name: "telemetry:read", module: "telemetry", description: "Consultar telemetría y métricas" },
    { name: "privacy:read", module: "privacy", description: "Consultar consentimientos y retención" },
    { name: "privacy:manage", module: "privacy", description: "Aplicar políticas de retención y anonimización" },
];

const WORKER_PERMISSIONS = [
    "routines:read",
    "media:read",
    "config:read",
    "schedules:read",
    "telemetry:create",
];

export async function bootstrapData(): Promise<void> {
    const roleRepo = AppDataSource.getRepository(Role);
    const permissionRepo = AppDataSource.getRepository(Permission);
    const userRepo = AppDataSource.getRepository(User);

    if (PERMISSION_CATALOG.length > 0) {
        await permissionRepo.upsert(
            PERMISSION_CATALOG.map((p) =>
                permissionRepo.create({
                    name_permission: p.name,
                    module_permission: p.module,
                    description_permission: p.description,
                })
            ),
            ["name_permission"]
        );
    }

    let adminRole = await roleRepo.findOne({ where: { name_role: ADMIN_ROLE_NAME } });
    if (!adminRole) {
        adminRole = await roleRepo.save(
            roleRepo.create({
                name_role: ADMIN_ROLE_NAME,
                description_role: "Acceso total a la administración del sistema",
                status_role: 1,
            })
        );
    }

    let workerRole = await roleRepo.findOne({ where: { name_role: WORKER_ROLE_NAME } });
    if (!workerRole) {
        workerRole = await roleRepo.save(
            roleRepo.create({
                name_role: WORKER_ROLE_NAME,
                description_role: "Usuario final que consume las pausas activas",
                status_role: 1,
            })
        );
    }

    const allPermissions = await permissionRepo.find();
    adminRole.permissions = allPermissions;
    await roleRepo.save(adminRole);

    workerRole.permissions = allPermissions.filter((p) => WORKER_PERMISSIONS.includes(p.name_permission));
    await roleRepo.save(workerRole);

    let adminUser = await userRepo.findOne({ where: { email_user: ADMIN_EMAIL } });
    if (!adminUser) {
        const hash = await bcrypt.hash(ADMIN_PASSWORD, envs.BCRYPT_ROUNDS);
        adminUser = userRepo.create({
            name_user: "Admin Pausas Activas",
            email_user: ADMIN_EMAIL,
            password_user: hash,
            status_user: 1,
            id_role: adminRole.id_role,
            id_area: null,
        });
        await userRepo.save(adminUser);
    } else if (adminUser.id_role == null) {
        adminUser.id_role = adminRole.id_role;
        await userRepo.save(adminUser);
    }

    if (envs.NODE_ENV !== "production") {
        console.log(`[bootstrap] Usuario administrador disponible -> ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    }
}