import { Repository } from "typeorm";
import { AppDataSource } from "../../../config/data-base";
import { RoutineType } from "./routine-type.entity";

export interface RoutineTypeRecord {
    id: number;
    name: string;
    description: string;
    icon: string;
    color: string;
    status: number;
}

export type RoutineTypeInput = Omit<RoutineTypeRecord, "id">;

export interface IRoutineTypeRepository {
    create(type: RoutineTypeInput): Promise<number>;
    update(id: number, type: Partial<RoutineTypeInput>): Promise<boolean>;
    delete(id: number): Promise<boolean>;
    findById(id: number): Promise<RoutineTypeRecord | null>;
    findByName(name: string): Promise<RoutineTypeRecord | null>;
    findAll(): Promise<RoutineTypeRecord[]>;
}

export class RoutineTypeRepository implements IRoutineTypeRepository {
    private repo: Repository<RoutineType>;

    constructor() {
        this.repo = AppDataSource.getRepository(RoutineType);
    }

    private toRecord(type: RoutineType): RoutineTypeRecord {
        return {
            id: type.id_routine_type,
            name: type.name_routine_type,
            description: type.description_routine_type,
            icon: type.icon_routine_type,
            color: type.color_routine_type,
            status: type.status_routine_type,
        };
    }

    private toEntity(type: RoutineTypeInput): RoutineType {
        const entity = new RoutineType();
        entity.name_routine_type = type.name;
        entity.description_routine_type = type.description;
        entity.icon_routine_type = type.icon;
        entity.color_routine_type = type.color;
        entity.status_routine_type = type.status;
        return entity;
    }

    async create(type: RoutineTypeInput): Promise<number> {
        const saved = await this.repo.save(this.toEntity(type));
        return saved.id_routine_type;
    }

    async update(id: number, type: Partial<RoutineTypeInput>): Promise<boolean> {
        const existing = await this.repo.findOne({ where: { id_routine_type: id } });
        if (!existing) return false;

        Object.assign(existing, {
            name_routine_type: type.name ?? existing.name_routine_type,
            description_routine_type: type.description ?? existing.description_routine_type,
            icon_routine_type: type.icon ?? existing.icon_routine_type,
            color_routine_type: type.color ?? existing.color_routine_type,
            status_routine_type: type.status ?? existing.status_routine_type,
        });

        await this.repo.save(existing);
        return true;
    }

    async delete(id: number): Promise<boolean> {
        const existing = await this.repo.findOne({ where: { id_routine_type: id } });
        if (!existing) return false;

        existing.status_routine_type = 0;
        await this.repo.save(existing);
        return true;
    }

    async findById(id: number): Promise<RoutineTypeRecord | null> {
        const type = await this.repo.findOne({ where: { id_routine_type: id } });
        return type ? this.toRecord(type) : null;
    }

    async findByName(name: string): Promise<RoutineTypeRecord | null> {
        const type = await this.repo.findOne({ where: { name_routine_type: name } });
        return type ? this.toRecord(type) : null;
    }

    async findAll(): Promise<RoutineTypeRecord[]> {
        const types = await this.repo.find({ order: { name_routine_type: "ASC" } });
        return types.map((t) => this.toRecord(t));
    }
}