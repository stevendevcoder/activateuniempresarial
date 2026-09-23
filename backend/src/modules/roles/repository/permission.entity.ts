import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./role.entity";

@Entity("permission")
export class Permission {
    @PrimaryGeneratedColumn()
    id_permission!: number;

    @Column({ type: "character varying", length: 100, unique: true })
    name_permission!: string;

    @Column({ type: "character varying", length: 100 })
    module_permission!: string;

    @Column({ type: "character varying", length: 255, default: "" })
    description_permission!: string;

    @ManyToMany(() => Role, (role) => role.permissions)
    roles!: Role[];
}