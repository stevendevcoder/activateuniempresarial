import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("routine_type")
export class RoutineType {
    @PrimaryGeneratedColumn()
    id_routine_type!: number;

    @Column({ type: "character varying", length: 100 })
    name_routine_type!: string;

    @Column({ type: "character varying", length: 255, default: "" })
    description_routine_type!: string;

    @Column({ type: "character varying", length: 50, default: "" })
    icon_routine_type!: string;

    @Column({ type: "character varying", length: 20, default: "" })
    color_routine_type!: string;

    @Column({ type: "integer", default: 1 })
    status_routine_type!: number;
}