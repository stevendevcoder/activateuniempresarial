import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { RoutineType } from "../../routine-types/repository/routine-type.entity";

@Entity("routine")
export class Routine {
    @PrimaryGeneratedColumn()
    id_routine!: number;

    @Column({ type: "character varying", length: 255 })
    name_routine!: string;

    @Column({ type: "character varying", length: 500, default: "" })
    description_routine!: string;

    @Column({ type: "integer" })
    id_routine_type!: number;

    @ManyToOne(() => RoutineType)
    @JoinColumn({ name: "id_routine_type" })
    routineType!: RoutineType;

    @Column({ type: "integer", default: 1 })
    status_routine!: number;
}