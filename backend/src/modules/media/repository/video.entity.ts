import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("video")
export class Video {
    @PrimaryGeneratedColumn()
    id_video!: number;

    @Column({ type: "character varying", length: 255 })
    title_video!: string;

    @Column({ type: "character varying", length: 500, default: "" })
    description_video!: string;

    @Column({ type: "character varying", length: 255 })
    file_name_video!: string;

    @Column({ type: "character varying", length: 500 })
    file_path_video!: string;

    @Column({ type: "character varying", length: 100 })
    mime_type_video!: string;

    @Column({ type: "integer", default: 0 })
    size_video!: number;

    @Column({ type: "integer", default: 0 })
    duration_seconds_video!: number;

    @Column({ type: "integer", default: 1 })
    status_video!: number;
}