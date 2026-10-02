export class HttpException extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    Object.setPrototypeOf(this, HttpException.prototype);
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string) {
    super(message, 400, "BAD_REQUEST");
    Object.setPrototypeOf(this, BadRequestException.prototype);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string) {
    super(message, 401, "UNAUTHORIZED");
    Object.setPrototypeOf(this, UnauthorizedException.prototype);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string) {
    super(message, 403, "FORBIDDEN");
    Object.setPrototypeOf(this, ForbiddenException.prototype);
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string) {
    super(message, 404, "NOT_FOUND");
    Object.setPrototypeOf(this, NotFoundException.prototype);
  }
}

export class ConflictException extends HttpException {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
    Object.setPrototypeOf(this, ConflictException.prototype);
  }
}

export class InternalServerException extends HttpException {
  constructor(message: string) {
    super(message, 500, "INTERNAL_SERVER_ERROR");
    Object.setPrototypeOf(this, InternalServerException.prototype);
  }
}
