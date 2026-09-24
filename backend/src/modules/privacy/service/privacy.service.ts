import { ConfigService } from "../../config/service/config.service";
import { ConsentFilters, ConsentRecord, ConsentStatus, IConsentRepository } from "../repository/consent.repository";
import { IPrivacyRepository, RetentionCandidate } from "../repository/privacy.repository";

export const CONSENT_VERSION = "1.0";

export interface RetentionPreview {
    retentionMonths: number;
    cutoff: string;
    candidates: RetentionCandidate[];
}

export class PrivacyService {
    constructor(
        private readonly consentRepo: IConsentRepository,
        private readonly privacyRepo: IPrivacyRepository,
        private readonly configService: ConfigService
    ) {}

    async getConsentStatus(userId: number): Promise<ConsentStatus> {
        const active = await this.consentRepo.findActive(userId);
        if (!active) {
            return { accepted: false, version: null, acceptedAt: null, revokedAt: null };
        }
        return {
            accepted: true,
            version: active.version,
            acceptedAt: active.acceptedAt,
            revokedAt: active.revokedAt,
        };
    }

    async acceptConsent(userId: number, version: string): Promise<ConsentRecord> {
        await this.consentRepo.accept(userId, version);
        const active = await this.consentRepo.findActive(userId);
        if (!active) {
            throw new Error("No se pudo registrar el consentimiento");
        }
        return active;
    }

    async revokeConsent(userId: number): Promise<boolean> {
        return this.consentRepo.revoke(userId);
    }

    async listConsents(filters: ConsentFilters): Promise<ConsentRecord[]> {
        return this.consentRepo.listAll(filters);
    }

    async requestDataDeletion(userId: number): Promise<void> {
        await this.consentRepo.revoke(userId);
        await this.privacyRepo.erasePersonalData(userId);
    }

    private cutoffDate(retentionMonths: number): Date {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - retentionMonths);
        return cutoff;
    }

    async retentionPreview(): Promise<RetentionPreview> {
        const config = await this.configService.getConfig();
        const cutoff = this.cutoffDate(config.retentionMonths);
        const candidates = await this.privacyRepo.findRetentionCandidates(cutoff);
        return {
            retentionMonths: config.retentionMonths,
            cutoff: cutoff.toISOString(),
            candidates,
        };
    }

    async runRetention(): Promise<{ anonymized: number; cutoff: string }> {
        const config = await this.configService.getConfig();
        const cutoff = this.cutoffDate(config.retentionMonths);
        const candidates = await this.privacyRepo.findRetentionCandidates(cutoff);

        let anonymized = 0;
        for (const candidate of candidates) {
            await this.privacyRepo.anonymize(candidate.id);
            anonymized++;
        }
        return { anonymized, cutoff: cutoff.toISOString() };
    }
}
