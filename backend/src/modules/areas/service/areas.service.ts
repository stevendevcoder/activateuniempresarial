import { IAreaRepository, AreaInput, AreaRecord } from "../repository/area.repository";
import { IUserRepository } from "../../auth/repository/user.repository";

export class AreasService {
    private areaRepo: IAreaRepository;
    private userRepo: IUserRepository;

    constructor(areaRepo: IAreaRepository, userRepo: IUserRepository) {
        this.areaRepo = areaRepo;
        this.userRepo = userRepo;
    }

    private async validateResponsible(idResponsible: number | null): Promise<void> {
        if (idResponsible == null) return;

        const user = await this.userRepo.findById(idResponsible);
        if (!user) {
            throw new Error("El responsable indicado no existe");
        }
        if (user.status !== 1) {
            throw new Error("El responsable indicado está inactivo");
        }
    }

    async createArea(area: AreaInput): Promise<number> {
        const existing = await this.areaRepo.findByName(area.name);
        if (existing) {
            throw new Error("Ya existe un área con ese nombre");
        }
        await this.validateResponsible(area.idResponsible);
        return this.areaRepo.create(area);
    }

    async updateArea(id: number, area: Partial<AreaInput>): Promise<boolean> {
        const existing = await this.areaRepo.findById(id);
        if (!existing) {
            throw new Error("Área no encontrada");
        }
        if (area.name) {
            const nameTaken = await this.areaRepo.findByName(area.name);
            if (nameTaken && nameTaken.id !== id) {
                throw new Error("Ya existe otra área con ese nombre");
            }
        }
        if (area.idResponsible !== undefined) {
            await this.validateResponsible(area.idResponsible);
        }
        return this.areaRepo.update(id, area);
    }

    async deleteArea(id: number): Promise<boolean> {
        const existing = await this.areaRepo.findById(id);
        if (!existing) {
            throw new Error("Área no encontrada");
        }
        return this.areaRepo.delete(id);
    }

    async getAreaById(id: number): Promise<AreaRecord | null> {
        return this.areaRepo.findById(id);
    }

    async getAllAreas(): Promise<AreaRecord[]> {
        return this.areaRepo.findAllWithCounts();
    }
}