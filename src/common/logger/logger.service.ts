import { Injectable, LoggerService, Scope } from '@nestjs/common';

const color = (code: number) => (s: string) => `\x1b[${code}m${s}\x1b[0m`;
const green = color(32);
const red = color(31);
const yellow = color(33);
const blue = color(34);
const gray = color(90);

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements LoggerService {
  log(message: string, context?: string) {
    console.log(
      green(`[LOG]`) + ` ${new Date().toISOString()} - ${context ?? ''}: ${message}`,
    );
  }

  error(message: string, trace?: string, context?: string) {
    console.error(
      red(`[ERROR]`) + ` ${new Date().toISOString()} - ${context ?? ''}: ${message}`,
    );
    if (trace) console.error(gray(trace));
  }

  warn(message: string, context?: string) {
    console.warn(
      yellow(`[WARN]`) + ` ${new Date().toISOString()} - ${context ?? ''}: ${message}`,
    );
  }

  debug(message: string, context?: string) {
    console.debug(
      blue(`[DEBUG]`) + ` ${new Date().toISOString()} - ${context ?? ''}: ${message}`,
    );
  }
}