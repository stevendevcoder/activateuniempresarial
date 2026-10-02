import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("password_reset")
export class PasswordReset {
    @PrimaryGeneratedColumn()
    id_reset!: number;

    @Column({ type: "integer" })
    id_user!: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "id_user" })
    user!: User;

    /** SHA-256 del token enviado por correo: el token en claro nunca se guarda. */
    @Column({ type: "character varying", length: 64, unique: true })
    token_hash!: string;

    @Column({ type: "timestamptz" })
    expires_at!: Date;

    @Column({ type: "timestamptz", nullable: true })
    used_at!: Date | null;

    @CreateDateColumn({ type: "timestamptz" })
    created_at!: Date;
}
