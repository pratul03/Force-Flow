import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl } = request;
    const startAt = process.hrtime();

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');
      
      const diff = process.hrtime(startAt);
      const responseTime = Math.round(diff[0] * 1e3 + diff[1] * 1e-6);
      let statusColor = '\x1b[0m'; // Reset
      if (statusCode >= 500) {
        statusColor = '\x1b[31m'; // Red
      } else if (statusCode >= 400) {
        statusColor = '\x1b[33m'; // Yellow
      } else if (statusCode >= 300) {
        statusColor = '\x1b[36m'; // Cyan
      } else if (statusCode >= 200) {
        statusColor = '\x1b[32m'; // Green
      }

      const message = `${method} ${originalUrl} ${statusColor}${statusCode}\x1b[0m ${contentLength || 0} - ${responseTime}ms`;

      if (statusCode >= 500) {
        this.logger.error(message);
      } else if (statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}
