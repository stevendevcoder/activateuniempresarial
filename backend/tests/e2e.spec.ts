import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";

const BASE = "http://localhost:3999";

let adminToken = "";
let workerToken = "";
let workerId = 0;

function daysAgo(n: number): string {
    return new Date(Date.now() - n * 86400000).toISOString();
}

describe("EP08/EP09 — Analytics & Portal", () => {
    it("login admin", async () => {
        const res = await request(BASE)
            .post("/api/login")
            .send({ email: "admin@pausas.com", password: "admin123" });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        adminToken = res.body.token;
    });

    it("GET /api/health", async () => {
        const res = await request(BASE).get("/api/health");
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ok");
    });

    it("GET /me (admin)", async () => {
        const res = await request(BASE)
            .get("/api/me")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.role).toBe("Administrador");
    });

    it("no password leak en respuestas", async () => {
        const res = await request(BASE)
            .get("/api/users")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        for (const user of res.body) {
            expect(user.password).toBeUndefined();
        }
    });

    it("crear area", async () => {
        const res = await request(BASE)
            .post("/api/areas")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ name: "Tecnología", description: "Equipo de desarrollo", status: 1 });
        expect([200, 201, 409]).toContain(res.status);
    });

    it("crear trabajador", async () => {
        const email = `worker${Date.now()}@test.com`;
        const res = await request(BASE)
            .post("/api/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ name: "Trabajador Test", email, password: "worker123", status: 1, idRole: 2, idArea: 1 });
        expect(res.status).toBe(201);
        workerId = res.body.userId;
    });

    it("login trabajador", async () => {
        const email = `worker${Date.now()}@test.com`;
        await request(BASE)
            .post("/api/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ name: "Worker Login", email, password: "worker123", status: 1, idRole: 2, idArea: 1 });

        const res = await request(BASE)
            .post("/api/login")
            .send({ email, password: "worker123" });
        expect(res.status).toBe(200);
        workerToken = res.body.token;
    });

    it("registrar pausas (historial)", async () => {
        const statuses = ["completada", "completada", "completada", "aplazada", "completada", "completada"];
        for (let i = 0; i < statuses.length; i++) {
            const res = await request(BASE)
                .post("/api/me/pauses")
                .set("Authorization", `Bearer ${workerToken}`)
                .send({ scheduledAt: daysAgo(i), status: statuses[i] });
            expect(res.status).toBe(201);
        }
    });

    it("GET /me/stats", async () => {
        const res = await request(BASE)
            .get("/api/me/stats")
            .set("Authorization", `Bearer ${workerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.completadas).toBeGreaterThanOrEqual(5);
        expect(res.body.currentStreak).toBeGreaterThanOrEqual(3);
    });

    it("GET /me/streak", async () => {
        const res = await request(BASE)
            .get("/api/me/streak")
            .set("Authorization", `Bearer ${workerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.current).toBeGreaterThanOrEqual(3);
    });

    it("GET /me/pauses paginado", async () => {
        const res = await request(BASE)
            .get("/api/me/pauses?limit=3")
            .set("Authorization", `Bearer ${workerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.items.length).toBe(3);
        expect(res.body.total).toBeGreaterThanOrEqual(6);
    });

    it("RBAC: trabajador NO accede a analytics", async () => {
        const res = await request(BASE)
            .get("/api/analytics/summary")
            .set("Authorization", `Bearer ${workerToken}`);
        expect(res.status).toBe(403);
    });

    it("GET /analytics/summary", async () => {
        const res = await request(BASE)
            .get("/api/analytics/summary")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.total).toBeGreaterThanOrEqual(6);
        expect(res.body.complianceRate).toBeGreaterThan(0);
    });

    it("GET /analytics/timeline", async () => {
        const res = await request(BASE)
            .get("/api/analytics/timeline?granularity=day")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it("GET /analytics/areas", async () => {
        const res = await request(BASE)
            .get("/api/analytics/areas")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it("GET /analytics/users", async () => {
        const res = await request(BASE)
            .get("/api/analytics/users")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        const worker = res.body.find((u: { idUser: number }) => u.idUser === workerId);
        expect(worker).toBeDefined();
        expect(worker.total).toBeGreaterThanOrEqual(6);
        expect(worker.password).toBeUndefined();
    });

    it("GET /analytics/export/pdf", async () => {
        const res = await request(BASE)
            .get("/api/analytics/export/pdf")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toContain("pdf");
        expect(res.body.length).toBeGreaterThan(500);
    });

    it("GET /analytics/export/xlsx", async () => {
        const res = await request(BASE)
            .get("/api/analytics/export/xlsx")
            .set("Authorization", `Bearer ${adminToken}`)
            .buffer(true)
            .parse((response, callback) => {
                const chunks: Buffer[] = [];
                response.on("data", (chunk: Buffer) => chunks.push(chunk));
                response.on("end", () => callback(null, Buffer.concat(chunks)));
            });
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toContain("spreadsheetml");
        expect(res.body.length).toBeGreaterThan(500);
    });

    it("PUT /me/profile", async () => {
        const res = await request(BASE)
            .put("/api/me/profile")
            .set("Authorization", `Bearer ${workerToken}`)
            .send({ name: "Worker Updated" });
        expect(res.status).toBe(200);
        expect(res.body.user.name).toBe("Worker Updated");
        expect(res.body.user.password).toBeUndefined();
    });

    it("PUT /me/profile sin contraseña actual rechaza cambio de password", async () => {
        const res = await request(BASE)
            .put("/api/me/profile")
            .set("Authorization", `Bearer ${workerToken}`)
            .send({ password: "newpass123" });
        expect(res.status).toBe(400);
    });
});

describe("EP15 — Configuración global e institucional", () => {
    let adminToken15 = "";
    let holidayId = 0;
    const holidayDate = "2099-01-15";

    it("login admin", async () => {
        const res = await request(BASE)
            .post("/api/login")
            .send({ email: "admin@pausas.com", password: "admin123" });
        expect(res.status).toBe(200);
        adminToken15 = res.body.token;
    });

    it("GET /api/config devuelve parámetros globales", async () => {
        const res = await request(BASE)
            .get("/api/config")
            .set("Authorization", `Bearer ${adminToken15}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("lunchStart");
        expect(res.body).toHaveProperty("lunchEnd");
        expect(res.body).toHaveProperty("maxPostponements");
        expect(res.body).toHaveProperty("dashboardMode");
    });

    it("PUT /api/config rechaza formato de hora inválido", async () => {
        const res = await request(BASE)
            .put("/api/config")
            .set("Authorization", `Bearer ${adminToken15}`)
            .send({ lunchStart: "99:99" });
        expect(res.status).toBe(400);
    });

    it("PUT /api/config rechaza fin anterior al inicio", async () => {
        const res = await request(BASE)
            .put("/api/config")
            .set("Authorization", `Bearer ${adminToken15}`)
            .send({ lunchStart: "14:00", lunchEnd: "12:00" });
        expect(res.status).toBe(400);
    });

    it("PUT /api/config actualiza maxPostponements", async () => {
        const res = await request(BASE)
            .put("/api/config")
            .set("Authorization", `Bearer ${adminToken15}`)
            .send({ maxPostponements: 4 });
        expect(res.status).toBe(200);
        expect(res.body.config.maxPostponements).toBe(4);

        await request(BASE)
            .put("/api/config")
            .set("Authorization", `Bearer ${adminToken15}`)
            .send({ maxPostponements: 2 });
    });

    it("crear festivo", async () => {
        const res = await request(BASE)
            .post("/api/config/holidays")
            .set("Authorization", `Bearer ${adminToken15}`)
            .send({ date: holidayDate, name: "Festivo de prueba", recurring: false });
        expect([201, 409]).toContain(res.status);
        if (res.status === 201) holidayId = res.body.holidayId;
    });

    it("GET /api/config/holidays incluye el festivo", async () => {
        const res = await request(BASE)
            .get("/api/config/holidays")
            .set("Authorization", `Bearer ${adminToken15}`);
        expect(res.status).toBe(200);
        expect(res.body.some((h: { date: string }) => h.date === holidayDate)).toBe(true);
    });

    it("eliminar festivo", async () => {
        if (!holidayId) return;
        const res = await request(BASE)
            .delete(`/api/config/holidays/${holidayId}`)
            .set("Authorization", `Bearer ${adminToken15}`);
        expect(res.status).toBe(200);
    });

    it("RBAC: sin token no accede a config", async () => {
        const res = await request(BASE).get("/api/config");
        expect(res.status).toBe(401);
    });
});

describe("EP12 — Motor de programación", () => {
    let adminToken12 = "";
    let scheduleId = 0;
    let areaId = 0;

    it("login admin", async () => {
        const res = await request(BASE)
            .post("/api/login")
            .send({ email: "admin@pausas.com", password: "admin123" });
        expect(res.status).toBe(200);
        adminToken12 = res.body.token;
    });

    it("crear área para el cronograma", async () => {
        const res = await request(BASE)
            .post("/api/areas")
            .set("Authorization", `Bearer ${adminToken12}`)
            .send({ name: `Área EP12 ${Date.now()}`, description: "Test scheduling", status: 1 });
        expect(res.status).toBe(201);
        areaId = res.body.areaId;
    });

    it("POST /api/schedules crea el cronograma", async () => {
        const res = await request(BASE)
            .post("/api/schedules")
            .set("Authorization", `Bearer ${adminToken12}`)
            .send({
                idArea: areaId,
                startTime: "00:00",
                endTime: "23:59",
                frequencyMinutes: 5,
                durationMinutes: 5,
                daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                status: 1,
            });
        expect(res.status).toBe(201);
        scheduleId = res.body.scheduleId;
    });

    it("POST /api/schedules duplicado por área devuelve 409", async () => {
        const res = await request(BASE)
            .post("/api/schedules")
            .set("Authorization", `Bearer ${adminToken12}`)
            .send({ idArea: areaId, startTime: "08:00", endTime: "18:00" });
        expect(res.status).toBe(409);
    });

    it("GET /api/schedules incluye el cronograma", async () => {
        const res = await request(BASE)
            .get("/api/schedules")
            .set("Authorization", `Bearer ${adminToken12}`);
        expect(res.status).toBe(200);
        expect(res.body.some((s: { id: number }) => s.id === scheduleId)).toBe(true);
    });

    it("PUT /api/schedules actualiza la frecuencia", async () => {
        const res = await request(BASE)
            .put(`/api/schedules/${scheduleId}`)
            .set("Authorization", `Bearer ${adminToken12}`)
            .send({ frequencyMinutes: 10 });
        expect(res.status).toBe(200);
    });

    it("PATCH pause y resume", async () => {
        const pause = await request(BASE)
            .patch(`/api/schedules/${scheduleId}/pause`)
            .set("Authorization", `Bearer ${adminToken12}`);
        expect(pause.status).toBe(200);

        const get1 = await request(BASE)
            .get(`/api/schedules/${scheduleId}`)
            .set("Authorization", `Bearer ${adminToken12}`);
        expect(get1.body.paused).toBe(true);

        const resume = await request(BASE)
            .patch(`/api/schedules/${scheduleId}/resume`)
            .set("Authorization", `Bearer ${adminToken12}`);
        expect(resume.status).toBe(200);
    });

    it("POST /api/schedules/run emite eventos", async () => {
        const config = await request(BASE)
            .get("/api/config")
            .set("Authorization", `Bearer ${adminToken12}`);
        const originalLunch = { start: config.body.lunchStart, end: config.body.lunchEnd };

        await request(BASE)
            .put("/api/config")
            .set("Authorization", `Bearer ${adminToken12}`)
            .send({ lunchStart: "00:00", lunchEnd: "00:01" });

        const run = await request(BASE)
            .post("/api/schedules/run")
            .set("Authorization", `Bearer ${adminToken12}`);
        expect(run.status).toBe(200);
        expect(typeof run.body.emitted).toBe("number");
        expect(run.body.emitted).toBeGreaterThanOrEqual(1);

        const runAgain = await request(BASE)
            .post("/api/schedules/run")
            .set("Authorization", `Bearer ${adminToken12}`);
        expect(runAgain.body.emitted).toBe(0);

        await request(BASE)
            .put("/api/config")
            .set("Authorization", `Bearer ${adminToken12}`)
            .send({ lunchStart: originalLunch.start, lunchEnd: originalLunch.end });
    });

    it("GET /api/schedules/events lista los eventos emitidos", async () => {
        const res = await request(BASE)
            .get(`/api/schedules/events?areaId=${areaId}`)
            .set("Authorization", `Bearer ${adminToken12}`);
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it("RBAC: trabajador NO puede crear cronograma", async () => {
        const email = `sched_worker${Date.now()}@test.com`;
        await request(BASE)
            .post("/api/users")
            .set("Authorization", `Bearer ${adminToken12}`)
            .send({ name: "Sched Worker", email, password: "worker123", status: 1, idRole: 2, idArea: areaId });
        const login = await request(BASE).post("/api/login").send({ email, password: "worker123" });
        const workerToken = login.body.token;

        const res = await request(BASE)
            .post("/api/schedules")
            .set("Authorization", `Bearer ${workerToken}`)
            .send({ idArea: areaId, startTime: "08:00", endTime: "18:00" });
        expect(res.status).toBe(403);
    });

    it("eliminar cronograma de prueba", async () => {
        const res = await request(BASE)
            .delete(`/api/schedules/${scheduleId}`)
            .set("Authorization", `Bearer ${adminToken12}`);
        expect(res.status).toBe(200);
    });
});

describe("EP13 — Telemetría y cumplimiento", () => {
    let adminToken13 = "";
    let workerToken13 = "";
    let pausaId = 0;

    it("login admin", async () => {
        const res = await request(BASE)
            .post("/api/login")
            .send({ email: "admin@pausas.com", password: "admin123" });
        adminToken13 = res.body.token;
        expect(res.status).toBe(200);
    });

    it("crear y loguear trabajador", async () => {
        const email = `telem${Date.now()}@test.com`;
        await request(BASE)
            .post("/api/users")
            .set("Authorization", `Bearer ${adminToken13}`)
            .send({ name: "Telemetry Worker", email, password: "worker123", status: 1, idRole: 2, idArea: 1 });
        const res = await request(BASE).post("/api/login").send({ email, password: "worker123" });
        expect(res.status).toBe(200);
        workerToken13 = res.body.token;
    });

    it("registrar evento de inicio crea la pausa", async () => {
        const res = await request(BASE)
            .post("/api/telemetry/events")
            .set("Authorization", `Bearer ${workerToken13}`)
            .send({ type: 1, idArea: 1 });
        expect(res.status).toBe(201);
        expect(res.body.eventId).toBeGreaterThan(0);
    });

    it("el evento de inicio queda con idPausa asociado", async () => {
        const res = await request(BASE)
            .get("/api/telemetry/events/me?type=1")
            .set("Authorization", `Bearer ${workerToken13}`);
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        pausaId = res.body[0].idPausa;
        expect(pausaId).toBeGreaterThan(0);
    });

    it("cancelación sin motivo es rechazada", async () => {
        const res = await request(BASE)
            .post("/api/telemetry/events")
            .set("Authorization", `Bearer ${workerToken13}`)
            .send({ type: 4, idPausa: pausaId });
        expect(res.status).toBe(400);
    });

    it("aplazamiento respeta el límite máximo (EP15)", async () => {
        for (let i = 0; i < 2; i++) {
            const res = await request(BASE)
                .post("/api/telemetry/events")
                .set("Authorization", `Bearer ${workerToken13}`)
                .send({ type: 3, idPausa: pausaId });
            expect(res.status).toBe(201);
        }
        const over = await request(BASE)
            .post("/api/telemetry/events")
            .set("Authorization", `Bearer ${workerToken13}`)
            .send({ type: 3, idPausa: pausaId });
        expect(over.status).toBe(409);
    });

    it("registrar evento de fin marca la pausa como completada", async () => {
        const res = await request(BASE)
            .post("/api/telemetry/events")
            .set("Authorization", `Bearer ${workerToken13}`)
            .send({ type: 2, idPausa: pausaId });
        expect(res.status).toBe(201);
    });

    it("ingesta por lote", async () => {
        const res = await request(BASE)
            .post("/api/telemetry/events/batch")
            .set("Authorization", `Bearer ${workerToken13}`)
            .send([{ type: 1, idArea: 1 }, { type: 2 }]);
        expect(res.status).toBe(201);
        expect(res.body.count).toBe(2);
    });

    it("admin lista la telemetría", async () => {
        const res = await request(BASE)
            .get("/api/telemetry/events")
            .set("Authorization", `Bearer ${adminToken13}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it("admin obtiene el resumen por tipo", async () => {
        const res = await request(BASE)
            .get("/api/telemetry/summary")
            .set("Authorization", `Bearer ${adminToken13}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((r: { typeLabel: string }) => r.typeLabel === "fin")).toBe(true);
    });

    it("RBAC: trabajador NO accede a la telemetría global", async () => {
        const res = await request(BASE)
            .get("/api/telemetry/events")
            .set("Authorization", `Bearer ${workerToken13}`);
        expect(res.status).toBe(403);
    });
});

describe("EP16 — Habeas Data y privacidad", () => {
    let adminToken16 = "";
    let workerToken16 = "";
    let retentionWorkerId = 0;
    let retentionWorkerToken = "";

    it("login admin", async () => {
        const res = await request(BASE)
            .post("/api/login")
            .send({ email: "admin@pausas.com", password: "admin123" });
        adminToken16 = res.body.token;
        expect(res.status).toBe(200);
    });

    it("crear y loguear trabajador", async () => {
        const email = `privacy${Date.now()}@test.com`;
        await request(BASE)
            .post("/api/users")
            .set("Authorization", `Bearer ${adminToken16}`)
            .send({ name: "Privacy Worker", email, password: "worker123", status: 1, idRole: 2, idArea: 1 });
        const res = await request(BASE).post("/api/login").send({ email, password: "worker123" });
        workerToken16 = res.body.token;
        expect(res.status).toBe(200);
    });

    it("sin consentimiento el estado es no aceptado", async () => {
        const res = await request(BASE)
            .get("/api/me/consent")
            .set("Authorization", `Bearer ${workerToken16}`);
        expect(res.status).toBe(200);
        expect(res.body.accepted).toBe(false);
    });

    it("aceptar consentimiento informado (HU-16.1)", async () => {
        const res = await request(BASE)
            .post("/api/me/consent")
            .set("Authorization", `Bearer ${workerToken16}`)
            .send({ version: "1.0" });
        expect(res.status).toBe(201);
        expect(res.body.consent.accepted).toBe(true);
    });

    it("el estado refleja el consentimiento aceptado", async () => {
        const res = await request(BASE)
            .get("/api/me/consent")
            .set("Authorization", `Bearer ${workerToken16}`);
        expect(res.body.accepted).toBe(true);
        expect(res.body.version).toBe("1.0");
    });

    it("revocar consentimiento", async () => {
        const res = await request(BASE)
            .delete("/api/me/consent")
            .set("Authorization", `Bearer ${workerToken16}`);
        expect(res.status).toBe(200);
        const status = await request(BASE)
            .get("/api/me/consent")
            .set("Authorization", `Bearer ${workerToken16}`);
        expect(status.body.accepted).toBe(false);
    });

    it("admin lista los consentimientos", async () => {
        const res = await request(BASE)
            .get("/api/privacy/consents")
            .set("Authorization", `Bearer ${adminToken16}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it("RBAC: trabajador NO accede a la lista de consentimientos", async () => {
        const res = await request(BASE)
            .get("/api/privacy/consents")
            .set("Authorization", `Bearer ${workerToken16}`);
        expect(res.status).toBe(403);
    });

    it("PUT /api/config acepta retentionMonths (HU-16.2)", async () => {
        const res = await request(BASE)
            .put("/api/config")
            .set("Authorization", `Bearer ${adminToken16}`)
            .send({ retentionMonths: 1 });
        expect(res.status).toBe(200);
        expect(res.body.config.retentionMonths).toBe(1);
    });

    it("retención anonimiza actividad antigua (HU-16.2)", async () => {
        const email = `retention${Date.now()}@test.com`;
        const created = await request(BASE)
            .post("/api/users")
            .set("Authorization", `Bearer ${adminToken16}`)
            .send({ name: "Retention Worker", email, password: "worker123", status: 1, idRole: 2, idArea: 1 });
        retentionWorkerId = created.body.userId;

        const login = await request(BASE).post("/api/login").send({ email, password: "worker123" });
        retentionWorkerToken = login.body.token;

        const twoYearsAgo = new Date(Date.now() - 730 * 86400000).toISOString();
        await request(BASE)
            .post("/api/telemetry/events")
            .set("Authorization", `Bearer ${retentionWorkerToken}`)
            .send({ type: 1, idArea: 1, occurredAt: twoYearsAgo });

        const preview = await request(BASE)
            .get("/api/privacy/retention/preview")
            .set("Authorization", `Bearer ${adminToken16}`);
        expect(preview.status).toBe(200);
        expect(preview.body.candidates.some((c: { id: number }) => c.id === retentionWorkerId)).toBe(true);

        const run = await request(BASE)
            .post("/api/privacy/retention/run")
            .set("Authorization", `Bearer ${adminToken16}`);
        expect(run.status).toBe(200);
        expect(run.body.anonymized).toBeGreaterThanOrEqual(1);

        const previewAfter = await request(BASE)
            .get("/api/privacy/retention/preview")
            .set("Authorization", `Bearer ${adminToken16}`);
        expect(previewAfter.body.candidates.some((c: { id: number }) => c.id === retentionWorkerId)).toBe(false);

        await request(BASE)
            .put("/api/config")
            .set("Authorization", `Bearer ${adminToken16}`)
            .send({ retentionMonths: 24 });
    });

    it("exportables soportan modo anonimizado (HU-16.3)", async () => {
        const pdf = await request(BASE)
            .get("/api/analytics/export/pdf?anonymous=true")
            .set("Authorization", `Bearer ${adminToken16}`);
        expect(pdf.status).toBe(200);
        expect(pdf.headers["content-type"]).toContain("pdf");

        const xlsx = await request(BASE)
            .get("/api/analytics/export/xlsx?anonymous=true")
            .set("Authorization", `Bearer ${adminToken16}`)
            .buffer(true)
            .parse((response, callback) => {
                const chunks: Buffer[] = [];
                response.on("data", (chunk: Buffer) => chunks.push(chunk));
                response.on("end", () => callback(null, Buffer.concat(chunks)));
            });
        expect(xlsx.status).toBe(200);
        expect(xlsx.body.length).toBeGreaterThan(500);
    });

    it("trabajador solicita eliminación de sus datos (HU-16.4)", async () => {
        const res = await request(BASE)
            .post("/api/me/data-deletion")
            .set("Authorization", `Bearer ${workerToken16}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toContain("eliminados");
    });
});
