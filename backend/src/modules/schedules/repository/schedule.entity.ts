import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn } from "typeorm";
import { Area } from "../../areas/repository/area.entity";
import { Routine } from "../../routines/repository/routine.entity";

@Entity("schedule")
export class Schedule {
    @PrimaryGeneratedColumn()
    id_schedule!: number;

    @Column({ type: "integer", unique: true })
    id_area!: number;

    @ManyToOne(() => Area)
    @JoinColumn({ name: "id_area" })
    area!: Area | null;

    @Column({ type: "integer", nullable: true })
    id_routine!: number | null;

    @ManyToOne(() => Routine, { nullable: true })
    @JoinColumn({ name: "id_routine" })
    routine!: Routine | null;

    @Column({ type: "varchar", length: 5 })
    start_time!: string;

    @Column({ type: "varchar", length: 5 })
    end_time!: string;

    @Column({ type: "integer", default: 120 })
    frequency_minutes!: number;

    @Column({ type: "integer", default: 5 })
    duration_minutes!: number;

    @Column({ type: "varchar", length: 20, default: "1,2,3,4,5" })
    days_of_week!: string;

    @Column({ type: "boolean", default: false })
    paused_schedule!: boolean;

    @Column({ type: "integer", default: 1 })
    status_schedule!: number;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updated_at!: Date;
}
