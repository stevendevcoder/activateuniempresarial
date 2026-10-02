import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("holiday")
export class Holiday {
    @PrimaryGeneratedColumn()
    id_holiday!: number;

    @Column({ type: "date" })
    holiday_date!: string;

    @Column({ type: "varchar", length: 150 })
    name_holiday!: string;

    @Column({ type: "boolean", default: false })
    recurring_holiday!: boolean;

    @Column({ type: "integer", default: 1 })
    status_holiday!: number;
}
