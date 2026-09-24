import envs from "../../../config/environment-vars";
import { ConfigService } from "../../config/service/config.service";
import { IConsentRepository } from "../../privacy/repository/consent.repository";
import { PAUSA_STATUS, PausaRepository } from "../../pausas/repository/pausa.repository";
import {
    ITelemetryRepository,
    TELEMETRY_EVENT,
    TelemetryFilters,
    TelemetryInput,
    TelemetryRecord,
    TelemetrySummaryRow,
} from "../repository/telemetry.repository";
import { TelemetryEventData } from "../validation/telemetry.validation";

export class TelemetryService {
    constructor(
        private readonly telemetryRepo: ITelemetryRepository,
        private readonly pausaRepo: PausaRepository,
        private readonly configService: ConfigService,
        private readonly consentRepo: IConsentRepository
    ) {}

    private async ensureConsent(userId: number): Promise<void> {
        if (!envs.CONSENT_REQUIRED) return;
        const accepted = await this.consentRepo.hasActive(userId);
        if (!accepted) {
            throw new Error("Debes aceptar el consentimiento informado antes de registrar datos de cumplimiento");
        }
    }

    async record(userId: number, data: TelemetryEventData): Promise<number> {
        await this.ensureConsent(userId);
        let idPausa = data.idPausa;

        if (idPausa != null) {
            const pausa = await this.pausaRepo.findById(idPausa);
            if (!pausa) {
                throw new Error("La pausa indicada no existe");
            }
            if (pausa.idUser !== userId) {
                throw new Error("La pausa no pertenece al usuario autenticado");
            }
        } else if (data.type !== TELEMETRY_EVENT.APLAZAMIENTO) {
            idPausa = await this.pausaRepo.create({
                userId,
                routineId: null,
                areaId: data.idArea,
                scheduledAt: data.occurredAt,
                status: PAUSA_STATUS.PROGRAMADA,
            });
        }

        if (data.type === TELEMETRY_EVENT.APLAZAMIENTO && idPausa != null) {
            const config = await this.configService.getConfig();
            const used = await this.telemetryRepo.countByPausaAndType(idPausa, TELEMETRY_EVENT.APLAZAMIENTO);
            if (used >= config.maxPostponements) {
                throw new Error("Se alcanzó el límite máximo de aplazamientos para esta pausa");
            }
        }

        const input: TelemetryInput = {
            idPausa,
            idScheduleEvent: data.idScheduleEvent,
            idArea: data.idArea,
            type: data.type,
            reason: data.reason,
            occurredAt: data.occurredAt,
        };

        const eventId = await this.telemetryRepo.create(userId, input);

        if (idPausa != null) {
            if (data.type === TELEMETRY_EVENT.FIN) {
                await this.pausaRepo.updateStatus(idPausa, {
                    status: PAUSA_STATUS.COMPLETADA,
                    completedAt: data.occurredAt,
                });
            } else if (data.type === TELEMETRY_EVENT.APLAZAMIENTO) {
                await this.pausaRepo.updateStatus(idPausa, { status: PAUSA_STATUS.APLAZADA });
            } else if (data.type === TELEMETRY_EVENT.CANCELACION) {
                await this.pausaRepo.updateStatus(idPausa, { status: PAUSA_STATUS.CANCELADA });
            }
        }

        return eventId;
    }

    async recordBatch(userId: number, items: TelemetryEventData[]): Promise<number> {
        let count = 0;
        for (const item of items) {
            await this.record(userId, item);
            count++;
        }
        return count;
    }

    async listMine(userId: number, filters: TelemetryFilters): Promise<TelemetryRecord[]> {
        return this.telemetryRepo.listByUser(userId, filters);
    }

    async list(filters: TelemetryFilters): Promise<TelemetryRecord[]> {
        return this.telemetryRepo.list(filters);
    }

    async summary(filters: TelemetryFilters): Promise<TelemetrySummaryRow[]> {
        return this.telemetryRepo.summary(filters);
    }
}
