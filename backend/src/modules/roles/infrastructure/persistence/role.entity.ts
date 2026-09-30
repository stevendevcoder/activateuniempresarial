import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Permission } from "./permission.entity";

@Entity("role")
export class Role {
    @PrimaryGeneratedColumn()
    id_role!: number;

    @Column({ type: "character varying", length: 100, unique: true })
    name_role!: string;

    @Column({ type: "character varying", length: 255, default: "" })
    description_role!: string;

    @Column({ type: "integer", default: 1 })
    status_role!: number;

    @ManyToMany(() => Permission, (permission) => permission.roles)
    @JoinTable({
        name: "role_permission",
        joinColumn: { name: "id_role", referencedColumnName: "id_role" },
        inverseJoinColumn: { name: "id_permission", referencedColumnName: "id_permission" },
    })
    permissions!: Permission[];
}