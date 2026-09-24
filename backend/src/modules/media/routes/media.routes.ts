import { Router } from "express";
import { VideoRepository } from "../repository/video.repository";
import { MediaService } from "../service/media.service";
import { MediaController } from "../controller/media.controller";
import { authenticateToken } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/rbac.middleware";
import { uploadVideoMiddleware } from "../middlewares/upload.middleware";
import { PERMISSIONS } from "../../../config/permissions";

const router = Router();

const videoRepository = new VideoRepository();
const mediaService = new MediaService(videoRepository);
const mediaController = new MediaController(mediaService);

router.get("/", authenticateToken, requirePermission(PERMISSIONS.media.read), (req, res) =>
    mediaController.getAllVideos(req, res)
);
router.post("/", authenticateToken, requirePermission(PERMISSIONS.media.create), uploadVideoMiddleware, (req, res) =>
    mediaController.uploadVideo(req, res)
);
router.get("/:id", authenticateToken, requirePermission(PERMISSIONS.media.read), (req, res) =>
    mediaController.getVideoById(req, res)
);
router.get("/:id/stream", authenticateToken, requirePermission(PERMISSIONS.media.read), (req, res) =>
    mediaController.streamVideo(req, res)
);
router.put("/:id", authenticateToken, requirePermission(PERMISSIONS.media.update), (req, res) =>
    mediaController.updateVideo(req, res)
);
router.put("/:id/file", authenticateToken, requirePermission(PERMISSIONS.media.update), uploadVideoMiddleware, (req, res) =>
    mediaController.replaceVideoFile(req, res)
);
router.delete("/:id", authenticateToken, requirePermission(PERMISSIONS.media.delete), (req, res) =>
    mediaController.deleteVideo(req, res)
);

export default router;