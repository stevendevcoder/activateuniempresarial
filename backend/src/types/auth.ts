import { Request } from "express";

export interface AuthUserPayload {
    id: number;
    email: string;
    id_role: number | null;
    idArea: number | null;
    role: string | null;
    permissions: string[];
}

export interface AuthenticatedRequest extends Request {
    user?: AuthUserPayload;
}