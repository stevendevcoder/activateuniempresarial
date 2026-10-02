import { DomainError } from "../../../../shared/domain/errors";

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super("Credenciales inválidas", "INVALID_CREDENTIALS");
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

export class UserNotFoundError extends DomainError {
  constructor(email: string) {
    super(`Usuario con email ${email} no encontrado`, "USER_NOT_FOUND");
    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }
}

export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`Usuario con email ${email} ya existe`, "USER_ALREADY_EXISTS");
    Object.setPrototypeOf(this, UserAlreadyExistsError.prototype);
  }
}

export class InvalidTokenError extends DomainError {
  constructor() {
    super("Token inválido o expirado", "INVALID_TOKEN");
    Object.setPrototypeOf(this, InvalidTokenError.prototype);
  }
}
