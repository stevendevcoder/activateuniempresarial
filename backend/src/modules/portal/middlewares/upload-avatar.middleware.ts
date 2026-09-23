import { NextFunction, Request, Response } from "express";
import multer from "multer";
import crypto from "crypto";
import { AVATAR_ALLOWED_MIME_TYPES, AVATAR_UPLOAD_DIR, MAX_AVATAR_FILE_SIZE, extensionForMime } from "../../../config/media";

const storage = multer.diskStorage({
    destination: AVATAR_UPLOAD_DIR,
    filename: (_req, file, cb) => {
        const extension = extensionForMime(file.mimetype, ".jpg");
        cb(null, `avatar-${Date.now()}-${crypto.randomUUID()}${extension}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_AVATAR_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        if (AVATAR_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(new Error("Formato de imagen no permitido (usa JPG, PNG o WEBP)"));
    },
});

export function uploadAvatarMiddleware(req: Request, res: Response, next: NextFunction): void {
    upload.single("file")(req, res, (error) => {
        if (error) {
            if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
                res.status(400).json({ error: "La imagen supera el tamaño máximo de 5 MB" });
                return;
            }
            res.status(400).json({ error: error.message });
            return;
        }
        next();
    });
}