import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { RoutineType } from "../../../routine-types/infrastructure/persistence/routine-type.entity";

@Entity("routine")
export class Routine {
    @PrimaryGeneratedColumn()
    id_routine!: number;

    @Column({ type: "character varying", length: 255 })
    name_routine!: string;

    @Column({ type: "character varying", length: 500, default: "" })
    description_routine!: string;

    @Column({ type: "integer", nullable: true })
    id_routine_type!: number | null;

    @ManyToOne(() => RoutineType)
    @JoinColumn({ name: "id_routine_type" })
    routineType!: RoutineType | null;

    @Column({ type: "integer", default: 1 })
    status_routine!: number;
}