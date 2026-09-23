import { AppDataSource } from "../../../config/data-base";

export interface RetentionCandidate {
    id: number;
    name: string;
    email: string;
    lastActivity: string | null;
}

export interface IPrivacyRepository {
    findRetentionCandidates(cutoff: Date): Promise<RetentionCandidate[]>;
    anonymize(idUser: number): Promise<boolean>;
    erasePersonalData(idUser: number): Promise<boolean>;
}

export class PrivacyRepository implements IPrivacyRepository {
    async findRetentionCandidates(cutoff: Date): Promise<RetentionCandidate[]> {
        const rows = await AppDataSource.query(
            `
            SELECT u.id_user AS id,
                   u.name_user AS name,
                   u.email_user AS email,
                   MAX(e.occurred_at) AS "lastActivity"
            FROM users."user" u
            JOIN users.pausa_event e ON e.id_user = u.id_user
            WHERE u.anonymized_user = false
              AND (u.id_role IS NULL OR u.id_role <> $1)
            GROUP BY u.id_user, u.name_user, u.email_user
            HAVING MAX(e.occurred_at) < $2
            ORDER BY MAX(e.occurred_at) ASC
            `,
            [1, cutoff]
        );

        return rows.map((r: { id: number; name: string; email: string; lastActivity: Date | null }) => ({
            id: Number(r.id),
            name: String(r.name),
            email: String(r.email),
            lastActivity: r.lastActivity ? new Date(r.lastActivity).toISOString() : null,
        }));
    }

    async anonymize(idUser: number): Promise<boolean> {
        const result = await AppDataSource.query(
            `
            UPDATE users."user"
            SET name_user = 'Usuario anónimo #' || id_user,
                photo_user = NULL,
                anonymized_user = true
            WHERE id_user = $1 AND anonymized_user = false
            `,
            [idUser]
        );
        return Array.isArray(result) ? result.length >= 0 : true;
    }

    async erasePersonalData(idUser: number): Promise<boolean> {
        const result = await AppDataSource.query(
            `
            UPDATE users."user"
            SET name_user = 'Usuario eliminado #' || id_user,
                email_user = 'deleted_' || id_user || '@anon.local',
                password_user = '',
                photo_user = NULL,
                status_user = 0,
                anonymized_user = true
            WHERE id_user = $1
            `,
            [idUser]
        );
        return Array.isArray(result) ? result.length >= 0 : true;
    }
}
