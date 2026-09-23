import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Area } from "../../areas/repository/area.entity";
import { Routine } from "../../routines/repository/routine.entity";

@Entity("schedule_event")
export class ScheduleEvent {
    @PrimaryGeneratedColumn()
    id_event!: number;

    @Column({ type: "integer" })
    id_schedule!: number;

    @Column({ type: "integer" })
    id_area!: number;

    @ManyToOne(() => Area)
    @JoinColumn({ name: "id_area" })
    area!: Area | null;

    @Column({ type: "integer", nullable: true })
    id_routine!: number | null;

    @ManyToOne(() => Routine, { nullable: true })
    @JoinColumn({ name: "id_routine" })
    routine!: Routine | null;

    @Column({ type: "timestamp" })
    scheduled_at!: Date;

    @Index({ unique: true })
    @Column({ type: "varchar", length: 80 })
    slot_key!: string;

    @Column({ type: "integer", default: 1 })
    status_event!: number;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;
}
