import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  Record<string, unknown>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Record<string, unknown>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: 'Request successful',
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
