export class CustomError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, CustomError.prototype);
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
