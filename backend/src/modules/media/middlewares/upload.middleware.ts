import { NextFunction, Request, Response } from "express";
import multer from "multer";
import crypto from "crypto";
import { MEDIA_UPLOAD_DIR, MEDIA_MAX_FILE_SIZE, MEDIA_ALLOWED_MIME_TYPES, extensionForMime } from "../../../config/media";

const storage = multer.diskStorage({
    destination: MEDIA_UPLOAD_DIR,
    filename: (_req, file, cb) => {
        const extension = extensionForMime(file.mimetype, ".mp4");
        cb(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
    },
});

const upload = multer({
    storage,
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