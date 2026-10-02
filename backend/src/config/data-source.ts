import "dotenv/config";
import { DataSource } from "typeorm";
import { User } from "../modules/auth/infrastructure/persistence/user.entity";
import { Role } from "../modules/roles/infrastructure/persistence/role.entity";
import { Permission } from "../modules/roles/infrastructure/persistence/permission.entity";
import { Area } from "../modules/areas/infrastructure/persistence/area.entity";
import { Video } from "../modules/media/infrastructure/persistence/video.entity";
import { RoutineType } from "../modules/routine-types/infrastructure/persistence/routine-type.entity";
import { Routine } from "../modules/routines/infrastructure/persistence/routine.entity";
import { RoutineVideo } from "../modules/routines/infrastructure/persistence/routine-video.entity";
import { Pausa } from "../modules/pausas/infrastructure/persistence/pausa.entity";
import { GlobalConfig } from "../modules/config/infrastructure/persistence/global-config.entity";
import { Holiday } from "../modules/config/infrastructure/persistence/holiday.entity";
import { Schedule } from "../modules/schedules/infrastructure/persistence/schedule.entity";
import { ScheduleEvent } from "../modules/schedules/infrastructure/persistence/schedule-event.entity";
import { PausaEvent } from "../modules/telemetry/infrastructure/persistence/pausa-event.entity";
import { Consent } from "../modules/privacy/infrastructure/persistence/consent.entity";

export default new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL!,
    schema: "users",
    synchronize: false,
    logging: true,
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
    migrations: ["src/migrations/*.ts"],
});
