import { DataSource } from "typeorm";
import { User } from "../modules/auth/repository/user.entity";
import { Role } from "../modules/roles/repository/role.entity";
import { Permission } from "../modules/roles/repository/permission.entity";
import { Area } from "../modules/areas/repository/area.entity";
import { Video } from "../modules/media/repository/video.entity";
import { RoutineType } from "../modules/routine-types/repository/routine-type.entity";
import { Routine } from "../modules/routines/repository/routine.entity";
import { RoutineVideo } from "../modules/routines/repository/routine-video.entity";
import { Pausa } from "../modules/pausas/repository/pausa.entity";
import { GlobalConfig } from "../modules/config/repository/global-config.entity";
import { Holiday } from "../modules/config/repository/holiday.entity";
import { Schedule } from "../modules/schedules/repository/schedule.entity";
import { ScheduleEvent } from "../modules/schedules/repository/schedule-event.entity";
import { PausaEvent } from "../modules/telemetry/repository/pausa-event.entity";
import { Consent } from "../modules/privacy/repository/consent.entity";
import envs from "./environment-vars";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: envs.DATABASE_URL,
    schema: "users",
    synchronize: envs.NODE_ENV === "development",
    logging: envs.NODE_ENV === "development",
    entities: [
        User,
        Role,
        Permission,
        Area,
        Video,
        RoutineType,
        Routine,
        RoutineVideo,
        Pausa,
        GlobalConfig,
        Holiday,
        Schedule,
        ScheduleEvent,
        PausaEvent,
        Consent,
    ],
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