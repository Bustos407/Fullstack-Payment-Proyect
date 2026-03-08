import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();

    if (!request) {
      return next.handle();
    }

    const { method, url, params, query, body } = request as any;

    const safeBody: Record<string, unknown> = { ...(body || {}) };
    if (safeBody.cardToken) {
      safeBody.cardToken = '***';
    }
    if (safeBody.acceptanceToken) {
      safeBody.acceptanceToken = '***';
    }

    this.logger.log(
      `${method} ${url} - params=${JSON.stringify(
        params || {},
      )} query=${JSON.stringify(query || {})} body=${JSON.stringify(
        safeBody,
      )}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsed = Date.now() - now;
          this.logger.log(`${method} ${url} - OK (${elapsed}ms)`);
        },
        error: (err: Error) => {
          const elapsed = Date.now() - now;
          this.logger.error(
            `${method} ${url} - ERROR (${elapsed}ms): ${err.message}`,
            err.stack,
          );
        },
      }),
    );
  }
}

