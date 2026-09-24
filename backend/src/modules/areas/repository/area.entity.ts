import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../auth/repository/user.entity";

@Entity("area")
export class Area {
    @PrimaryGeneratedColumn()
    id_area!: number;

    @Column({ type: "character varying", length: 255 })
    name_area!: string;

    @Column({ type: "character varying", length: 255, default: "" })
    description_area!: string;

    @Column({ type: "integer", nullable: true })
    id_responsible_user!: number | null;

    @ManyToOne(() => User)
    @JoinColumn({ name: "id_responsible_user" })
    responsible!: User | null;

    @Column({ type: "integer", default: 1 })
    status_area!: number;
}