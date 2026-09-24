import path from "path";
import fs from "fs/promises";
import bcrypt from "bcryptjs";
import envs from "../../../config/environment-vars";
import { AVATAR_UPLOAD_DIR } from "../../../config/media";
import { IUserRepository, UserRecord } from "../../auth/repository/user.repository";
import { IRoutineRepository } from "../../routines/repository/routine.repository";
import {
    PAUSA_STATUS,
    PausaRecord,
    PausaRepository,
    PausaStatus,
    UserHistoryFilters,
} from "../../pausas/repository/pausa.repository";

const DAY_MS = 86400000;

function toUtcStart(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysBetween(a: Date, b: Date): number {
    return Math.round((toUtcStart(b).getTime() - toUtcStart(a).getTime()) / DAY_MS);
}

function computeStreaks(dayStrings: string[]): { current: number; best: number } {
    const days = [...new Set(dayStrings)]
        .filter((d) => d && !Number.isNaN(new Date(d).getTime()))
        .map((d) => toUtcStart(new Date(d)))
        .sort((a, b) => a.getTime() - b.getTime());

    if (days.length === 0) {
        return { current: 0, best: 0 };
    }

    let best = 0;
    let run = 0;
    let prev: Date | null = null;
    for (const day of days) {
        run = prev !== null && daysBetween(prev, day) === 1 ? run + 1 : 1;
        best = Math.max(best, run);
        prev = day;
    }

    const today = toUtcStart(new Date());
    const last = days[days.length - 1];
    if (last === undefined) {
        return { current: 0, best };
    }

    let current = 0;
    if (daysBetween(last, today) === 0 || daysBetween(last, today) === 1) {
        current = 1;
        for (let i = days.length - 2; i >= 0; i--) {
            const previous = days[i];
            const next = days[i + 1];
            if (previous === undefined || next === undefined) break;
            if (daysBetween(previous, next) === 1) {
                current += 1;
            } else {
                break;
            }
        }
    }

    return { current, best };
}

export class PortalService {
    constructor(
        private readonly pausaRepo: PausaRepository,
        private readonly userRepo: IUserRepository,
        private readonly routineRepo: IRoutineRepository
    ) {}

    async history(userId: number, filters: UserHistoryFilters): Promise<{ items: PausaRecord[]; total: number }> {
        const [items, total] = await Promise.all([
            this.pausaRepo.findByUser(userId, filters),
            this.pausaRepo.countByUser(userId, filters),
        ]);
        return { items, total };
    }

    async streak(userId: number): Promise<{ current: number; best: number; totalCompleted: number }> {
        const [days, stats] = await Promise.all([
            this.pausaRepo.completionDays(userId),
            this.pausaRepo.userStats(userId),
        ]);
        const { current, best } = computeStreaks(days);
        return { current, best, totalCompleted: stats.completadas };
    }

    async stats(userId: number) {
        const [stats, days, weeklyCompleted, memberSince] = await Promise.all([
            this.pausaRepo.userStats(userId),
            this.pausaRepo.completionDays(userId),
            this.pausaRepo.completedInLastDays(userId, 7),
            this.pausaRepo.firstActivity(userId),
        ]);
        const { current, best } = computeStreaks(days);
        return { ...stats, currentStreak: current, bestStreak: best, weeklyCompleted, memberSince };
    }

    async register(userId: number, input: { routineId: number | null; scheduledAt?: string; status?: PausaStatus }): Promise<PausaRecord> {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new Error("Usuario no encontrado");
        }

        if (input.routineId) {
            const routine = await this.routineRepo.findById(input.routineId);
            if (!routine) {
                throw new Error("La rutina indicada no existe");
            }
            if (routine.status !== 1) {
                throw new Error("La rutina indicada está inactiva");
            }
        }

        const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : new Date();
        if (Number.isNaN(scheduledAt.getTime())) {
            throw new Error("La fecha programada no es válida");
        }

        const status = input.status ?? PAUSA_STATUS.COMPLETADA;
        const pausaId = await this.pausaRepo.create({
            userId,
            routineId: input.routineId,
            areaId: user.idArea,
            scheduledAt,
            completedAt: status === PAUSA_STATUS.COMPLETADA ? scheduledAt : null,
            status,
        });

        const created = await this.pausaRepo.findById(pausaId);
        if (!created) {
            throw new Error("No se pudo registrar la pausa");
        }
        return created;
    }

    async updateStatus(userId: number, pausaId: number, status: PausaStatus): Promise<PausaRecord> {
        const pausa = await this.pausaRepo.findById(pausaId);
        if (!pausa) {
            throw new Error("Pausa no encontrada");
        }
        if (pausa.idUser !== userId) {
            throw new Error("No tienes permisos sobre esta pausa");
        }

        const completedAt = status === PAUSA_STATUS.COMPLETADA ? new Date() : null;
        await this.pausaRepo.updateStatus(pausaId, { status, completedAt });

        const updated = await this.pausaRepo.findById(pausaId);
        if (!updated) {
            throw new Error("No se pudo actualizar la pausa");
        }
        return updated;
    }

    async updateProfile(userId: number, input: { name?: string; password?: string; currentPassword?: string }): Promise<UserRecord> {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new Error("Usuario no encontrado");
        }

        const patch: Partial<UserRecord> = {};
        if (input.name !== undefined) {
            patch.name = input.name;
        }
        if (input.password) {
            if (!input.currentPassword) {
                throw new Error("Debes confirmar tu contraseña actual");
            }
            const match = await bcrypt.compare(input.currentPassword, user.password);
            if (!match) {
                throw new Error("La contraseña actual es incorrecta");
            }
            patch.password = await bcrypt.hash(input.password, envs.BCRYPT_ROUNDS);
        }

        if (Object.keys(patch).length === 0) {
            return user;
        }

        await this.userRepo.update(userId, patch);
        const updated = await this.userRepo.findById(userId);
        if (!updated) {
            throw new Error("No se pudo actualizar el perfil");
        }
        return updated;
    }

    async updatePhoto(userId: number, fileName: string): Promise<string> {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new Error("Usuario no encontrado");
        }

        const photoUrl = `/api/uploads/avatars/${fileName}`;
        await this.userRepo.update(userId, { photo: photoUrl });

        if (user.photo && user.photo.includes("/api/uploads/avatars/")) {
            const oldFileName = path.basename(user.photo);
            await fs.unlink(path.join(AVATAR_UPLOAD_DIR, oldFileName)).catch(() => undefined);
        }

        return photoUrl;
    }
}