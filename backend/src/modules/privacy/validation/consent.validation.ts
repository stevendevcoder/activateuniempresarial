import joi from "joi";
import { CONSENT_VERSION } from "../service/privacy.service";

export interface ConsentAcceptData {
    version: string;
}

function validateConsent(data: any) {
    const schema = joi
        .object({
            version: joi.string().trim().max(20).default(CONSENT_VERSION),
        })
        .unknown(false);
    return schema.validate(data, { abortEarly: false });
}

export const loadConsentData = (data: any): ConsentAcceptData => {
    const { error, value } = validateConsent(data ?? {});
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};
