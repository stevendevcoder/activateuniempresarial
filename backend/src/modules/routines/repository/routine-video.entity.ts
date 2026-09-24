import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Routine } from "./routine.entity";
import { Video } from "../../media/repository/video.entity";

@Entity("routine_video")
export class RoutineVideo {
    @PrimaryGeneratedColumn()
    id_routine_video!: number;

    @Column({ type: "integer" })
    id_routine!: number;

    @Column({ type: "integer" })
    id_video!: number;

    @Column({ type: "integer" })
    duration_seconds!: number;

    @Column({ type: "integer" })
    position!: number;

    @ManyToOne(() => Routine)
    @JoinColumn({ name: "id_routine" })
    routine!: Routine;

    @ManyToOne(() => Video)
    @JoinColumn({ name: "id_video" })
    video!: Video;
}