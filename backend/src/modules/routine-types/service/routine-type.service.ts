import { IRoutineTypeRepository, RoutineTypeInput, RoutineTypeRecord } from "../repository/routine-type.repository";

export class RoutineTypeService {
    private typeRepo: IRoutineTypeRepository;

    constructor(typeRepo: IRoutineTypeRepository) {
        this.typeRepo = typeRepo;
    }

    async createType(type: RoutineTypeInput): Promise<number> {
        const existing = await this.typeRepo.findByName(type.name);
        if (existing) {
            throw new Error("Ya existe un tipo de rutina con ese nombre");
        }
        return this.typeRepo.create(type);
    }

    async updateType(id: number, type: Partial<RoutineTypeInput>): Promise<boolean> {
        const existing = await this.typeRepo.findById(id);
        if (!existing) {
            throw new Error("Tipo de rutina no encontrado");
        }
        if (type.name) {
            const nameTaken = await this.typeRepo.findByName(type.name);
            if (nameTaken && nameTaken.id !== id) {
                throw new Error("Ya existe otro tipo de rutina con ese nombre");
            }
        }
        return this.typeRepo.update(id, type);
    }

    async deleteType(id: number): Promise<boolean> {
        const existing = await this.typeRepo.findById(id);
        if (!existing) {
            throw new Error("Tipo de rutina no encontrado");
        }
        return this.typeRepo.delete(id);
    }

    async getTypeById(id: number): Promise<RoutineTypeRecord | null> {
        return this.typeRepo.findById(id);
    }

    async getAllTypes(): Promise<RoutineTypeRecord[]> {
        return this.typeRepo.findAll();
    }
}