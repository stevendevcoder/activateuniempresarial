import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../auth/repository/user.entity";
import { Routine } from "../../routines/repository/routine.entity";
import { Area } from "../../areas/repository/area.entity";

@Entity("pausa")
export class Pausa {
    @PrimaryGeneratedColumn()
    id_pausa!: number;

    @Column({ type: "integer" })
    id_user!: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "id_user" })
    user!: User | null;

    @Column({ type: "integer", nullable: true })
    id_routine!: number | null;

    @ManyToOne(() => Routine, { nullable: true })
    @JoinColumn({ name: "id_routine" })
    routine!: Routine | null;

    @Column({ type: "integer", nullable: true })
    id_area!: number | null;

    @ManyToOne(() => Area, { nullable: true })
    @JoinColumn({ name: "id_area" })
    area!: Area | null;

    @Column({ type: "timestamp" })
    scheduled_at!: Date;

    @Column({ type: "timestamp", nullable: true })
    completed_at!: Date | null;

    @Column({ type: "integer", default: 1 })
    status_pausa!: number;
}