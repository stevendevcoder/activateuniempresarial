import fs from "fs";
import path from "path";
import envs from "./environment-vars";

export const MEDIA_UPLOAD_DIR = path.resolve(envs.MEDIA_UPLOAD_DIR);

export const MEDIA_MAX_FILE_SIZE = envs.MEDIA_MAX_FILE_SIZE_MB * 1024 * 1024;

export const MEDIA_ALLOWED_MIME_TYPES = envs.MEDIA_ALLOWED_MIME.split(",").map((m) => m.trim());

export const AVATAR_UPLOAD_DIR = path.join(MEDIA_UPLOAD_DIR, "avatars");

export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024;

export const AVATAR_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const MIME_EXTENSION: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/ogg": ".ogv",
    "video/quicktime": ".mov",
};

export function extensionForMime(mime: string, fallback = ".bin"): string {
    return MIME_EXTENSION[mime] ?? fallback;
}

export function ensureUploadDir(): void {
    fs.mkdirSync(MEDIA_UPLOAD_DIR, { recursive: true });
}

export function ensureAvatarUploadDir(): void {
    fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
}