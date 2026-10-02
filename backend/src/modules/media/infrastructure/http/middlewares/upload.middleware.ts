import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { MEDIA_MAX_FILE_SIZE, MEDIA_ALLOWED_MIME_TYPES } from "../../../../../config/media";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MEDIA_MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        if (MEDIA_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(new Error(`Formato de archivo no permitido (${file.originalname})`));
    },
});

export function uploadVideoMiddleware(req: Request, res: Response, next: NextFunction): void {
    upload.single("file")(req, res, (error) => {
        if (error) {
            if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
                res.status(400).json({ error: "El archivo supera el tamaño máximo permitido" });
                return;
            }
            res.status(400).json({ error: error.message });
            return;
        }
        next();
    });
}