import { Router } from "express";
import { ScheduleRepository } from "../repository/schedule.repository";
import { AreaRepository } from "../../areas/repository/area.repository";
import { RoutineRepository } from "../../routines/repository/routine.repository";
import { ConfigRepository } from "../../config/repository/config.repository";
import { ConfigService } from "../../config/service/config.service";
import { ScheduleService } from "../service/schedule.service";
import { SchedulerService } from "../service/scheduler.service";
import { ScheduleController } from "../controller/schedule.controller";
import { authenticateToken } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/rbac.middleware";
import { PERMISSIONS } from "../../../config/permissions";

const router = Router();

const scheduleRepository = new ScheduleRepository();
const areaRepository = new AreaRepository();
const routineRepository = new RoutineRepository();
const configService = new ConfigService(new ConfigRepository());
const scheduleService = new ScheduleService(scheduleRepository, areaRepository, routineRepository);
const schedulerService = new SchedulerService(scheduleRepository, configService);
const scheduleController = new ScheduleController(scheduleService, schedulerService);

router.get("/", authenticateToken, requirePermission(PERMISSIONS.schedules.read), (req, res) =>
    scheduleController.getAllSchedules(req, res)
);
router.get("/events", authenticateToken, requirePermission(PERMISSIONS.schedules.read), (req, res) =>
    scheduleController.listEvents(req, res)
);
router.post("/run", authenticateToken, requirePermission(PERMISSIONS.schedules.update), (req, res) =>
    scheduleController.runScheduler(req, res)
);
router.get("/area/:idArea", authenticateToken, requirePermission(PERMISSIONS.schedules.read), (req, res) =>
    scheduleController.getScheduleByArea(req, res)
);
router.post("/", authenticateToken, requirePermission(PERMISSIONS.schedules.create), (req, res) =>
    scheduleController.createSchedule(req, res)
);
router.get("/:id", authenticateToken, requirePermission(PERMISSIONS.schedules.read), (req, res) =>
    scheduleController.getScheduleById(req, res)
);
router.put("/:id", authenticateToken, requirePermission(PERMISSIONS.schedules.update), (req, res) =>
    scheduleController.updateSchedule(req, res)
);
router.delete("/:id", authenticateToken, requirePermission(PERMISSIONS.schedules.delete), (req, res) =>
    scheduleController.deleteSchedule(req, res)
);
router.patch("/:id/pause", authenticateToken, requirePermission(PERMISSIONS.schedules.update), (req, res) =>
    scheduleController.pauseSchedule(req, res)
);
router.patch("/:id/resume", authenticateToken, requirePermission(PERMISSIONS.schedules.update), (req, res) =>
    scheduleController.resumeSchedule(req, res)
);

export default router;
