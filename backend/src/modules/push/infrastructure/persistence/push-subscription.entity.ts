import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../../auth/infrastructure/persistence/user.entity";

/** Suscripción Web Push de un navegador/dispositivo de un usuario. */
@Entity("push_subscription")
export class PushSubscription {
    @PrimaryGeneratedColumn()
    id_subscription!: number;

    @Column({ type: "integer" })
    id_user!: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "id_user" })
    user!: User;

    @Column({ type: "text", unique: true })
    endpoint!: string;

    @Column({ type: "character varying", length: 255 })
    p256dh!: string;

    @Column({ type: "character varying", length: 255 })
    auth!: string;

    @Column({ type: "character varying", length: 255, nullable: true })
    user_agent!: string | null;

    @CreateDateColumn({ type: "timestamptz" })
    created_at!: Date;
}
