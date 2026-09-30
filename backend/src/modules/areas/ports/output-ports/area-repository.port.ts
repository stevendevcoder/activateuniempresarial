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
