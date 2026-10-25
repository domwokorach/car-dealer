import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Response } from 'express';
import { Observable, tap } from 'rxjs';
import type { AuthedRequest } from '../request';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<AuthedRequest>();
    const res = http.getResponse<Response>();
    const started = Date.now();
    return next.handle().pipe(
      tap(() => {
        // Log identifiers only, never bodies or tokens.
        this.logger.log(
          `[${req.requestId}] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - started}ms user=${req.user?.id ?? '-'}`,
        );
      }),
    );
  }
}
