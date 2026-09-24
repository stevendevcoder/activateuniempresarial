import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "../../roles/repository/role.entity";
import { Area } from "../../areas/repository/area.entity";

@Entity("user")
export class User {
    @PrimaryGeneratedColumn()
    id_user!: number;

    @Column({ type: "character varying", length: 255 })
    name_user!: string;

    @Column({ type: "character varying", length: 255, unique: true })
    email_user!: string;

    @Column({ type: "character varying", length: 255 })
    password_user!: string;

    @Column({ type: "integer", default: 1 })
    status_user!: number;

    @Column({ type: "integer", nullable: true })
    id_role!: number | null;

    @ManyToOne(() => Role)
    @JoinColumn({ name: "id_role" })
    role!: Role | null;

    @Column({ type: "integer", nullable: true })
    id_area!: number | null;

    @ManyToOne(() => Area)
    @JoinColumn({ name: "id_area" })
    area!: Area | null;

    @Column({ type: "character varying", length: 500, nullable: true })
    photo_user!: string | null;

    @Column({ type: "boolean", default: false })
    anonymized_user!: boolean;
}