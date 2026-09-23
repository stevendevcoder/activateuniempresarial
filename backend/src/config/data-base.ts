import { DataSource } from "typeorm";
import { User } from "../modules/auth/repository/user.entity";
import envs from "./environment-vars";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: envs.DATABASE_URL,
    schema: "users",
    synchronize: false,
    logging: envs.NODE_ENV === "development",
    entities: [User],
});

export const connectDB = async (): Promise<void> => {
    try {
        await AppDataSource.initialize();
        console.log("Conectado a la base de datos PostgreSQL");
    } catch (error) {
        console.error("Error al conectar a la base de datos:", error);
        process.exit(1);
    }
};