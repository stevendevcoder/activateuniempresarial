export const ADMIN_ROLE_NAME = "Administrador";
export const WORKER_ROLE_NAME = "Trabajador";

export const PERMISSIONS = {
    users: {
        create: "users:create",
        read: "users:read",
        update: "users:update",
        delete: "users:delete",
    },
    roles: {
        create: "roles:create",
        read: "roles:read",
        update: "roles:update",
        delete: "roles:delete",
        assign: "roles:assign",
    },
    areas: {
        create: "areas:create",
        read: "areas:read",
        update: "areas:update",
        delete: "areas:delete",
    },
    media: {
        create: "media:create",
        read: "media:read",
        update: "media:update",
        delete: "media:delete",
    },
    routineTypes: {
        create: "routine-types:create",
        read: "routine-types:read",
        update: "routine-types:update",
        delete: "routine-types:delete",
    },
    routines: {
        create: "routines:create",
        read: "routines:read",
        update: "routines:update",
        delete: "routines:delete",
    },
    analytics: {
        read: "analytics:read",
        export: "analytics:export",
    },
    config: {
        read: "config:read",
        update: "config:update",
    },
    schedules: {
        create: "schedules:create",
        read: "schedules:read",
        update: "schedules:update",
        delete: "schedules:delete",
    },
    telemetry: {
        create: "telemetry:create",
        read: "telemetry:read",
    },
    privacy: {
        read: "privacy:read",
        manage: "privacy:manage",
    },
} as const;