export class CustomError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    // Ensure correct prototype chain for subclass instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    // Set error name to the concrete subclass name
    this.name = new.target.name;
  }
}

export class ValidationError extends CustomError {
  constructor(message: string) {
    super(message, 400); // 400 Bad Request
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string) {
    super(message, 401); // 401 Unauthorized
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string) {
    super(message, 403); // 403 Forbidden
  }
}
export class NotFoundError extends CustomError {
  constructor(message: string) {
    super(message, 404); // 404 Not Found
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string) {
    super(message, 500); // 500 Internal Server Error
  }
}

export class ServiceUnavailableError extends CustomError {
  constructor(message: string) {
    super(message, 503); // 503 Service Unavailable
  }
}
