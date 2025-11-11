import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { AppLoggerService } from '../logger/logger.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLoggerService) {}
  
  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const method = req.method;
    const url = req.originalUrl || req.url;

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const status = res.statusCode;
      const contentLength = res.getHeader('content-length');
      const length = typeof contentLength === 'string' ? contentLength : Array.isArray(contentLength) ? contentLength.join(',') : String(contentLength ?? '-');

      this.logger.log(`${method} ${url} ${status} ${durationMs}ms ${length}`);
    });

    next();
  }
}