import type { NextFunction, Request, RequestHandler, Response } from 'express';

export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export function asyncHandler(handler: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const appError = error instanceof AppError ? error : null;
  const statusCode = appError?.statusCode || 500;

  const response: { message: string; details?: unknown; stack?: string } = {
    message: appError?.message || (error instanceof Error ? error.message : 'Internal Server Error'),
  };

  if (appError?.details) {
    response.details = appError.details;
  }

  if (process.env.NODE_ENV !== 'production') {
    response.stack = error instanceof Error ? error.stack : String(error);
  }

  res.status(statusCode).json(response);
}
