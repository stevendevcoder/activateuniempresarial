import { Repository } from "typeorm";
import { AppDataSource } from "../../../config/data-base";
import { Area } from "./area.entity";
import { User } from "../../auth/repository/user.entity";

export interface AreaRecord {
    id: number;
    name: string;
    description: string;
    idResponsible: number | null;
    responsibleName: string | null;
    status: number;
    workerCount: number;
}

export type AreaInput = Omit<AreaRecord, "id" | "responsibleName" | "workerCount">;

export interface IAreaRepository {
    create(area: AreaInput): Promise<number>;
    update(id: number, area: Partial<AreaInput>): Promise<boolean>;
    delete(id: number): Promise<boolean>;
    findById(id: number): Promise<AreaRecord | null>;
    findByName(name: string): Promise<AreaRecord | null>;
    findAllWithCounts(): Promise<AreaRecord[]>;
}

export class AreaRepository implements IAreaRepository {
    private repo: Repository<Area>;

    constructor() {
        this.repo = AppDataSource.getRepository(Area);
    }

    private toRecord(area: Area, workerCount = 0): AreaRecord {
        return {
            id: area.id_area,
            name: area.name_area,
            description: area.description_area,
            idResponsible: area.id_responsible_user,
            responsibleName: area.responsible?.name_user ?? null,
            status: area.status_area,
            workerCount,
        };
    }

    private toEntity(area: AreaInput): Area {
        const entity = new Area();
        entity.name_area = area.name;
        entity.description_area = area.description;
        entity.id_responsible_user = area.idResponsible;
        entity.status_area = area.status;
        return entity;
    }

    async create(area: AreaInput): Promise<number> {
        const saved = await this.repo.save(this.toEntity(area));
        return saved.id_area;
    }

    async update(id: number, area: Partial<AreaInput>): Promise<boolean> {
        const existing = await this.repo.findOne({ where: { id_area: id } });
        if (!existing) return false;

        Object.assign(existing, {
            name_area: area.name ?? existing.name_area,
            description_area: area.description ?? existing.description_area,
            id_responsible_user: area.idResponsible !== undefined ? area.idResponsible : existing.id_responsible_user,
            status_area: area.status ?? existing.status_area,
        });

        await this.repo.save(existing);
        return true;
    }

    async delete(id: number): Promise<boolean> {
        const existing = await this.repo.findOne({ where: { id_area: id } });
        if (!existing) return false;

        existing.status_area = 0;
        await this.repo.save(existing);
        return true;
    }

    async findById(id: number): Promise<AreaRecord | null> {
        const area = await this.repo.findOne({
            where: { id_area: id },
            relations: { responsible: true },
        });
        return area ? this.toRecord(area) : null;
    }

    async findByName(name: string): Promise<AreaRecord | null> {
        const area = await this.repo.findOne({
            where: { name_area: name },
            relations: { responsible: true },
        });
        return area ? this.toRecord(area) : null;
    }

    async findAllWithCounts(): Promise<AreaRecord[]> {
        const areas = await this.repo.find({
            relations: { responsible: true },
            order: { name_area: "ASC" },
        });

        const countRows = await this.repo
            .createQueryBuilder()
            .select("area.id_area", "id_area")
            .addSelect("COUNT(area.id_user)::int", "worker_count")
            .from(User, "area")
            .where("area.status_user = :status", { status: 1 })
            .andWhere("area.id_area IS NOT NULL")
            .groupBy("area.id_area")
            .getRawMany<{ id_area: number; worker_count: number }>();

        const countMap = new Map<number, number>(
            countRows.map((row) => [row.id_area, row.worker_count])
        );

        return areas.map((area) => this.toRecord(area, countMap.get(area.id_area) ?? 0));
    }
}