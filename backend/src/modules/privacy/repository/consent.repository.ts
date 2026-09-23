import { IsNull, Repository } from "typeorm";
import { AppDataSource } from "../../../config/data-base";
import { Consent } from "./consent.entity";

export interface ConsentRecord {
    id: number;
    idUser: number;
    userName: string | null;
    version: string;
    accepted: boolean;
    acceptedAt: string;
    revokedAt: string | null;
    createdAt: string;
}

export interface ConsentStatus {
    accepted: boolean;
    version: string | null;
    acceptedAt: string | null;
    revokedAt: string | null;
}

export interface ConsentFilters {
    userId?: number;
    limit?: number;
}

function toIso(value: Date | string | null | undefined): string | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export interface IConsentRepository {
    accept(userId: number, version: string): Promise<number>;
    findActive(userId: number): Promise<ConsentRecord | null>;
    hasActive(userId: number): Promise<boolean>;
    listByUser(userId: number): Promise<ConsentRecord[]>;
    listAll(filters: ConsentFilters): Promise<ConsentRecord[]>;
    revoke(userId: number): Promise<boolean>;
}

export class ConsentRepository implements IConsentRepository {
    private repo: Repository<Consent>;

    constructor() {
        this.repo = AppDataSource.getRepository(Consent);
    }

    private toRecord(consent: Consent): ConsentRecord {
        return {
            id: consent.id_consent,
            idUser: consent.id_user,
            userName: consent.user?.name_user ?? null,
            version: consent.version_consent,
            accepted: consent.accepted_consent,
            acceptedAt: toIso(consent.accepted_at) ?? "",
            revokedAt: toIso(consent.revoked_at),
            createdAt: toIso(consent.created_at) ?? "",
        };
    }

    async accept(userId: number, version: string): Promise<number> {
        const entity = this.repo.create({
            id_user: userId,
            version_consent: version,
            accepted_consent: true,
            accepted_at: new Date(),
            revoked_at: null,
        });
        const saved = await this.repo.save(entity);
        return saved.id_consent;
    }

    async findActive(userId: number): Promise<ConsentRecord | null> {
        const consent = await this.repo.findOne({
            where: { id_user: userId, accepted_consent: true, revoked_at: IsNull() },
            relations: { user: true },
            order: { accepted_at: "DESC" },
        });
        return consent ? this.toRecord(consent) : null;
    }

    async hasActive(userId: number): Promise<boolean> {
        const count = await this.repo.count({
            where: { id_user: userId, accepted_consent: true, revoked_at: IsNull() },
        });
        return count > 0;
    }

    async listByUser(userId: number): Promise<ConsentRecord[]> {
        const rows = await this.repo.find({
            where: { id_user: userId },
            relations: { user: true },
            order: { accepted_at: "DESC" },
        });
        return rows.map((r) => this.toRecord(r));
    }

    async listAll(filters: ConsentFilters): Promise<ConsentRecord[]> {
        const qb = this.repo
            .createQueryBuilder("c")
            .leftJoinAndSelect("c.user", "user")
            .orderBy("c.accepted_at", "DESC")
            .take(filters.limit ?? 200);

        if (filters.userId !== undefined) {
            qb.andWhere("c.id_user = :userId", { userId: filters.userId });
        }

        const rows = await qb.getMany();
        return rows.map((r) => this.toRecord(r));
    }

    async revoke(userId: number): Promise<boolean> {
        const active = await this.repo.findOne({
            where: { id_user: userId, accepted_consent: true, revoked_at: IsNull() },
            order: { accepted_at: "DESC" },
        });
        if (!active) return false;
        active.revoked_at = new Date();
        await this.repo.save(active);
        return true;
    }
}
