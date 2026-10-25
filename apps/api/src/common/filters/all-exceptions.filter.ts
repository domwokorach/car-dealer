import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@car-dealer/database';
import type { Response } from 'express';
import type { AuthedRequest } from '../request';

/**
 * Secure error responses: HttpExceptions pass through their intended message; known Prisma errors map
 * to 404/409; everything else is a generic 500. Stack traces, SQL and driver messages never leave the server.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const req = http.getRequest<AuthedRequest>();
    const res = http.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let extra: Record<string, unknown> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') message = body;
      else if (body && typeof body === 'object') {
        const { message: m, issues } = body as { message?: unknown; issues?: unknown };
        message = Array.isArray(m) ? m.join('; ') : typeof m === 'string' ? m : exception.message;
        if (issues) extra = { issues };
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'A conflicting record already exists';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Not found';
      }
    }

    if (status >= 500) {
      this.logger.error(
        `[${req.requestId}] ${req.method} ${req.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res.status(status).json({
      statusCode: status,
      error: HttpStatus[status] ?? 'Error',
      message,
      requestId: req.requestId,
      ...extra,
    });
  }
}
