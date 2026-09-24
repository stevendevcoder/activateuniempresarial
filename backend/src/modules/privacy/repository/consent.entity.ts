import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../auth/repository/user.entity";

@Entity("consent")
export class Consent {
    @PrimaryGeneratedColumn()
    id_consent!: number;

    @Index()
    @Column({ type: "integer" })
    id_user!: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "id_user" })
    user!: User | null;

    @Column({ type: "varchar", length: 20, default: "1.0" })
    version_consent!: string;

    @Column({ type: "boolean", default: true })
    accepted_consent!: boolean;

    @Column({ type: "timestamp" })
    accepted_at!: Date;

    @Column({ type: "timestamp", nullable: true })
    revoked_at!: Date | null;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;
}
