import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../auth/repository/user.entity";
import { Area } from "../../areas/repository/area.entity";

@Entity("pausa_event")
export class PausaEvent {
    @PrimaryGeneratedColumn()
    id_pausa_event!: number;

    @Index()
    @Column({ type: "integer" })
    id_user!: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "id_user" })
    user!: User | null;

    @Column({ type: "integer", nullable: true })
    id_pausa!: number | null;

    @Column({ type: "integer", nullable: true })
    id_schedule_event!: number | null;

    @Column({ type: "integer", nullable: true })
    id_area!: number | null;

    @ManyToOne(() => Area, { nullable: true })
    @JoinColumn({ name: "id_area" })
    area!: Area | null;

    @Column({ type: "integer" })
    event_type!: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    reason!: string | null;

    @Index()
    @Column({ type: "timestamp" })
    occurred_at!: Date;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;
}
