import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity("global_config")
export class GlobalConfig {
    @PrimaryColumn({ type: "integer" })
    id_config!: number;

    @Column({ type: "varchar", length: 5, default: "12:00" })
    lunch_start!: string;

    @Column({ type: "varchar", length: 5, default: "14:00" })
    lunch_end!: string;

    @Column({ type: "integer", default: 2 })
    max_postponements!: number;

    @Column({ type: "varchar", length: 20, default: "realtime" })
    dashboard_mode!: string;

    @Column({ type: "integer", default: 24 })
    retention_months!: number;

    @UpdateDateColumn({ type: "timestamp" })
    updated_at!: Date;
}
